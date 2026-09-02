use std::env;
use std::path::PathBuf;

fn main() {
    // Resolve o caminho absoluto baseado no diretório do src-tauri
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".to_string());
    let env_file = PathBuf::from(&manifest_dir).join("../.env.local");

    if env_file.exists() {
        if let Ok(iter) = dotenvy::from_path_iter(&env_file) {
            for item in iter {
                if let Ok((key, val)) = item {
                    println!("cargo:rustc-env={}={}", key, val);
                }
            }
        }
    }
    
    // Sempre re-avaliar o build se o .env.local mudar
    println!("cargo:rerun-if-changed={}", env_file.display());
    // Sugestão de boa prática: observar também se for criado depois
    println!("cargo:rerun-if-changed=../.env.local");

    tauri_build::build()
}
