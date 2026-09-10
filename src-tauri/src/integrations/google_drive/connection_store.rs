use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};

pub fn current_id(conn: &Connection) -> rusqlite::Result<Option<String>> {
    conn.query_row("SELECT id FROM google_drive_connections LIMIT 1", [], |row| row.get(0))
        .optional()
}

// The caller saves the new credential before this transaction and removes the
// old credential only after it commits. No network operation belongs here.
pub fn replace(conn: &mut Connection, id: &str, subject: &str, email: &str) -> rusqlite::Result<Option<String>> {
    let tx = conn.transaction()?;
    let old: Option<(String, String)> = tx.query_row(
        "SELECT id, account_subject FROM google_drive_connections LIMIT 1", [],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).optional()?;
    let now = Utc::now().to_rfc3339();
    if let Some((old_id, old_subject)) = &old {
        if old_subject == subject {
            // Keep folder selection, sync cursor and original creation date.
            tx.execute(
                "UPDATE google_drive_connections SET id=?1, account_email=?2, updated_at=?3, last_error=NULL WHERE id=?4",
                params![id, email, now, old_id],
            )?;
        } else {
            tx.execute("DELETE FROM google_drive_connections", [])?;
            tx.execute(
                "INSERT INTO google_drive_connections (id, account_subject, account_email, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
                params![id, subject, email, now],
            )?;
        }
    } else {
        tx.execute(
            "INSERT INTO google_drive_connections (id, account_subject, account_email, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
            params![id, subject, email, now],
        )?;
    }
    tx.commit()?;
    Ok(old.map(|(old_id, _)| old_id))
}

pub fn disconnect(conn: &mut Connection) -> rusqlite::Result<Option<String>> {
    let tx = conn.transaction()?;
    let old_id = current_id(&tx)?;
    tx.execute("DELETE FROM google_drive_connections", [])?;
    tx.commit()?;
    Ok(old_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn database() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        crate::database::migrations::run_migrations(&mut conn);
        conn
    }

    #[test]
    fn same_account_preserves_folder_and_cursor_other_account_resets_them() {
        let mut conn = database();
        replace(&mut conn, "old", "account-a", "a@example.test").unwrap();
        conn.execute("UPDATE google_drive_connections SET monitored_folder_id='folder', last_change_token='cursor'", []).unwrap();
        assert_eq!(replace(&mut conn, "new", "account-a", "a@example.test").unwrap().as_deref(), Some("old"));
        let folder: String = conn.query_row("SELECT monitored_folder_id FROM google_drive_connections", [], |r| r.get(0)).unwrap();
        let cursor: String = conn.query_row("SELECT last_change_token FROM google_drive_connections", [], |r| r.get(0)).unwrap();
        assert_eq!((folder.as_str(), cursor.as_str()), ("folder", "cursor"));
        replace(&mut conn, "other", "account-b", "b@example.test").unwrap();
        let folder: Option<String> = conn.query_row("SELECT monitored_folder_id FROM google_drive_connections", [], |r| r.get(0)).unwrap();
        assert!(folder.is_none());
        assert_eq!(current_id(&conn).unwrap().as_deref(), Some("other"));
    }

    #[test]
    fn failed_replacement_rolls_back_old_connection() {
        let mut conn = database();
        replace(&mut conn, "old", "account-a", "a@example.test").unwrap();
        conn.execute_batch("CREATE TRIGGER reject_insert BEFORE INSERT ON google_drive_connections BEGIN SELECT RAISE(ABORT, 'injected failure'); END;").unwrap();
        assert!(replace(&mut conn, "new", "account-b", "b@example.test").is_err());
        assert_eq!(current_id(&conn).unwrap().as_deref(), Some("old"));
    }

    #[test]
    fn failed_logout_preserves_connection_and_missing_table_is_not_disconnected() {
        let mut conn = database();
        replace(&mut conn, "old", "account-a", "a@example.test").unwrap();
        conn.execute_batch("CREATE TRIGGER reject_delete BEFORE DELETE ON google_drive_connections BEGIN SELECT RAISE(ABORT, 'injected failure'); END;").unwrap();
        assert!(disconnect(&mut conn).is_err());
        assert_eq!(current_id(&conn).unwrap().as_deref(), Some("old"));
        assert!(current_id(&Connection::open_in_memory().unwrap()).is_err());
    }
}
