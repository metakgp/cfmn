use crate::api::errors::{AppError, AuthError};
use crate::api::router::RouterState;
use crate::db;
use crate::db::models::User;
use axum::body::Body;
use axum::extract::{Request, State};
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::Response;
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppClaims {
    pub(crate) google_id: String,
    pub(crate) exp: i64,
}

pub async fn verify_token(token: &str, state: &RouterState) -> Result<Option<User>, AppError> {
    let decoding_key = DecodingKey::from_secret(state.env_vars.signing_secret.as_bytes());

    let validation = Validation::new(jsonwebtoken::Algorithm::HS256);

    let token_data = decode::<AppClaims>(token, &decoding_key, &validation)
        .map_err(|_| AuthError::InvalidToken("Invalid or expired session token".to_string()))?;

    let claims = token_data.claims;

    let user = db::handlers::users::find_user_by_google_id(&state.db_wrapper, &claims.google_id)
        .await
        .map_err(|e| AuthError::DatabaseError("Failed to fetch user".to_string(), e.into()))?;

    Ok(user)
}

// Helper function to create CORS-enabled error responses
fn create_cors_error_response(status: StatusCode, message: &str) -> Response<Body> {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "*")
        .header("Access-Control-Allow-Headers", "content-type, authorization, accept, origin, x-requested-with")
        .body(Body::from(format!(r#"{{"error": "{}"}}"#, message)))
        .unwrap()
}

// Mandatory authentication middleware (original behavior)
pub(crate) async fn verify_token_middleware(
    State(state): State<RouterState>,
    mut request: Request<Body>,
    next: Next,
) -> Result<Response<Body>, AppError> {
    // Allow OPTIONS requests (CORS preflight) to pass through without authentication
    if request.method() == axum::http::Method::OPTIONS {
        return Ok(next.run(request).await);
    }

    // Look for Authorization header instead of cookie
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "));

    if let Some(token) = auth_header {
        let user = match verify_token(token, &state).await? {
            Some(user) => user,
            None => {
                tracing::debug!("Token verification failed");
                return Ok(create_cors_error_response(
                    StatusCode::UNAUTHORIZED,
                    "Invalid token"
                ));
            }
        };
        request.extensions_mut().insert(user);
        tracing::debug!("Valid token found for user");
    } else {
        tracing::debug!("No Authorization header found");
        return Ok(create_cors_error_response(
            StatusCode::UNAUTHORIZED,
            "Missing authorization header"
        ));
    }

    // Continue to the next middleware/handler
    let response = next.run(request).await;

    Ok(response)
}

// Optional authentication middleware (adds Option<User>)
pub(crate) async fn optional_auth_middleware(
    State(state): State<RouterState>,
    mut request: Request<Body>,
    next: Next,
) -> Result<Response<Body>, AppError> {
    // Allow OPTIONS requests (CORS preflight) to pass through without processing
    if request.method() == axum::http::Method::OPTIONS {
        return Ok(next.run(request).await);
    }

    // Look for Authorization header
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "));

    let user_option = if let Some(token) = auth_header {
        match verify_token(token, &state).await {
            Ok(Some(user)) => {
                tracing::debug!("Valid token found for user in optional middleware");
                Some(user)
            }
            Ok(None) => {
                tracing::debug!("Token verification failed in optional middleware");
                None
            }
            Err(_) => {
                tracing::debug!(
                    "Token verification error in optional middleware, treating as no user"
                );
                None
            }
        }
    } else {
        tracing::debug!("No Authorization header found in optional middleware");
        None
    };

    // Always insert Option<User> - either Some(user) or None
    request.extensions_mut().insert(user_option);

    // Continue to the next middleware/handler
    let response = next.run(request).await;

    Ok(response)
}