// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod models;
mod repositories;
mod services;
mod integrations;

use std::sync::Mutex;
use tauri::Manager;
use database::connection::{establish_connection, DbState};
use commands::settings_commands::{get_settings, save_settings};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Resolve o diretório de dados do app (ex: AppData/Roaming/com.nisti.work)
            let app_data_dir = app.path().app_data_dir().expect("Falha ao obter diretório de dados da aplicação");
            std::fs::create_dir_all(&app_data_dir).expect("Falha ao criar diretório de dados");
            
            let db_path = app_data_dir.join("nisti_work.db");
            
            let conn = establish_connection(db_path);
            let state = integrations::google_drive::state::GoogleDriveRuntimeState::new();
            
            // Hidratação do estado do Google Drive
            let conn_res = conn.query_row(
                "SELECT id FROM google_drive_connections LIMIT 1",
                [],
                |row| row.get::<_, String>(0)
            );
            
            use rusqlite::OptionalExtension;
            use keyring::Error as KeyringError;
            use integrations::google_drive::state::GoogleDriveConnectionStatus;

            match conn_res.optional() {
                Ok(Some(id)) => {
                    match keyring::Entry::new(integrations::google_drive::token_manager::SERVICE_NAME, &id) {
                        Ok(entry) => {
                            match entry.get_password() {
                                Ok(_) => {
                                    *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::CONNECTED;
                                    println!("Google Drive hydration: CONNECTED (local credential found). id={}", id);
                                }
                                Err(KeyringError::NoEntry) => {
                                    *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::REAUTH_REQUIRED;
                                    println!("Google Drive hydration: REAUTH_REQUIRED (no keyring entry). id={}", id);
                                }
                                Err(e) => {
                                    *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::ERROR(format!("Falha ao acessar Keyring local: {}", e));
                                    println!("Google Drive hydration: ERROR ({:?}). id={}", e, id);
                                }
                            }
                        }
                        Err(e) => {
                            *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::ERROR(format!("Falha ao instanciar Keyring: {}", e));
                            println!("Google Drive hydration: KEYRING INIT ERROR ({:?}). id={}", e, id);
                        }
                    }
                }
                Ok(None) => {
                    println!("Google Drive hydration: DISCONNECTED (no db record).");
                }
                Err(e) => {
                    *state.connection_status.lock().unwrap() = GoogleDriveConnectionStatus::ERROR(format!("Falha ao ler banco local: {}", e));
                    println!("Google Drive hydration: DB ERROR ({:?}).", e);
                }
            }

            app.manage(DbState {
                db: Mutex::new(conn),
            });
            app.manage(state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            commands::company_commands::list_companies,
            commands::company_commands::get_company,
            commands::company_commands::create_company,
            commands::company_commands::update_company,
            commands::company_commands::update_company_status,
            commands::company_commands::delete_company,
            commands::company_commands::get_company_history,
            commands::system_commands::open_local_folder,
            integrations::google_drive::commands::get_drive_status,
            integrations::google_drive::commands::connect_google_drive,
            integrations::google_drive::commands::disconnect_google_drive
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
