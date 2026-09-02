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
    ]);
}

pub fn run_migrations(conn: &mut Connection) {
    MIGRATIONS.to_latest(conn).expect("Falha ao executar as migrations do SQLite");
}
