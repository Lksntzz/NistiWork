// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod models;
mod repositories;
mod services;

use std::sync::Mutex;
use tauri::Manager;
use database::connection::{establish_connection, DbState};
use commands::settings_commands::{get_settings, save_settings};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Resolve o diretório de dados do app (ex: AppData/Roaming/com.nisti.work)
            let app_data_dir = app.path().app_data_dir().expect("Falha ao obter diretório de dados da aplicação");
            std::fs::create_dir_all(&app_data_dir).expect("Falha ao criar diretório de dados");
            
            let db_path = app_data_dir.join("nisti_work.db");
            
            let conn = establish_connection(db_path);
            app.manage(DbState {
                db: Mutex::new(conn),
            });
            
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
