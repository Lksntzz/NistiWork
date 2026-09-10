use std::sync::Mutex;
use chrono::{DateTime, Utc};
use keyring::Entry;
use reqwest::Client;
use serde::Deserialize;
use super::state::GoogleOAuthConfig;

pub const SERVICE_NAME: &str = "com.nisti.work.google-drive";
const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";

pub struct TokenManager {
    cached_token: Mutex<Option<(String, String)>>, // (connection_id, access_token)
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
            cached_token: Mutex::new(None),
            expires_at: Mutex::new(None),
            client: Client::new(),
            oauth_config,
        }
    }

    pub fn set_token(&self, connection_id: &str, access_token: String, expires_in: i64) {
        *self.cached_token.lock().unwrap() = Some((connection_id.to_string(), access_token));
        *self.expires_at.lock().unwrap() = Some(Utc::now() + chrono::Duration::seconds(expires_in - 60)); // 1 min margin
    }

    pub fn clear(&self) {
        *self.cached_token.lock().unwrap() = None;
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
                if let Some((cached_id, token)) = self.cached_token.lock().unwrap().clone() {
                    if cached_id == connection_id {
                        return Ok(token);
                    }
                }
            }
        }

        let entry = match Entry::new(SERVICE_NAME, connection_id) {
            Ok(e) => e,
            Err(e) => return Err(format!("Falha ao acessar Keyring local: {}", e)),
        };

        let refresh_token = match entry.get_password() {
            Ok(token) => token,
            Err(keyring::Error::NoEntry) => {
                return Err("REAUTH_REQUIRED_NO_ENTRY".to_string());
            },
            Err(e) => return Err(format!("Erro ao ler credencial do Keyring: {:?}", e)),
        };

        let params = [
            ("client_id", self.oauth_config.client_id.as_str()),
            ("client_secret", self.oauth_config.client_secret.as_str()),
            ("refresh_token", refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ];

        // Ensure we serialize concurrent renewals properly by dropping the lock, which we did.
        let res = match self.client.post(TOKEN_URL).form(&params).timeout(std::time::Duration::from_secs(15)).send().await {
            Ok(r) => r,
            Err(e) => return Err(format!("Erro de rede ao renovar token: {}", e)),
        };

        let status = res.status();
        
        if status.is_success() {
            if let Ok(data) = res.json::<TokenResponse>().await {
                self.set_token(connection_id, data.access_token.clone(), data.expires_in);
                return Ok(data.access_token);
            } else {
                return Err("Falha ao parsear token_response".to_string());
            }
        } else if status == 400 || status == 401 {
            let err_body = res.text().await.unwrap_or_default();
            if err_body.contains("invalid_grant") || err_body.contains("revoked") {
                return Err("REAUTH_REQUIRED".to_string());
            } else if err_body.contains("invalid_client") {
                return Err("Configuração do cliente OAuth inválida (client_id / client_secret).".to_string());
            } else {
                return Err(format!("Erro temporário ou configuração (HTTP {}): {}", status, err_body));
            }
        } else if status == 403 {
            return Err("Acesso negado: verifique permissões e scopes do projeto no Google Cloud (HTTP 403).".to_string());
        } else {
            return Err(format!("Erro HTTP no servidor Google: {}", status));
        }
    }
}
