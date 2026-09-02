use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: Option<String>,
    pub updated_at: String, // UTC ISO 8601
}
