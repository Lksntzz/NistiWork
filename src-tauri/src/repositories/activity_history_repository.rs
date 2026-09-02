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

pub fn delete_by_entity(conn: &Connection, entity_name: &str, entity_id: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM activity_history WHERE entity_name = ?1 AND entity_id = ?2",
        params![entity_name, entity_id],
    )?;
    Ok(())
}
