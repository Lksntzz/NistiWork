use std::collections::HashMap;
use tauri::State;
use crate::database::connection::DbState;
use crate::services::settings_service::SettingsService;

#[tauri::command]
pub fn get_settings(state: State<DbState>) -> Result<HashMap<String, Option<String>>, String> {
    let conn = state.db.lock().map_err(|_| "Falha ao bloquear banco de dados")?;
    SettingsService::get_settings_map(&conn)
}

#[tauri::command]
pub fn save_settings(state: State<DbState>, payload: HashMap<String, Option<String>>) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|_| "Falha ao bloquear banco de dados")?;
    SettingsService::save_settings(&mut conn, payload)
}
