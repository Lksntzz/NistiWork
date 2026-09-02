use crate::models::company::Company;
use crate::models::activity_history::ActivityHistory;
use crate::services::company_service;
use tauri::State;
use crate::database::connection::DbState;

#[tauri::command]
pub fn list_companies(db: State<'_, DbState>) -> Result<Vec<Company>, String> {
    let conn = db.db.lock().unwrap();
    company_service::list_companies(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_company(id: String, db: State<'_, DbState>) -> Result<Option<Company>, String> {
    let conn = db.db.lock().unwrap();
    company_service::get_company(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_company(company: Company, db: State<'_, DbState>) -> Result<Company, String> {
    let mut conn = db.db.lock().unwrap();
    company_service::create_company(&mut conn, company).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_company(company: Company, db: State<'_, DbState>) -> Result<(), String> {
    let mut conn = db.db.lock().unwrap();
    company_service::update_company(&mut conn, company).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_company_status(id: String, status: String, db: State<'_, DbState>) -> Result<(), String> {
    let mut conn = db.db.lock().unwrap();
    company_service::update_company_status(&mut conn, &id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_company(id: String, db: State<'_, DbState>) -> Result<(), String> {
    let mut conn = db.db.lock().unwrap();
    company_service::delete_company(&mut conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_company_history(id: String, db: State<'_, DbState>) -> Result<Vec<ActivityHistory>, String> {
    let conn = db.db.lock().unwrap();
    company_service::get_company_history(&conn, &id).map_err(|e| e.to_string())
}
