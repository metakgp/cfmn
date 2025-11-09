use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::db::models::NoteWithUser;



#[derive(Serialize, Deserialize, Debug)]
pub struct CreateNote {
    pub course_name: String,
    pub course_code: String,
    pub description: Option<String>,
    pub professor_names: Option<Vec<String>>,
    pub tags: Vec<String>,
    pub has_preview_image: bool,
    pub uploader_user_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub note_year: usize,
    pub note_semester: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ResponseUser {
    pub id: Uuid,
    pub google_id: String,
    pub email: String,
    pub full_name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ResponseNote {
    pub id: Uuid,
    pub course_name: String,
    pub course_code: String,
    pub description: Option<String>,
    pub professor_names: Option<Vec<String>>,
    pub tags: Vec<String>,
    pub is_public: bool,
    pub has_preview_image: bool,
    pub preview_image_url: String,
    pub file_url: String,
    pub uploader_user: ResponseUser,
    pub created_at: DateTime<Utc>,
    pub upvotes: usize,
    pub downvotes: usize,
    pub user_vote: Option<bool>, // If currently authenticated user has voted on this note
    pub downloads: usize,
    pub year: i64,
    pub semester: String,
}

impl ResponseNote {
    pub fn from_note_with_user(
        note: NoteWithUser,
        file_url: String,
        preview_image_url: String,
    ) -> Self {
        Self {
            id: note.note_id,
            course_name: note.note_course_name,
            course_code: note.note_course_code,
            description: note.note_description,
            professor_names: note.note_professor_names,
            tags: note.note_tags,
            is_public: note.note_is_public,
            has_preview_image: note.note_has_preview_image,
            preview_image_url,
            file_url,
            year: note.note_year,
            semester: note.note_semester,
            upvotes: note.note_upvote_count as usize,
            downvotes: note.note_downvote_count as usize,
            downloads: note.note_downloads as usize,
            user_vote: note.note_user_upvote,
            uploader_user: ResponseUser {
                id: note.user_id,
                google_id: note.user_google_id,
                email: note.user_email,
                full_name: note.user_full_name,
                created_at: note.user_created_at,
            },
            created_at: note.note_created_at,
        }
    }
}