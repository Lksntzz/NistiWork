use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn open_local_folder(app: AppHandle, path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("O caminho da pasta está vazio.".to_string());
    }

    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err("Pasta local não encontrada.".to_string());
    }

    if !path_buf.is_dir() {
        return Err("O caminho configurado não é uma pasta.".to_string());
    }

    app.opener()
        .open_path(path_buf.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| format!("Não foi possível abrir a pasta local: {}", e))?;

    Ok(())
}