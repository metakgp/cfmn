// backend/src/main.rs
mod api;
mod db;
mod env;
mod pathutils;

use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use std::net::SocketAddr;
use axum::extract::DefaultBodyLimit;
use clap::Parser;
use dotenvy::dotenv;
use tracing_subscriber::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let env_vars = env::EnvVars::parse().process()?;

    let (append_writer, _guard) = tracing_appender::non_blocking(tracing_appender::rolling::never(
        env_vars
            .log_location
            .parent()
            .expect("Where do you want to store that log??"),
        env_vars
            .log_location
            .file_name()
            .expect("Do you want to store the logs in a directory?"),
    ));

    let subscriber = tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .with_writer(append_writer)
                .with_ansi(false),
        )
        .with(tracing_subscriber::fmt::layer().with_writer(std::io::stdout));

    tracing::subscriber::set_global_default(subscriber)?;


    let db_wrapper = db::DBPoolWrapper::new(env_vars.clone()).await;
    tracing::info!("Database connection established.");

    // Liberal CORS setup for development - allow all origins, methods, and headers
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    let file_size_limit = env_vars.file_size_limit;
    let port = env_vars.port;
    
    let app = api::router::create_router(db_wrapper, env_vars)
        .layer(DefaultBodyLimit::max(file_size_limit * 1024 * 1024))
        .layer(RequestBodyLimitLayer::new( file_size_limit * 1024 * 1024))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app.into_make_service()).await?;

    Ok(())
}