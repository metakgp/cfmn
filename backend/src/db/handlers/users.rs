use crate::db::db::DBPoolWrapper;
use crate::db::models::User;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Deserialize, Clone)]
pub struct GoogleUserInfo {
    pub google_id: String,
    pub email: String,
    pub full_name: String,
    pub picture: String,
}

#[derive(Debug, Serialize)]
pub struct LeaderboardEntry {
    pub id: Uuid,
    pub full_name: String,
    pub picture: String,
    pub reputation: f64,
    pub total_notes: i64,
    pub total_upvotes: i64,
    pub total_downloads: i64,
    pub rank: i64,
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

pub async fn get_leaderboard(
    db_wrapper: &DBPoolWrapper,
    limit: i64,
) -> Result<Vec<LeaderboardEntry>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
        WITH user_stats AS (
            SELECT
                u.id,
                u.full_name,
                u.picture,
                COUNT(DISTINCT n.id) as total_notes,
                COUNT(DISTINCT CASE WHEN v.is_upvote = true THEN v.id END) as total_upvotes,
                COALESCE(SUM(n.downloads), 0) as total_downloads
            FROM users u
            LEFT JOIN notes n ON u.id = n.uploader_user_id
            LEFT JOIN votes v ON n.id = v.note_id
            GROUP BY u.id, u.full_name, u.picture
        ),
        user_reputation AS (
            SELECT
                id,
                full_name,
                picture,
                total_notes,
                total_upvotes,
                total_downloads,
                CASE
                    WHEN total_notes > 0 THEN
                        (total_upvotes::FLOAT / total_notes::FLOAT) *
                        (total_notes + total_upvotes + total_downloads)
                    ELSE 0
                END as reputation
            FROM user_stats
        )
        SELECT
            id,
            full_name,
            picture,
            reputation,
            total_notes,
            total_upvotes,
            total_downloads,
            RANK() OVER (ORDER BY reputation DESC, total_notes DESC) as rank
        FROM user_reputation
        ORDER BY rank
        LIMIT $1
        "#,
        limit
    )
        .fetch_all(db_wrapper.pool())
        .await?;

    let leaderboard = rows
        .into_iter()
        .map(|row| LeaderboardEntry {
            id: row.id,
            full_name: row.full_name,
            picture: row.picture,
            reputation: row.reputation.unwrap_or(0.0),
            total_notes: row.total_notes.unwrap_or(0),
            total_upvotes: row.total_upvotes.unwrap_or(0),
            total_downloads: row.total_downloads.unwrap_or(0),
            rank: row.rank.unwrap_or(0),
        })
        .collect();

    Ok(leaderboard)
}

pub async fn get_user_leaderboard_position(
    db_wrapper: &DBPoolWrapper,
    user_id: Uuid,
) -> Result<Option<LeaderboardEntry>, sqlx::Error> {
    let row = sqlx::query!(
        r#"
        WITH user_stats AS (
            SELECT
                u.id,
                u.full_name,
                u.picture,
                COUNT(DISTINCT n.id) as total_notes,
                COUNT(DISTINCT CASE WHEN v.is_upvote = true THEN v.id END) as total_upvotes,
                COALESCE(SUM(n.downloads), 0) as total_downloads
            FROM users u
            LEFT JOIN notes n ON u.id = n.uploader_user_id
            LEFT JOIN votes v ON n.id = v.note_id
            GROUP BY u.id, u.full_name, u.picture
        ),
        user_reputation AS (
            SELECT
                id,
                full_name,
                picture,
                total_notes,
                total_upvotes,
                total_downloads,
                CASE
                    WHEN total_notes > 0 THEN
                        (total_upvotes::FLOAT / total_notes::FLOAT) *
                        (total_notes + total_upvotes + total_downloads)
                    ELSE 0
                END as reputation
            FROM user_stats
        ),
        ranked_users AS (
            SELECT
                id,
                full_name,
                picture,
                reputation,
                total_notes,
                total_upvotes,
                total_downloads,
                RANK() OVER (ORDER BY reputation DESC, total_notes DESC) as rank
            FROM user_reputation
        )
        SELECT
            id,
            full_name,
            picture,
            reputation,
            total_notes,
            total_upvotes,
            total_downloads,
            rank
        FROM ranked_users
        WHERE id = $1
        "#,
        user_id
    )
        .fetch_optional(db_wrapper.pool())
        .await?;

    Ok(row.map(|r| LeaderboardEntry {
        id: r.id,
        full_name: r.full_name,
        picture: r.picture,
        reputation: r.reputation.unwrap_or(0.0),
        total_notes: r.total_notes.unwrap_or(0),
        total_upvotes: r.total_upvotes.unwrap_or(0),
        total_downloads: r.total_downloads.unwrap_or(0),
        rank: r.rank.unwrap_or(0),
    }))
}