use axum::http::StatusCode;
use axum::Json;
use axum::response::{IntoResponse, Response};
use serde_json::json;

pub enum AppError {
    Note(NoteError),
    User(UserError),
    Auth(AuthError),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Note(err) => err.into_response(),
            AppError::User(err) => err.into_response(),
            AppError::Auth(err) => err.into_response(),
        }
    }
}

pub enum UserError {
    Conflict(String, Box<dyn std::error::Error>),
    Unknown(String, Box<dyn std::error::Error>),
}

impl From<UserError> for AppError {
    fn from(err: UserError) -> Self {
        AppError::User(err)
    }
}

impl IntoResponse for UserError {
    fn into_response(self) -> Response {
        match self {
            UserError::Conflict(msg, err) => {
                tracing::error!("User conflict error: {}", err);
                (StatusCode::CONFLICT, msg).into_response()
            }
            UserError::Unknown(msg, err) => {
                tracing::error!("Unknown user error: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response()
            }
        }
    }
}

pub enum AuthError {
    RequestError(String, Box<dyn std::error::Error>),
    BadResponse(String),
    ConfigError(String),
    InvalidToken(String),
    DatabaseError(String, Box<dyn std::error::Error>),
}

impl From<AuthError> for AppError {
    fn from(err: AuthError) -> Self {
        AppError::Auth(err)
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        match self {
            AuthError::RequestError(msg, err) => {
                tracing::error!("Authentication request error: {}: {}", msg, err);
                (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response()
            }
            AuthError::BadResponse(msg) => {
                tracing::error!("Authentication bad response: {}", msg);
                (StatusCode::BAD_REQUEST, msg).into_response()
            }
            AuthError::ConfigError(msg) => {
                tracing::error!("Authentication config error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response()
            }
            AuthError::InvalidToken(msg) => {
                tracing::error!("Invalid authentication token: {}", msg);
                (StatusCode::UNAUTHORIZED, msg).into_response()
            }
            AuthError::DatabaseError(msg, err) => {
                tracing::error!("Authentication database error: {}: {:?}", msg, err);
                (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response()
            }
        }
    }
}

#[derive(Debug)]
pub enum NoteError {
    InvalidData(String),
    UploadFailed(String),
    DatabaseError(String, Box<dyn std::error::Error>),
    BadVote(String),
}

impl From<NoteError> for AppError {
    fn from(err: NoteError) -> Self {
        AppError::Note(err)
    }
}

impl IntoResponse for NoteError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            NoteError::InvalidData(msg) => (StatusCode::BAD_REQUEST, msg),
            NoteError::UploadFailed(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            NoteError::DatabaseError(msg, err) => {
                tracing::error!("Database error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    msg,
                )
            }
            NoteError::BadVote(msg) => (StatusCode::BAD_REQUEST, msg),
        };

        (status, Json(json!({ "error": error_message }))).into_response()
    }
}
