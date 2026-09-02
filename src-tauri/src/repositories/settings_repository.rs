use rusqlite::{Connection, Result, params};
use crate::models::settings::Setting;

pub struct SettingsRepository;

impl SettingsRepository {
    pub fn get_all(conn: &Connection) -> Result<Vec<Setting>> {
        let mut stmt = conn.prepare("SELECT key, value, updated_at FROM settings")?;
        
        let settings_iter = stmt.query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })?;

        let mut settings = Vec::new();
        for setting in settings_iter {
            settings.push(setting?);
        }

        Ok(settings)
    }

    pub fn upsert_many(conn: &mut Connection, records: &[(String, Option<String>, String)]) -> Result<()> {
        let tx = conn.transaction()?;
        {
            let mut stmt = tx.prepare(
                "INSERT INTO settings (key, value, updated_at) 
                 VALUES (?1, ?2, ?3)
                 ON CONFLICT(key) DO UPDATE SET 
                 value = excluded.value, 
                 updated_at = excluded.updated_at"
            )?;
            for (key, value, updated_at) in records {
                stmt.execute(params![key, value, updated_at])?;
            }
        }
        tx.commit()?;
        Ok(())
    }
}
