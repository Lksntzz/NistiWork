use lazy_static::lazy_static;
use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

lazy_static! {
    static ref MIGRATIONS: Migrations<'static> = Migrations::new(vec![
        // V1: Tabela de Configurações Iniciais
        M::up(
            "CREATE TABLE settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT NOT NULL
            );"
        ),
        // V2: Tabelas de Empresas, Tarefas e Histórico
        M::up(
            "CREATE TABLE IF NOT EXISTS companies (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                entry_date TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                local_folder_path TEXT,
                drive_folder_id TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                due_date TEXT,
                company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
                cover_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS activity_history (
                id TEXT PRIMARY KEY,
                entity_name TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                action TEXT NOT NULL,
                previous_status TEXT,
                new_status TEXT,
                metadata TEXT,
                timestamp TEXT NOT NULL
            );"
        ),
    ]);
}

pub fn run_migrations(conn: &mut Connection) {
    MIGRATIONS.to_latest(conn).expect("Falha ao executar as migrations do SQLite");
}
