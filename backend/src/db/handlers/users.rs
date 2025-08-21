use crate::db::db::DBPoolWrapper;
use crate::db::models::User;
use serde::Deserialize;

#[derive(Deserialize, Clone)]
pub struct GoogleUserInfo {
    pub google_id: String,
    pub email: String,
    pub full_name: String,
    pub picture: String,
}

pub async fn find_user_by_google_id(
    db_wrapper: &DBPoolWrapper,
    google_id: &str,
) -> Result<Option<User>, sqlx::Error> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE google_id = $1",
        google_id
    )
        .fetch_optional(db_wrapper.pool())
        .await?;

    Ok(user)
}

pub async fn find_or_create_user(
    db_wrapper: &DBPoolWrapper,
    user_info: GoogleUserInfo,
) -> Result<User, sqlx::Error> {
    let existing_user = find_user_by_google_id(db_wrapper, &user_info.google_id).await?;
    if let Some(user) = existing_user {
        return Ok(user);
    }
    let new_user = sqlx::query_as!(
        User,
        "INSERT INTO users (google_id, email, full_name, picture) VALUES ($1, $2, $3, $4) RETURNING *",
        user_info.google_id,
        user_info.email,
        user_info.full_name,
        user_info.picture,
    )
        .fetch_one(db_wrapper.pool())
        .await?;

    Ok(new_user)
}
