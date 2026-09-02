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
