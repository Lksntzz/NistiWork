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
        entity_name: "COMPANY".to_string(),
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
        due_date: company.due_date.clone(),
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
    task_repository::update_due_date_by_company(&tx, &company.id, company.due_date.as_deref())?;
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
                entity_name: "COMPANY".to_string(),
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
    
    // Excluir histórico de atividades órfão antes (polimórfico)
    activity_history_repository::delete_by_entity(&tx, "COMPANY", id)?;
    
    // Excluir a empresa (o SQLite removerá a task via ON DELETE CASCADE)
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
    activity_history_repository::list_by_entity(conn, "COMPANY", id)
}
