use crate::api::errors::{AppError, UserError};
use crate::api::router::RouterState;
use crate::db::handlers::users::{get_leaderboard, get_user_leaderboard_position};
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct LeaderboardQuery {
    pub limit: Option<i64>,
}

/// API handler to get the leaderboard
pub async fn get_leaderboard_handler(
    State(state): State<RouterState>,
    Query(query): Query<LeaderboardQuery>,
) -> Result<(StatusCode, Response), AppError> {
    let limit = query.limit.unwrap_or(20);

    match get_leaderboard(&state.db_wrapper, limit).await {
        Ok(leaderboard) => Ok((StatusCode::OK, Json(leaderboard).into_response())),
        Err(err) => {
            tracing::error!("Failed to fetch leaderboard: {:?}", err);
            Err(UserError::Unknown(
                "Failed to fetch leaderboard".to_string(),
                err.into(),
            )
            .into())
        }
    }
}

/// API handler to get a user's leaderboard position
pub async fn get_user_position_handler(
    State(state): State<RouterState>,
    Path(user_id): Path<Uuid>,
) -> Result<(StatusCode, Response), AppError> {
    match get_user_leaderboard_position(&state.db_wrapper, user_id).await {
        Ok(Some(position)) => Ok((StatusCode::OK, Json(position).into_response())),
        Ok(None) => Ok((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "User not found"})).into_response(),
        )),
        Err(err) => {
            tracing::error!("Failed to fetch user leaderboard position: {:?}", err);
            Err(UserError::Unknown(
                "Failed to fetch user position".to_string(),
                err.into(),
            )
            .into())
        }
    }
}
