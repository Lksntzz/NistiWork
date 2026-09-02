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
