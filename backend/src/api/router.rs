// backend/src/api/router.rs

use super::handlers;
use crate::api::middleware;
use crate::db::DBPoolWrapper;
use crate::env::EnvVars;
use axum::middleware::from_fn_with_state;
use axum::{
    routing::{get, post},
    Router,
};
use tower_http::services::ServeDir;

#[derive(Clone)]
pub(crate) struct RouterState {
    pub db_wrapper: DBPoolWrapper,
    pub env_vars: EnvVars
}

pub fn create_router(db_wrapper: DBPoolWrapper, env_vars: EnvVars) -> Router {
    let state = RouterState {
        db_wrapper,
        env_vars,
    };

    // Protected routes (require authentication)
    let protected_router = Router::new()
        .route("/notes/upload", post(handlers::notes::upload_note))
        .route("/notes/{note_id}/vote", post(handlers::votes::add_vote))
        .route("/auth/me", get(handlers::auth::get_current_user))
        .route_layer(from_fn_with_state(
            state.clone(),
            middleware::verify_token_middleware,
        ));

    // Optional auth routes (work with or without authentication)
    let optional_user_router = Router::new()
        .route("/notes", get(handlers::notes::list_notes))
        .route("/notes/search", get(handlers::notes::search_notes))
        .route("/notes/{note_id}", get(handlers::notes::note_by_id))
        .route_layer(from_fn_with_state(
            state.clone(),
            middleware::optional_auth_middleware,
        ));

    // Public routes (no authentication required)
    let public_router = Router::new()
        .route("/", get(handlers::misc::index))
        .route("/auth/google", post(handlers::auth::google_auth_callback))
        .route("/notes/{note_id}/download", get(handlers::notes::download_note))
        .route("/users/leaderboard", get(handlers::users::get_leaderboard_handler))
        .route("/users/{user_id}/leaderboard-position", get(handlers::users::get_user_position_handler));

    // Merge all routers (CORS is handled by CorsLayer in main.rs)
    let api_router = Router::new()
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
