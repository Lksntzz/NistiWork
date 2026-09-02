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
