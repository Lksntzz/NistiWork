use tauri::State;
use super::state::{GoogleDriveRuntimeState, GoogleDriveConnectionStatus};
use super::auth::OAuthFlow;
use crate::database::connection::DbState;
use chrono::Utc;
use keyring::Entry;
use rusqlite::params;
use uuid::Uuid;

#[tauri::command]
pub fn get_drive_status(state: State<'_, GoogleDriveRuntimeState>) -> Result<String, String> {
    let status = state.connection_status.lock().unwrap();
    Ok(format!("{:?}", *status))
}

#[tauri::command]
pub async fn connect_google_drive(
    state: State<'_, GoogleDriveRuntimeState>,
    db_state: State<'_, DbState>
) -> Result<(), String> {
    let previous_status = {
        let mut status = state.connection_status.lock().unwrap();
        if *status == GoogleDriveConnectionStatus::CONNECTING {
            return Err("Conexão já em andamento".to_string());
        }
        let old = status.clone();
        *status = GoogleDriveConnectionStatus::CONNECTING;
        old
    };

    let oauth_config = match state.oauth_config.clone() {
        Some(config) => config,
        None => {
            *state.connection_status.lock().unwrap() = previous_status;
            return Err("Google Drive não configurado no build (ausência de client_id ou client_secret)".to_string());
        }
    };

    let auth_flow = OAuthFlow::new(oauth_config);
    let new_connection_id = Uuid::new_v4().to_string();

    let auth_result = auth_flow.authenticate().await;

    match auth_result {
        Ok((token_data, userinfo)) => {
            if let Some(refresh_token) = token_data.refresh_token {
                let entry_res = Entry::new(super::token_manager::SERVICE_NAME, &new_connection_id);
                if let Err(e) = entry_res {
                    *state.connection_status.lock().unwrap() = previous_status;
                    return Err(format!("Falha ao instanciar Keyring: {}", e));
                }
                let entry = entry_res.unwrap();
                
                if let Err(e) = entry.set_password(&refresh_token) {
                    *state.connection_status.lock().unwrap() = previous_status;
                    return Err(format!("Falha ao salvar senha no Keyring: {}", e));
                }

                // Verify read-after-write for diagnostic purposes
                if let Err(e) = entry.get_password() {
                    let _ = entry.delete_credential(); // Rollback
                    *state.connection_status.lock().unwrap() = previous_status;
                    return Err(format!("Falha ao confirmar gravação no Keyring: {:?}", e));
                }
                
                // Salvar no SQLite
                let db_res: Result<Option<String>, String> = (|| -> Result<Option<String>, String> {
                    let mut conn = db_state.db.lock().unwrap();
                    let tx = conn.transaction().map_err(|e| e.to_string())?;
                    
                    // Se houver conexão antiga, apagar
                    let old_id: Option<String> = tx.query_row(
                        "SELECT id FROM google_drive_connections LIMIT 1",
                        [],
                        |row| row.get(0)
                    ).ok();

                    let now = Utc::now().to_rfc3339();
                    tx.execute("DELETE FROM google_drive_connections", [])
                        .map_err(|e| e.to_string())?;
                    
                    tx.execute(
                        "INSERT INTO google_drive_connections (id, account_subject, account_email, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![new_connection_id, userinfo.sub, userinfo.email, now, now]
                    ).map_err(|e| e.to_string())?;

                    tx.commit().map_err(|e| e.to_string())?;
                    Ok(old_id)
                })();

                match db_res {
                    Ok(old_id_opt) => {
                        // Limpar a credencial antiga só depois do commit do SQLite!
                        if let Some(old) = old_id_opt {
                            if old != new_connection_id {
                                if let Ok(old_entry) = Entry::new(super::token_manager::SERVICE_NAME, &old) {
                                    let _ = old_entry.delete_credential();
                                }
                            }
                        }

                        // Set the new access token in TokenManager cache
                        if let Some(access_token) = token_data.access_token {
                            let expires_in = token_data.expires_in.unwrap_or(3599);
                            state.token_manager.set_token(&new_connection_id, access_token, expires_in);
                        }
                        
                        println!("Google Drive connected: id={}", new_connection_id);
                        *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::CONNECTED;
                        
                        Ok(())
                    }
                    Err(e) => {
                        // Rollback no Keyring
                        let _ = entry.delete_credential();
                        *state.connection_status.lock().unwrap() = previous_status;
                        Err(format!("Falha ao salvar no banco: {}", e))
                    }
                }
            } else {
                *state.connection_status.lock().unwrap() = previous_status;
                Err("Google não retornou Refresh Token (garanta access_type=offline sem prompt duplicado ou force consentimento)".to_string())
            }
        }
        Err(e) => {
            *state.connection_status.lock().unwrap() = previous_status;
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn disconnect_google_drive(
    state: State<'_, GoogleDriveRuntimeState>,
    db_state: State<'_, DbState>
) -> Result<(), String> {
    let old_id: Option<String> = {
        let conn = db_state.db.lock().unwrap();
        conn.query_row("SELECT id FROM google_drive_connections LIMIT 1", [], |row| row.get(0)).ok()
    };

    if let Some(old) = old_id {
        // Clear in-memory token
        state.token_manager.clear();

        // Optional Revocation Request
        let oauth_config = state.oauth_config.clone();
        if let Ok(entry) = Entry::new(super::token_manager::SERVICE_NAME, &old) {
            if let Ok(refresh_token) = entry.get_password() {
                // Fire and forget remote revocation, bounded to a quick timeout
                let client = reqwest::Client::new();
                let _ = client.post("https://oauth2.googleapis.com/revoke")
                    .form(&[("token", refresh_token)])
                    .timeout(std::time::Duration::from_secs(5))
                    .send()
                    .await;
            }
            if let Err(e) = entry.delete_credential() {
                println!("Erro ao apagar keyring local (pode já estar vazio): {}", e);
            }
        }

        // Remover SQLite
        {
            let mut conn = db_state.db.lock().unwrap();
            let tx = conn.transaction().map_err(|e| e.to_string())?;
            tx.execute("DELETE FROM google_drive_connections", []).map_err(|e| e.to_string())?;
            tx.commit().map_err(|e| e.to_string())?;
        }
        println!("Google Drive disconnected: id={}", old);
    }
    
    *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::DISCONNECTED;
    Ok(())
}
