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
