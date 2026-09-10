use std::sync::Mutex;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use super::token_manager::TokenManager;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GoogleDriveConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    SYNCING,
    REAUTH_REQUIRED,
    ERROR(String),
}

#[derive(Clone)]
pub struct GoogleOAuthConfig {
    pub client_id: String,
    pub client_secret: String,
}

pub struct GoogleDriveRuntimeState {
    pub connection_status: Mutex<GoogleDriveConnectionStatus>,
    pub sync_in_progress: Mutex<bool>,
    pub oauth_config: Option<GoogleOAuthConfig>,
    pub token_manager: Arc<TokenManager>,
}

impl GoogleDriveRuntimeState {
    pub fn new() -> Self {
        let client_id = option_env!("DRIVE_CLIENT_ID")
            .unwrap_or("911328452908-82l2jekhsk3kf5agd8ejj8v3aitg8ris.apps.googleusercontent.com")
            .to_string();
        
        let client_secret = option_env!("DRIVE_CLIENT_SECRET").map(|s| s.to_string());
        
        let oauth_config = if let Some(secret) = client_secret {
            if !secret.is_empty() {
                Some(GoogleOAuthConfig { client_id, client_secret: secret })
            } else {
                None
            }
        } else {
            None
        };

        let tm_config = oauth_config.clone().unwrap_or(GoogleOAuthConfig {
            client_id: "".to_string(),
            client_secret: "".to_string(),
        });

        Self {
            connection_status: Mutex::new(GoogleDriveConnectionStatus::DISCONNECTED),
            sync_in_progress: Mutex::new(false),
            oauth_config,
            token_manager: Arc::new(TokenManager::new(tm_config)),
        }
    }
}
