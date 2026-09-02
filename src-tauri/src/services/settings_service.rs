use rusqlite::Connection;
use std::collections::HashMap;
use chrono::Utc;
use crate::repositories::settings_repository::SettingsRepository;

pub struct SettingsService;

impl SettingsService {
    pub fn get_settings_map(conn: &Connection) -> Result<HashMap<String, Option<String>>, String> {
        let settings = SettingsRepository::get_all(conn).map_err(|e| e.to_string())?;
        
        let mut map = HashMap::new();
        for s in settings {
            map.insert(s.key, s.value);
        }
        
        Ok(map)
    }

    pub fn save_settings(conn: &mut Connection, payload: HashMap<String, Option<String>>) -> Result<(), String> {
        let timestamp = Utc::now().to_rfc3339(); // ISO 8601 em UTC
        let mut records = Vec::new();
        
        for (key, value) in payload {
            records.push((key, value, timestamp.clone()));
        }
        
        SettingsRepository::upsert_many(conn, &records).map_err(|e| e.to_string())?;
        Ok(())
    }
}
