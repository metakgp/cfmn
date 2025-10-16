use crate::api::middleware::AppClaims;
use crate::api::errors::AppError;
use crate::api::router::RouterState;
use crate::db::handlers::users::{find_or_create_user, GoogleUserInfo};
use axum::extract::State;
use axum::response::{IntoResponse, Response};
use axum::{Extension, Json};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, decode_header, encode, DecodingKey, EncodingKey, Header, Validation};
use reqwest;
use serde::Deserialize;
use std::collections::{HashMap};
use serde_json::json;
use crate::db::models::User;

#[derive(Deserialize)]
pub struct AuthRequest {
    token: String,
}

#[derive(Debug, Deserialize, Clone)]
struct GoogleClaims {
    email: String,
    name: String,
    sub: String,
    picture: String,
}

// Structs to represent the JSON Web Key Set (JWKS) from Google
#[derive(Debug, Deserialize)]
struct Jwks {
    keys: Vec<Jwk>,
}

#[derive(Debug, Deserialize)]
struct Jwk {
    kid: String,
    n: String,
    e: String,
}

async fn get_google_public_keys() -> Result<HashMap<String, DecodingKey>, AppError> {
    let response = reqwest::get("https://www.googleapis.com/oauth2/v3/certs")
        .await
        .map_err(|e| {
            crate::api::errors::AuthError::RequestError(
                "Failed to fetch Google public keys".to_string(),
                e.into(),
            )
        })?;

    if !response.status().is_success() {
        return Err(crate::api::errors::AuthError::BadResponse(
            "Failed to fetch Google public keys".to_string(),
        )
        .into());
    }

    let jwks: Jwks = response.json().await.map_err(|e| {
        crate::api::errors::AuthError::RequestError(
            "Failed to parse Google public keys".to_string(),
            e.into(),
        )
    })?;

    let mut decoding_keys = HashMap::new();
    for jwk in jwks.keys {
        decoding_keys.insert(
            jwk.kid,
            DecodingKey::from_rsa_components(&jwk.n, &jwk.e).map_err(|_e| {
                AppError::Auth(crate::api::errors::AuthError::ConfigError(
                    "Failed to create decoding key".to_string(),
                ))
            })?,
        );
    }
    Ok(decoding_keys)
}

pub async fn google_auth_callback(
    State(state): State<RouterState>,
    Json(payload): Json<AuthRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let header = decode_header(&payload.token).map_err(|e| {
        crate::api::errors::AuthError::RequestError("Invalid token header".to_string(), e.into())
    })?;

    let kid = header.kid.ok_or_else(|| {
        crate::api::errors::AuthError::BadResponse("Missing 'kid' in token header".to_string())
    })?;

    let public_keys = get_google_public_keys().await?;
    let decoding_key = public_keys.get(&kid).ok_or_else(|| {
        crate::api::errors::AuthError::BadResponse(
            "No matching public key found for 'kid'".to_string(),
        )
    })?;

    let google_client_id = state.env_vars.google_client_id;
    let mut validation = Validation::new(header.alg);
    validation.set_audience(&[google_client_id]);

    let token_data =
        decode::<GoogleClaims>(&payload.token, decoding_key, &validation).map_err(|e| {
            crate::api::errors::AuthError::InvalidToken(format!("Token validation failed: {}", e))
        })?;

    let claims = token_data.claims;

    let user_info = GoogleUserInfo {
        google_id: claims.sub,
        email: claims.email,
        full_name: claims.name,
        picture: claims.picture,
    };

    let user = find_or_create_user(&state.db_wrapper, user_info.clone())
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(err) if err.constraint() == Some("users_google_id_key") => {
                AppError::User(crate::api::errors::UserError::Conflict(
                    "User with this Google ID already exists".to_string(),
                    err.into(),
                ))
            }
            e => AppError::User(crate::api::errors::UserError::Unknown(
                "Failed to find or create user".to_string(),
                e.into(),
            )),
        })?;

    let expiration = Utc::now() + Duration::seconds(state.env_vars.expiration_time_seconds);
    let app_claims = AppClaims {
        google_id: user.google_id.clone(),
        exp: expiration.timestamp(),
    };

    let token = encode(
        &Header::default(),
        &app_claims,
        &EncodingKey::from_secret(state.env_vars.signing_secret.as_ref()),
    )
        .map_err(|_| {
            crate::api::errors::AuthError::ConfigError("Failed to create JWT token".to_string())
        })?;

    // Return User and Token
    Ok(Json(json!({
        "user": user,
        "token": token
    })))
}

pub async fn get_current_user(
    State(_state): State<RouterState>,
    Extension(user): Extension<User>,
) -> Result<Response, AppError> {
    Ok(Json(user).into_response())
}

