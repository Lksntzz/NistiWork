use std::sync::Mutex;
use std::time::{Duration, Instant};
use reqwest::Client;
use serde::Deserialize;
use super::{credentials, state::GoogleOAuthConfig};

const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";

#[derive(Default)]
struct Session {
    connection_id: Option<String>,
    generation: u64,
    token: Option<(String, Instant)>,
}

pub struct TokenManager {
    session: Mutex<Session>,
    refresh_lock: tokio::sync::Mutex<()>,
    client: Client,
    oauth_config: GoogleOAuthConfig,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    expires_in: i64,
}

#[derive(Deserialize)]
struct OAuthError {
    error: String,
}

// Do not return provider response bodies or error_description to logs/IPC.
pub(super) fn token_error(status: u16, body: &str) -> String {
    let code = serde_json::from_str::<OAuthError>(body).ok().map(|e| e.error);
    match (status, code.as_deref()) {
        (400 | 401, Some("invalid_grant")) => "REAUTH_REQUIRED".to_string(),
        (400 | 401, Some("invalid_client")) => "Configuração do cliente OAuth inválida.".to_string(),
        (403, _) => "Acesso negado: verifique permissões e scopes (HTTP 403).".to_string(),
        (429, _) => "Limite temporário do Google; tente novamente mais tarde.".to_string(),
        (500..=599, _) => "Google temporariamente indisponível; tente novamente.".to_string(),
        _ => format!("Falha no endpoint OAuth (HTTP {}).", status),
    }
}

impl TokenManager {
    pub fn new(oauth_config: GoogleOAuthConfig) -> Self {
        Self {
            session: Mutex::new(Session::default()),
            refresh_lock: tokio::sync::Mutex::new(()),
            client: Client::new(),
            oauth_config,
        }
    }

    pub fn activate(&self, connection_id: &str) {
        let mut session = self.session.lock().unwrap();
        session.generation = session.generation.wrapping_add(1);
        session.connection_id = Some(connection_id.to_string());
        session.token = None;
    }

    pub fn set_token(&self, connection_id: &str, access_token: String, expires_in: i64) {
        let mut session = self.session.lock().unwrap();
        session.generation = session.generation.wrapping_add(1);
        session.connection_id = Some(connection_id.to_string());
        session.token = Self::cached(access_token, expires_in);
    }

    fn cached(token: String, expires_in: i64) -> Option<(String, Instant)> {
        let ttl = u64::try_from(expires_in.saturating_sub(60)).ok()?;
        Some((token, Instant::now().checked_add(Duration::from_secs(ttl))?))
    }

    pub fn clear(&self) {
        let mut session = self.session.lock().unwrap();
        session.generation = session.generation.wrapping_add(1);
        session.connection_id = None;
        session.token = None;
    }

    fn cache_refresh(&self, id: &str, generation: u64, token: String, expires_in: i64) -> Result<String, String> {
        let mut session = self.session.lock().unwrap();
        if session.connection_id.as_deref() != Some(id) || session.generation != generation {
            return Err("A conexão mudou durante a renovação; tente novamente.".to_string());
        }
        session.token = Self::cached(token.clone(), expires_in);
        Ok(token)
    }

    pub async fn get_token(&self, connection_id: &str) -> Result<String, String> {
        // Single flight: each waiter checks the cache again after acquiring this lock.
        // Logout and account replacement never wait for this network lock.
        let _refresh = self.refresh_lock.lock().await;
        let generation = {
            let session = self.session.lock().unwrap();
            if session.connection_id.as_deref() != Some(connection_id) {
                return Err("Conexão não está ativa.".to_string());
            }
            if let Some((token, expires_at)) = &session.token {
                if *expires_at > Instant::now() {
                    return Ok(token.clone());
                }
            }
            session.generation
        };
        if self.oauth_config.client_id.is_empty() || self.oauth_config.client_secret.is_empty() {
            return Err("Google Drive não configurado no build.".to_string());
        }
        let refresh_token = credentials::read(connection_id)?
            .ok_or_else(|| "REAUTH_REQUIRED_NO_ENTRY".to_string())?;
        let params = [
            ("client_id", self.oauth_config.client_id.as_str()),
            ("client_secret", self.oauth_config.client_secret.as_str()),
            ("refresh_token", refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ];
        let response = self.client.post(TOKEN_URL).form(&params)
            .timeout(Duration::from_secs(15)).send().await
            .map_err(|_| "Falha temporária de rede ao renovar token.".to_string())?;
        let status = response.status();
        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(token_error(status.as_u16(), &body));
        }
        let data: TokenResponse = response.json().await
            .map_err(|_| "Resposta inválida ao renovar token.".to_string())?;
        if data.access_token.is_empty() || data.expires_in <= 0 {
            return Err("Resposta inválida ao renovar token.".to_string());
        }
        self.cache_refresh(connection_id, generation, data.access_token, data.expires_in)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn manager() -> TokenManager {
        TokenManager::new(GoogleOAuthConfig { client_id: String::new(), client_secret: String::new() })
    }

    #[test]
    fn late_refresh_cannot_restore_logged_out_or_replaced_session() {
        let tm = manager();
        tm.activate("a");
        let generation = tm.session.lock().unwrap().generation;
        tm.clear();
        assert!(tm.cache_refresh("a", generation, "late".into(), 3600).is_err());
        tm.activate("a"); // Even reconnecting the same identity invalidates old responses.
        assert!(tm.cache_refresh("a", generation, "late".into(), 3600).is_err());
        tm.set_token("b", "current".into(), 3600);
        assert!(tm.cache_refresh("a", generation, "late".into(), 3600).is_err());
        assert_eq!(tm.session.lock().unwrap().token.as_ref().unwrap().0, "current");
    }

    #[tokio::test]
    async fn cached_token_is_scoped_to_active_connection() {
        let tm = manager();
        tm.set_token("a", "current".into(), 3600);
        assert_eq!(tm.get_token("a").await.unwrap(), "current");
        assert!(tm.get_token("b").await.is_err());
        tm.clear();
        assert!(tm.get_token("a").await.is_err());
    }

    #[test]
    fn only_exact_invalid_grant_requires_reauth_and_bodies_are_not_exposed() {
        assert_eq!(token_error(400, r#"{"error":"invalid_grant"}"#), "REAUTH_REQUIRED");
        assert_ne!(token_error(400, r#"{"error":"invalid_client"}"#), "REAUTH_REQUIRED");
        let error = token_error(400, r#"{"error":"other","error_description":"revoked SECRET"}"#);
        assert!(!error.contains("SECRET"));
        assert_ne!(error, "REAUTH_REQUIRED");
        assert_ne!(token_error(503, r#"{"error":"invalid_grant"}"#), "REAUTH_REQUIRED");
    }
}
