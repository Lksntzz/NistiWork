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
            
            // Local-only hydration: no Google request is needed at startup.
            use integrations::google_drive::{connection_store, credentials};
            use integrations::google_drive::state::GoogleDriveConnectionStatus;
            let status = match connection_store::current_id(&conn) {
                Ok(Some(id)) => {
                    state.token_manager.activate(&id);
                    match credentials::read(&id) {
                        Ok(Some(_)) => GoogleDriveConnectionStatus::CONNECTED,
                        Ok(None) => GoogleDriveConnectionStatus::REAUTH_REQUIRED,
                        Err(message) => GoogleDriveConnectionStatus::ERROR(message),
                    }
                }
                Ok(None) => GoogleDriveConnectionStatus::DISCONNECTED,
                Err(_) => GoogleDriveConnectionStatus::ERROR("Não foi possível ler a conexão no banco local.".to_string()),
            };
            *state.connection_status.lock().unwrap() = status;

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
