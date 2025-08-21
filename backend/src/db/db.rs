use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use std::env;
use crate::env::EnvVars;

#[derive(Clone)]
pub struct DBPoolWrapper {
    pool: Pool<Postgres>,
}

impl DBPoolWrapper {
    pub async fn new(env_vars: EnvVars) -> Self {
        let db_url = format!("postgres://{}:{}@{}:{}/{}",
            env_vars.db_user,
            env_vars.db_password,
            env_vars.db_host,
            env_vars.db_port,
            env_vars.db_name
        );
        let connection_pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await
            .expect("Error connecting to database");
        sqlx::migrate!("./migrations")
            .run(&connection_pool)
            .await
            .expect("Error running migrations");
        Self {
            pool: connection_pool,
        }
    }

    pub fn pool(&self) -> &Pool<Postgres> {
        &self.pool
    }
}
