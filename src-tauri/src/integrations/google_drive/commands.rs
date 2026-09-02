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
            return Err("Conexo j em andamento".to_string());
        }
        let old = status.clone();
        *status = GoogleDriveConnectionStatus::CONNECTING;
        old
    };

    let oauth_config = match state.oauth_config.clone() {
        Some(config) => config,
        None => {
            *state.connection_status.lock().unwrap() = previous_status;
            return Err("Google Drive no configurado no build (ausncia de client_id ou client_secret)".to_string());
        }
    };

    let auth_flow = OAuthFlow::new(oauth_config);
    let new_connection_id = Uuid::new_v4().to_string();

    let auth_result = auth_flow.authenticate().await;

    match auth_result {
        Ok((token_data, userinfo)) => {
            if let Some(refresh_token) = token_data.refresh_token {
                let entry = Entry::new("com.nisti.work.google-drive", &new_connection_id)
                    .map_err(|e| e.to_string())?;
                entry.set_password(&refresh_token).map_err(|e| e.to_string())?;
                
                // Salvar no SQLite
                let db_res = {
                    let mut conn = db_state.db.lock().unwrap();
                    let tx = conn.transaction().map_err(|e| e.to_string())?;
                    
                    // Se houver conexo antiga, apagar
                    let old_id: Option<String> = tx.query_row(
                        "SELECT id FROM google_drive_connections LIMIT 1",
                        [],
                        |row| row.get(0)
                    ).ok();

                    let now = Utc::now().to_rfc3339();
                    tx.execute("DELETE FROM google_drive_connections", [])
                        .map_err(|e| e.to_string())?;
                    
                    let insert_res = tx.execute(
                        "INSERT INTO google_drive_connections (id, account_subject, account_email, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![new_connection_id, userinfo.sub, userinfo.email, now, now]
                    );

                    match insert_res {
                        Ok(_) => {
                            if let Err(e) = tx.commit() {
                                Err(e.to_string())
                            } else {
                                Ok(old_id)
                            }
                        }
                        Err(e) => Err(e.to_string())
                    }
                };

                match db_res {
                    Ok(old_id_opt) => {
                        // Limpar a credencial antiga s depois do commit!
                        if let Some(old) = old_id_opt {
                            if old != new_connection_id {
                                if let Ok(old_entry) = Entry::new("com.nisti.work.google-drive", &old) {
                                    let _ = old_entry.delete_credential();
                                }
                            }
                        }
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
                Err("Google no retornou Refresh Token (garanta access_type=offline sem prompt duplicado ou force consentimento)".to_string())
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
        // Remover SQLite
        {
            let conn = db_state.db.lock().unwrap();
            conn.execute("DELETE FROM google_drive_connections", []).map_err(|e| e.to_string())?;
        }
        // Remover keyring
        if let Ok(entry) = Entry::new("com.nisti.work.google-drive", &old) {
            if let Err(e) = entry.delete_credential() {
                eprintln!("Erro ao apagar keyring (pode j estar vazio): {}", e);
            }
        }
    }
    
    *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::DISCONNECTED;
    Ok(())
}

