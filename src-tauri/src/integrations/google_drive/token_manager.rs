use std::sync::Mutex;
use chrono::{DateTime, Utc};
use keyring::Entry;
use reqwest::Client;
use serde::Deserialize;

use super::state::GoogleOAuthConfig;

const SERVICE_NAME: &str = "com.nisti.work.google-drive";
const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";

pub struct TokenManager {
    access_token: Mutex<Option<String>>,
    expires_at: Mutex<Option<DateTime<Utc>>>,
    client: Client,
    oauth_config: GoogleOAuthConfig,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    expires_in: i64,
}

impl TokenManager {
    pub fn new(oauth_config: GoogleOAuthConfig) -> Self {
        Self {
            access_token: Mutex::new(None),
            expires_at: Mutex::new(None),
            client: Client::new(),
            oauth_config,
        }
    }

    pub fn set_token(&self, access_token: String, expires_in: i64) {
        *self.access_token.lock().unwrap() = Some(access_token);
        *self.expires_at.lock().unwrap() = Some(Utc::now() + chrono::Duration::seconds(expires_in - 60)); // 1 min margin
    }

    pub fn clear(&self) {
        *self.access_token.lock().unwrap() = None;
        *self.expires_at.lock().unwrap() = None;
    }

    pub async fn get_token(&self, connection_id: &str) -> Result<String, String> {
        {
            let mut valid = false;
            if let Some(exp) = *self.expires_at.lock().unwrap() {
                if Utc::now() < exp {
                    valid = true;
                }
            }
            if valid {
                if let Some(token) = self.access_token.lock().unwrap().clone() {
                    return Ok(token);
                }
            }
        }

        let entry = Entry::new(SERVICE_NAME, connection_id).map_err(|_| "Falha ao acessar Keyring".to_string())?;
        let refresh_token = match entry.get_password() {
            Ok(token) => token,
            Err(_) => return Err("Refresh token no encontrado".to_string()),
        };

        let params = [
            ("client_id", self.oauth_config.client_id.as_str()),
            ("client_secret", self.oauth_config.client_secret.as_str()),
            ("refresh_token", refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ];

        let res = self.client.post(TOKEN_URL).form(&params).send().await;
        
        match res {
            Ok(response) => {
                let status = response.status();
                if status.is_success() {
                    if let Ok(data) = response.json::<TokenResponse>().await {
                        self.set_token(data.access_token.clone(), data.expires_in);
                        return Ok(data.access_token);
                    } else {
                        return Err("Falha ao parsear token_response".to_string());
                    }
                } else if status == 400 || status == 401 {
                    // Invalid grant ou revogado
                    return Err("REAUTH_REQUIRED".to_string());
                } else {
                    return Err(format!("Erro HTTP: {}", status));
                }
            }
            Err(e) => {
                return Err(format!("Erro de rede ao renovar token: {}", e));
            }
        }
    }
}

