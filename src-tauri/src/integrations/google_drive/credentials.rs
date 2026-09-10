use keyring::Entry;

const SERVICE_NAME: &str = "com.nisti.work.google-drive";

pub fn entry(connection_id: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, connection_id)
        .map_err(|_| "Não foi possível acessar o armazenamento de credenciais local.".to_string())
}

pub fn read(connection_id: &str) -> Result<Option<String>, String> {
    match entry(connection_id)?.get_password() {
        Ok(token) if !token.is_empty() => Ok(Some(token)),
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(None),
        Err(_) => Err("Não foi possível ler a credencial local. Tente novamente.".to_string()),
    }
}

pub fn remove(connection_id: &str) -> Result<(), String> {
    match entry(connection_id)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err("Não foi possível remover a credencial local.".to_string()),
    }
}

pub fn save_verified(connection_id: &str, token: &str) -> Result<(), String> {
    let result = (|| {
        entry(connection_id)?.set_password(token)
            .map_err(|_| "Não foi possível salvar a credencial local.".to_string())?;
        // A fresh Entry must see the same value; never log either value.
        if read(connection_id)?.as_deref() != Some(token) {
            return Err("Não foi possível confirmar a gravação da credencial local.".to_string());
        }
        Ok(())
    })();
    if result.is_err() && remove(connection_id).is_err() {
        eprintln!("Google Drive: falha ao limpar nova credencial após erro de gravação.");
    }
    result
}
