const fs = require('fs');
const path = require('path');

const write = (p, content) => {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, content.trim() + '\n');
};

const src = 'src-tauri/src';

// MODELS
write(`${src}/models/company.rs`, `
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Company {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub entry_date: String,
    pub priority: String,
    pub status: String,
    pub local_folder_path: Option<String>,
    pub drive_folder_id: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
`);

write(`${src}/models/task.rs`, `
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub priority: String,
    pub status: String,
    pub due_date: Option<String>,
    pub company_id: Option<String>,
    pub cover_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
`);

write(`${src}/models/activity_history.rs`, `
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityHistory {
    pub id: String,
    pub entity_name: String,
    pub entity_id: String,
    pub action: String,
    pub previous_status: Option<String>,
    pub new_status: Option<String>,
    pub metadata: Option<String>,
    pub timestamp: String,
}
`);

write(`${src}/models/mod.rs`, `
pub mod settings;
pub mod company;
pub mod task;
pub mod activity_history;
`);

// REPOSITORIES
write(`${src}/repositories/company_repository.rs`, `
use crate::models::company::Company;
use rusqlite::{params, Connection, Result};

pub fn insert(conn: &Connection, company: &Company) -> Result<()> {
    conn.execute(
        "INSERT INTO companies (id, name, description, entry_date, priority, status, local_folder_path, drive_folder_id, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            company.id, company.name, company.description, company.entry_date,
            company.priority, company.status, company.local_folder_path,
            company.drive_folder_id, company.notes, company.created_at, company.updated_at
        ],
    )?;
    Ok(())
}

pub fn update(conn: &Connection, company: &Company) -> Result<()> {
    conn.execute(
        "UPDATE companies SET name = ?1, description = ?2, entry_date = ?3, priority = ?4,
         status = ?5, local_folder_path = ?6, drive_folder_id = ?7, notes = ?8, updated_at = ?9
         WHERE id = ?10",
        params![
            company.name, company.description, company.entry_date, company.priority,
            company.status, company.local_folder_path, company.drive_folder_id,
            company.notes, company.updated_at, company.id
        ],
    )?;
    Ok(())
}

pub fn update_status(conn: &Connection, id: &str, status: &str, updated_at: &str) -> Result<()> {
    conn.execute(
        "UPDATE companies SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![status, updated_at, id],
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    // Delete Tasks explicitly if we don't enable FK constraints with CASCADE right away
    conn.execute("DELETE FROM tasks WHERE company_id = ?1", params![id])?;
    // Delete Activity History
    conn.execute("DELETE FROM activity_history WHERE entity_name = 'company' AND entity_id = ?1", params![id])?;
    // Delete Company
    conn.execute("DELETE FROM companies WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Option<Company>> {
    let mut stmt = conn.prepare("SELECT id, name, description, entry_date, priority, status, local_folder_path, drive_folder_id, notes, created_at, updated_at FROM companies WHERE id = ?1")?;
    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Company {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            entry_date: row.get(3)?,
            priority: row.get(4)?,
            status: row.get(5)?,
            local_folder_path: row.get(6)?,
            drive_folder_id: row.get(7)?,
            notes: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn list(conn: &Connection) -> Result<Vec<Company>> {
    let mut stmt = conn.prepare("SELECT id, name, description, entry_date, priority, status, local_folder_path, drive_folder_id, notes, created_at, updated_at FROM companies ORDER BY created_at DESC")?;
    let rows = stmt.query_map([], |row| {
        Ok(Company {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            entry_date: row.get(3)?,
            priority: row.get(4)?,
            status: row.get(5)?,
            local_folder_path: row.get(6)?,
            drive_folder_id: row.get(7)?,
            notes: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    })?;

    let mut companies = Vec::new();
    for company in rows {
        companies.push(company?);
    }
    Ok(companies)
}
`);

write(`${src}/repositories/task_repository.rs`, `
use crate::models::task::Task;
use rusqlite::{params, Connection, Result};

pub fn insert(conn: &Connection, task: &Task) -> Result<()> {
    conn.execute(
        "INSERT INTO tasks (id, title, priority, status, due_date, company_id, cover_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            task.id, task.title, task.priority, task.status, task.due_date,
            task.company_id, task.cover_id, task.created_at, task.updated_at
        ],
    )?;
    Ok(())
}

pub fn update_status_by_company(conn: &Connection, company_id: &str, status: &str, updated_at: &str) -> Result<()> {
    conn.execute(
        "UPDATE tasks SET status = ?1, updated_at = ?2 WHERE company_id = ?3",
        params![status, updated_at, company_id],
    )?;
    Ok(())
}
`);

write(`${src}/repositories/activity_history_repository.rs`, `
use crate::models::activity_history::ActivityHistory;
use rusqlite::{params, Connection, Result};

pub fn insert(conn: &Connection, history: &ActivityHistory) -> Result<()> {
    conn.execute(
        "INSERT INTO activity_history (id, entity_name, entity_id, action, previous_status, new_status, metadata, timestamp)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            history.id, history.entity_name, history.entity_id, history.action,
            history.previous_status, history.new_status, history.metadata, history.timestamp
        ],
    )?;
    Ok(())
}

pub fn list_by_entity(conn: &Connection, entity_name: &str, entity_id: &str) -> Result<Vec<ActivityHistory>> {
    let mut stmt = conn.prepare("SELECT id, entity_name, entity_id, action, previous_status, new_status, metadata, timestamp FROM activity_history WHERE entity_name = ?1 AND entity_id = ?2 ORDER BY timestamp DESC")?;
    let rows = stmt.query_map(params![entity_name, entity_id], |row| {
        Ok(ActivityHistory {
            id: row.get(0)?,
            entity_name: row.get(1)?,
            entity_id: row.get(2)?,
            action: row.get(3)?,
            previous_status: row.get(4)?,
            new_status: row.get(5)?,
            metadata: row.get(6)?,
            timestamp: row.get(7)?,
        })
    })?;

    let mut history = Vec::new();
    for h in rows {
        history.push(h?);
    }
    Ok(history)
}
`);

write(`${src}/repositories/mod.rs`, `
pub mod settings_repository;
pub mod company_repository;
pub mod task_repository;
pub mod activity_history_repository;
`);

// SERVICES
write(`${src}/services/company_service.rs`, `
use crate::models::{company::Company, task::Task, activity_history::ActivityHistory};
use crate::repositories::{company_repository, task_repository, activity_history_repository};
use rusqlite::{Connection, Result};
use chrono::Utc;
use uuid::Uuid;

fn sync_task_status(company_status: &str) -> &'static str {
    match company_status {
        "NOVA" => "PENDENTE",
        "CONCLUIDA" => "CONCLUIDA",
        _ => "EM_ANDAMENTO",
    }
}

pub fn create_company(conn: &mut Connection, mut company: Company) -> Result<Company> {
    let tx = conn.transaction()?;
    
    let now = Utc::now().to_rfc3339();
    company.id = Uuid::new_v4().to_string();
    company.status = "NOVA".to_string();
    company.created_at = now.clone();
    company.updated_at = now.clone();
    
    company_repository::insert(&tx, &company)?;
    
    let history = ActivityHistory {
        id: Uuid::new_v4().to_string(),
        entity_name: "company".to_string(),
        entity_id: company.id.clone(),
        action: "COMPANY_CREATED".to_string(),
        previous_status: None,
        new_status: Some("NOVA".to_string()),
        metadata: None,
        timestamp: now.clone(),
    };
    activity_history_repository::insert(&tx, &history)?;
    
    let task = Task {
        id: Uuid::new_v4().to_string(),
        title: format!("Produzir arte/mockup — {}", company.name),
        priority: company.priority.clone(),
        status: "PENDENTE".to_string(),
        due_date: None,
        company_id: Some(company.id.clone()),
        cover_id: None,
        created_at: now.clone(),
        updated_at: now.clone(),
    };
    task_repository::insert(&tx, &task)?;
    
    tx.commit()?;
    Ok(company)
}

pub fn update_company(conn: &mut Connection, mut company: Company) -> Result<()> {
    let tx = conn.transaction()?;
    company.updated_at = Utc::now().to_rfc3339();
    company_repository::update(&tx, &company)?;
    tx.commit()?;
    Ok(())
}

pub fn update_company_status(conn: &mut Connection, id: &str, new_status: &str) -> Result<()> {
    let tx = conn.transaction()?;
    
    let company_opt = company_repository::get_by_id(&tx, id)?;
    if let Some(company) = company_opt {
        if company.status != new_status {
            let now = Utc::now().to_rfc3339();
            
            company_repository::update_status(&tx, id, new_status, &now)?;
            
            let task_status = sync_task_status(new_status);
            task_repository::update_status_by_company(&tx, id, task_status, &now)?;
            
            let history = ActivityHistory {
                id: Uuid::new_v4().to_string(),
                entity_name: "company".to_string(),
                entity_id: id.to_string(),
                action: "COMPANY_STATUS_CHANGED".to_string(),
                previous_status: Some(company.status.clone()),
                new_status: Some(new_status.to_string()),
                metadata: None,
                timestamp: now.clone(),
            };
            activity_history_repository::insert(&tx, &history)?;
        }
    }
    
    tx.commit()?;
    Ok(())
}

pub fn delete_company(conn: &mut Connection, id: &str) -> Result<()> {
    let tx = conn.transaction()?;
    company_repository::delete(&tx, id)?;
    tx.commit()?;
    Ok(())
}

pub fn list_companies(conn: &Connection) -> Result<Vec<Company>> {
    company_repository::list(conn)
}

pub fn get_company(conn: &Connection, id: &str) -> Result<Option<Company>> {
    company_repository::get_by_id(conn, id)
}

pub fn get_company_history(conn: &Connection, id: &str) -> Result<Vec<ActivityHistory>> {
    activity_history_repository::list_by_entity(conn, "company", id)
}
`);

write(`${src}/services/mod.rs`, `
pub mod settings_service;
pub mod company_service;
`);

// COMMANDS
write(`${src}/commands/company_commands.rs`, `
use crate::models::company::Company;
use crate::models::activity_history::ActivityHistory;
use crate::services::company_service;
use tauri::State;
use std::sync::Mutex;
use rusqlite::Connection;

#[tauri::command]
pub fn list_companies(db: State<'_, Mutex<Connection>>) -> Result<Vec<Company>, String> {
    let conn = db.lock().unwrap();
    company_service::list_companies(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_company(id: String, db: State<'_, Mutex<Connection>>) -> Result<Option<Company>, String> {
    let conn = db.lock().unwrap();
    company_service::get_company(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_company(company: Company, db: State<'_, Mutex<Connection>>) -> Result<Company, String> {
    let mut conn = db.lock().unwrap();
    company_service::create_company(&mut conn, company).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_company(company: Company, db: State<'_, Mutex<Connection>>) -> Result<(), String> {
    let mut conn = db.lock().unwrap();
    company_service::update_company(&mut conn, company).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_company_status(id: String, status: String, db: State<'_, Mutex<Connection>>) -> Result<(), String> {
    let mut conn = db.lock().unwrap();
    company_service::update_company_status(&mut conn, &id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_company(id: String, db: State<'_, Mutex<Connection>>) -> Result<(), String> {
    let mut conn = db.lock().unwrap();
    company_service::delete_company(&mut conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_company_history(id: String, db: State<'_, Mutex<Connection>>) -> Result<Vec<ActivityHistory>, String> {
    let conn = db.lock().unwrap();
    company_service::get_company_history(&conn, &id).map_err(|e| e.to_string())
}
`);

write(`${src}/commands/mod.rs`, `
pub mod settings_commands;
pub mod company_commands;
`);
