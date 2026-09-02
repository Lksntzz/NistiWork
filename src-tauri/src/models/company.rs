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
