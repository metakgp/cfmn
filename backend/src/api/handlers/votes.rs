use axum::{Extension, Json};
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Deserialize;
use crate::api::errors::{AppError, NoteError};
use crate::api::router::RouterState;
use crate::db::models::User;
use crate::db::handlers::votes::vote;

#[derive(Deserialize)]
pub enum VoteType {
    Upvote(bool),
    Remove
}

#[derive(Deserialize)]
pub struct VoteRequest {
    vote_type: String,
}

pub async fn add_vote (
    State(state): State<RouterState>,
    Extension(user): Extension<User>,
    Path(note_id): Path<uuid::Uuid>,
    Query(query): Query<VoteRequest>,
) -> Result<(StatusCode, Response), AppError> {
    let vote_type = match query.vote_type.as_str() {
        "upvote" => VoteType::Upvote(true),
        // Remove
        // "downvote" => VoteType::Upvote(false),
        "remove" => VoteType::Remove,
        _ => {
            return Err(NoteError::BadVote(format!("Incorrect vote type: {}. Available options are: upvote and remove", query.vote_type)).into());
        }
    };
    let v = vote(&state.db_wrapper, user.id, note_id, vote_type)
        .await
        .map_err(|e| {
            tracing::error!("Failed to add vote: {}", e);
            NoteError::DatabaseError("Failed to add vote".to_string(), e.into())
        })?;
    Ok((StatusCode::OK, Json(v).into_response()))
}
