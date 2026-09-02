use rand::RngCore;
use sha2::{Sha256, Digest};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use reqwest::Client;
use serde::Deserialize;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use url::Url;
use std::time::Duration;

#[derive(Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: i64,
}

#[derive(Deserialize)]
pub struct UserInfo {
    pub sub: String,
    pub email: String,
}

#[derive(Deserialize)]
struct GoogleErrorResponse {
    error: Option<String>,
    error_description: Option<String>,
}

use super::state::GoogleOAuthConfig;

pub struct OAuthFlow {
    pub oauth_config: GoogleOAuthConfig,
}

impl OAuthFlow {
    pub fn new(oauth_config: GoogleOAuthConfig) -> Self {
        Self { oauth_config }
    }

    fn generate_pkce() -> (String, String) {
        let mut verifier_bytes = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut verifier_bytes);
        let verifier = URL_SAFE_NO_PAD.encode(verifier_bytes);

        let mut hasher = Sha256::new();
        hasher.update(verifier.as_bytes());
        let challenge = URL_SAFE_NO_PAD.encode(hasher.finalize());

        (verifier, challenge)
    }

    fn generate_state() -> String {
        let mut state_bytes = [0u8; 16];
        rand::thread_rng().fill_bytes(&mut state_bytes);
        URL_SAFE_NO_PAD.encode(state_bytes)
    }

    pub async fn authenticate(&self) -> Result<(TokenResponse, UserInfo), String> {
        let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
        let port = listener.local_addr().map_err(|e| e.to_string())?.port();
        let redirect_uri = format!("http://127.0.0.1:{}", port);

        let (verifier, challenge) = Self::generate_pkce();
        let state = Self::generate_state();

        let mut auth_url = Url::parse("https://accounts.google.com/o/oauth2/v2/auth").unwrap();
        auth_url.query_pairs_mut()
            .append_pair("client_id", &self.oauth_config.client_id)
            .append_pair("redirect_uri", &redirect_uri)
            .append_pair("response_type", "code")
            .append_pair("scope", "https://www.googleapis.com/auth/drive openid email")
            .append_pair("access_type", "offline")
            .append_pair("prompt", "consent") // Força emissão do refresh_token
            .append_pair("state", &state)
            .append_pair("code_challenge", &challenge)
            .append_pair("code_challenge_method", "S256");

        open::that(auth_url.as_str()).map_err(|e| format!("Falha ao abrir navegador: {}", e))?;

        let accept_future = async {
            let (mut socket, _) = listener.accept().await.map_err(|e| e.to_string())?;
            let mut buf = [0; 4096];
            let n = socket.read(&mut buf).await.map_err(|e| e.to_string())?;
            let request = String::from_utf8_lossy(&buf[..n]);
            
            let mut code = String::new();
            let mut ret_state = String::new();

            if let Some(line) = request.lines().next() {
                if let Some(path) = line.split_whitespace().nth(1) {
                    let parsed_url = Url::parse(&format!("http://127.0.0.1{}", path)).map_err(|e| e.to_string())?;
                    for (k, v) in parsed_url.query_pairs() {
                        if k == "code" {
                            code = v.to_string();
                        } else if k == "state" {
                            ret_state = v.to_string();
                        }
                    }
                }
            }

            let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n<html><body><h2>Conexo concluida. Voce pode fechar esta janela.</h2><script>window.close();</script></body></html>";
            let _ = socket.write_all(response.as_bytes()).await;

            if ret_state != state {
                return Err("State invlido (possvel CSRF)".to_string());
            }
            if code.is_empty() {
                return Err("Autorizao negada pelo usurio".to_string());
            }

            Ok(code)
        };

        let code = match tokio::time::timeout(Duration::from_secs(180), accept_future).await {
            Ok(res) => res?,
            Err(_) => return Err("Timeout aguardando autorizao".to_string()),
        };

        let client = Client::new();
        let params = [
            ("client_id", self.oauth_config.client_id.as_str()),
            ("client_secret", self.oauth_config.client_secret.as_str()),
            ("code", code.as_str()),
            ("code_verifier", verifier.as_str()),
            ("redirect_uri", redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ];

        let token_res = client.post("https://oauth2.googleapis.com/token")
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Erro de rede ao buscar token: {}", e))?;
        
        let token_status = token_res.status();
        if !token_status.is_success() {
            let error_text = token_res.text().await.unwrap_or_default();
            let err_json: Result<GoogleErrorResponse, _> = serde_json::from_str(&error_text);
            if let Ok(g_err) = err_json {
                return Err(format!("Google token endpoint retornou HTTP {}: {:?} - {:?}", 
                    token_status, g_err.error, g_err.error_description));
            }
            return Err(format!("Google token endpoint retornou HTTP {}: erro desconhecido", token_status));
        }

        let token_data: TokenResponse = token_res.json().await
            .map_err(|_| "Falha ao interpretar resposta de sucesso do token endpoint".to_string())?;

        let userinfo_res = client.get("https://openidconnect.googleapis.com/v1/userinfo")
            .bearer_auth(&token_data.access_token)
            .send()
            .await
            .map_err(|e| format!("Erro de rede ao buscar UserInfo: {}", e))?;
            
        let userinfo_status = userinfo_res.status();
        if !userinfo_status.is_success() {
            let error_text = userinfo_res.text().await.unwrap_or_default();
            let err_json: Result<GoogleErrorResponse, _> = serde_json::from_str(&error_text);
            if let Ok(g_err) = err_json {
                return Err(format!("Google UserInfo endpoint retornou HTTP {}: {:?} - {:?}", 
                    userinfo_status, g_err.error, g_err.error_description));
            }
            return Err(format!("Google UserInfo endpoint retornou HTTP {}: erro desconhecido", userinfo_status));
        }

        let userinfo: UserInfo = userinfo_res.json().await
            .map_err(|_| "Falha ao interpretar resposta de sucesso do UserInfo endpoint".to_string())?;

        Ok((token_data, userinfo))
    }
}

