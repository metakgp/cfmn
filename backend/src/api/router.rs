// backend/src/api/router.rs

use super::handlers;
use crate::api::middleware;
use crate::db::DBPoolWrapper;
use crate::env::EnvVars;
use axum::middleware::from_fn_with_state;
use axum::{
    http::{  StatusCode},
    routing::{get, post, options},
    Router,
    response::Response,
    body::Body,
};
use tower_http::services::{ServeDir, ServeFile};

#[derive(Clone)]
pub(crate) struct RouterState {
    pub db_wrapper: DBPoolWrapper,
    pub env_vars: EnvVars
}

// Handler for preflight OPTIONS requests
async fn handle_options() -> Response<Body> {
    Response::builder()
        .status(StatusCode::OK)
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, HEAD, OPTIONS")
        .header("Access-Control-Allow-Headers", "content-type, authorization, accept, origin, x-requested-with")
        .header("Access-Control-Max-Age", "86400") // Cache preflight for 24 hours
        .body(Body::empty())
        .unwrap()
}

pub fn create_router(db_wrapper: DBPoolWrapper, env_vars: EnvVars) -> Router {
    let state = RouterState {
        db_wrapper,
        env_vars,
    };

    // Handle OPTIONS requests first, without any middleware
    let options_router = Router::new()
        .route("/notes/upload", options(handle_options))
        .route("/notes/{note_id}/vote", options(handle_options))
        .route("/auth/me", options(handle_options))
        .route("/notes", options(handle_options))
        .route("/notes/search", options(handle_options))
        .route("/notes/{note_id}", options(handle_options))
        .route("/auth/google", options(handle_options))
        .route("/notes/{note_id}/download", options(handle_options));

    // Protected routes without options handlers
    let protected_router = Router::new()
        .route("/notes/upload", post(handlers::notes::upload_note))
        .route("/notes/{note_id}/vote", post(handlers::votes::add_vote))
        .route("/auth/me", get(handlers::auth::get_current_user))
        .route_layer(from_fn_with_state(
            state.clone(),
            middleware::verify_token_middleware,
        ));

    let optional_user_router = Router::new()
        .route("/notes", get(handlers::notes::list_notes))
        .route("/notes/search", get(handlers::notes::search_notes))
        .route("/notes/{note_id}", get(handlers::notes::note_by_id))
        .route_layer(from_fn_with_state(
            state.clone(),
            middleware::optional_auth_middleware,
        ));

    let public_router = Router::new()
        .route("/", get(handlers::misc::index))
        .route("/auth/google", post(handlers::auth::google_auth_callback))
        .route("/notes/{note_id}/download", get(handlers::notes::download_note));

    // Merge routers with OPTIONS first (highest precedence)
    let api_router = Router::new()
        .merge(options_router)  
        .merge(public_router)
        .merge(protected_router)
        .merge(optional_user_router);

    // ... rest of your code remains the same
    let notes_path = state.env_vars.paths.get_notes_dir().to_path_buf();
    let images_path = state.env_vars.paths.get_previews_dir().to_path_buf();
    Router::new()
        .nest("/api", api_router)
        .nest_service("/notes/uploaded", ServeDir::new(notes_path))
        .nest_service("/previews/uploaded", ServeDir::new(images_path))
        .with_state(state)
}
