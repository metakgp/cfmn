use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct DBVote {
    pub id: Uuid,
    pub user_id: Uuid,
    pub note_id: Uuid,
    pub is_upvote: bool,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct User {
    pub id: Uuid,
    pub google_id: String,
    pub email: String,
    pub full_name: String,
    pub created_at: DateTime<Utc>,
    pub picture: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Note {
    pub id: Uuid,
    pub course_name: String,
    pub course_code: String,
    pub description: Option<String>,
    pub professor_names: Option<Vec<String>>,
    pub tags: Vec<String>,
    pub is_public: bool,
    pub has_preview_image: bool,
    pub uploader_user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub downloads: i64,
    pub note_year: i64,
    pub note_semester: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteWithUser {
    pub note_id: Uuid,
    pub note_course_name: String,
    pub note_course_code: String,
    pub note_description: Option<String>,
    pub note_professor_names: Option<Vec<String>>,
    pub note_tags: Vec<String>,
    pub note_is_public: bool,
    pub note_has_preview_image: bool,
    pub note_uploader_user_id: Uuid,
    pub note_created_at: DateTime<Utc>,
    pub note_upvote_count: i64,
    pub note_downvote_count: i64,
    pub note_user_upvote: Option<bool>,
    pub note_downloads: i64,
    pub note_year: i64,
    pub note_semester: String,
    pub user_id: Uuid,
    pub user_google_id: String,
    pub user_email: String,
    pub user_full_name: String,
    pub user_created_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, sqlx::FromRow)]
pub struct Vote {
    pub id: Uuid,
    pub user_id: Uuid,
    pub note_id: Uuid,
    pub vote_type: String,
    pub created_at: DateTime<Utc>,
}