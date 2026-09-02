use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState {
    pub db: Mutex<Connection>,
}

pub fn establish_connection(db_path: PathBuf) -> Connection {
    let mut conn = Connection::open(db_path).expect("Falha ao abrir banco de dados SQLite");
    
    // Aplicar as migrations
    super::migrations::run_migrations(&mut conn);
    
    conn
}
