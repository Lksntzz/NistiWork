use tauri::State;
use super::state::{GoogleDriveRuntimeState, GoogleDriveConnectionStatus};
use super::{auth::OAuthFlow, connection_store, credentials};
use crate::database::connection::DbState;
use uuid::Uuid;

#[derive(serde::Serialize)]
pub struct DriveStatus {
    status: &'static str,
    message: Option<String>,
}

#[tauri::command]
pub fn get_drive_status(state: State<'_, GoogleDriveRuntimeState>) -> Result<DriveStatus, String> {
    let status = state.connection_status.lock().unwrap();
    let (code, message) = match &*status {
        GoogleDriveConnectionStatus::DISCONNECTED => ("DISCONNECTED", None),
        GoogleDriveConnectionStatus::CONNECTING => ("CONNECTING", None),
        GoogleDriveConnectionStatus::CONNECTED => ("CONNECTED", None),
        GoogleDriveConnectionStatus::SYNCING => ("SYNCING", None),
        GoogleDriveConnectionStatus::REAUTH_REQUIRED => ("REAUTH_REQUIRED", Some("A credencial local está ausente ou precisa de nova autorização.".to_string())),
        GoogleDriveConnectionStatus::ERROR(message) => ("ERROR", Some(message.clone())),
    };
    Ok(DriveStatus { status: code, message })
}

// Restore UI state on every early return, including cancellation of the future.
// This owns a status value, never a MutexGuard across await.
struct Connecting<'a> {
    state: &'a GoogleDriveRuntimeState,
    previous: Option<GoogleDriveConnectionStatus>,
}

impl<'a> Connecting<'a> {
    fn begin(state: &'a GoogleDriveRuntimeState) -> Self {
        let previous = std::mem::replace(
            &mut *state.connection_status.lock().unwrap(),
            GoogleDriveConnectionStatus::CONNECTING,
        );
        Self { state, previous: Some(previous) }
    }

    fn complete(&mut self) {
        *self.state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::CONNECTED;
        self.previous = None;
    }
}

impl Drop for Connecting<'_> {
    fn drop(&mut self) {
        if let Some(previous) = self.previous.take() {
            *self.state.connection_status.lock().unwrap() = previous;
        }
    }
}

#[tauri::command]
pub async fn connect_google_drive(
    state: State<'_, GoogleDriveRuntimeState>,
    db_state: State<'_, DbState>,
) -> Result<(), String> {
    // No queued login may silently reconnect after a logout.
    let _operation = state.auth_operation.try_lock()
        .map_err(|_| "Há uma operação de conexão em andamento. Aguarde.".to_string())?;
    let config = state.oauth_config.clone()
        .ok_or_else(|| "Google Drive não configurado no build.".to_string())?;
    let mut progress = Connecting::begin(&state);
    let (token_data, userinfo) = OAuthFlow::new(config).authenticate().await?;
    let refresh_token = token_data.refresh_token
        .filter(|token| !token.is_empty())
        .ok_or_else(|| "Google não retornou uma credencial de acesso offline. Autorize novamente.".to_string())?;
    if token_data.access_token.is_empty() || token_data.expires_in <= 0 || userinfo.sub.is_empty() {
        return Err("Google retornou uma resposta de autenticação inválida.".to_string());
    }
    let new_id = Uuid::new_v4().to_string();
    credentials::save_verified(&new_id, &refresh_token)?;
    // There is no await between credential creation and commit/rollback.
    let result = {
        let mut conn = db_state.db.lock().unwrap();
        connection_store::replace(&mut conn, &new_id, &userinfo.sub, &userinfo.email)
    };
    let old_id = match result {
        Ok(id) => id,
        Err(_) => {
            if credentials::remove(&new_id).is_err() {
                eprintln!("Google Drive: falha ao limpar nova credencial após rollback SQLite.");
            }
            return Err("Não foi possível salvar a conexão no banco local. A conexão anterior foi preservada.".to_string());
        }
    };
    // TokenResponse has String/i64 fields, not Options.
    state.token_manager.set_token(&new_id, token_data.access_token, token_data.expires_in);
    progress.complete();
    if let Some(old_id) = old_id {
        if old_id != new_id && credentials::remove(&old_id).is_err() {
            eprintln!("Google Drive: conexão salva; falha ao remover credencial anterior.");
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn disconnect_google_drive(
    state: State<'_, GoogleDriveRuntimeState>,
    db_state: State<'_, DbState>,
) -> Result<Option<String>, String> {
    let _operation = state.auth_operation.try_lock()
        .map_err(|_| "Há uma operação de conexão em andamento. Aguarde.".to_string())?;
    // Commit the local logout first. A DB failure leaves the old session intact.
    let old_id = {
        let mut conn = db_state.db.lock().unwrap();
        connection_store::disconnect(&mut conn)
            .map_err(|_| "Não foi possível desconectar no banco local. Tente novamente.".to_string())?
    };
    state.token_manager.clear();
    *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::DISCONNECTED;
    let mut warning = None;
    if let Some(old_id) = old_id {
        let refresh_token = credentials::read(&old_id).ok().flatten();
        if let Err(message) = credentials::remove(&old_id) {
            warning = Some(format!("Desconectado no aplicativo. {}", message));
        }
        // Keep the operation lock until this bounded attempt ends, so an old
        // grant revocation cannot race with a new consent for the same account.
        if let Some(refresh_token) = refresh_token {
            let _ = reqwest::Client::new().post("https://oauth2.googleapis.com/revoke")
                .form(&[("token", refresh_token)])
                .timeout(std::time::Duration::from_secs(5)).send().await;
        }
    }
    Ok(warning)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn failed_or_cancelled_connect_restores_previous_status() {
        let state = GoogleDriveRuntimeState::new();
        *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::CONNECTED;
        { let _progress = Connecting::begin(&state); }
        assert_eq!(*state.connection_status.lock().unwrap(), GoogleDriveConnectionStatus::CONNECTED);
    }

    #[tokio::test]
    async fn auth_operations_do_not_overlap() {
        let state = GoogleDriveRuntimeState::new();
        let operation = state.auth_operation.try_lock().unwrap();
        assert!(state.auth_operation.try_lock().is_err());
        drop(operation);
        assert!(state.auth_operation.try_lock().is_ok());
    }
}
