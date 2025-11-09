use crate::api::errors::{AppError, NoteError};
use crate::api::models::{CreateNote, ResponseNote, ResponseUser};
use crate::api::router::RouterState;
use crate::db::handlers::notes::{
    create_note, get_note_by_id, get_notes, increment_note_downloads, search_notes_by_query,
    update_note_preview_status,
};
use crate::db::models::User;
use axum::body::Bytes;
use axum::extract::{multipart::Multipart, Path, Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::{Extension, Json};
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct NoteQuery {
    pub num: Option<usize>,
}

/// API handler to list all notes.
pub async fn list_notes(
    State(state): State<RouterState>,
    Extension(user): Extension<Option<User>>,
    Query(query): Query<NoteQuery>,
) -> Result<(StatusCode, Response), AppError> {
    match get_notes(
        &state.db_wrapper,
        query.num.unwrap_or(10),
        user.as_ref().map(|u| u.id),
    )
        .await
    {
        Ok(notes) => {
            let response_notes: Vec<ResponseNote> = notes
                .into_iter()
                .map(|note| {
                    let file_url = state
                        .env_vars
                        .paths
                        .get_note_url(&format!("{}.pdf", note.note_id))
                        .unwrap();
                    let preview_image_url =
                        state
                            .env_vars
                            .paths
                            .get_preview_url(&format!("{}.jpg", note.note_id))
                            .unwrap();
                    ResponseNote::from_note_with_user(note, file_url, preview_image_url)
                })
                .collect();
            Ok((StatusCode::OK, Json(response_notes).into_response()))
        }
        Err(err) => {
            Err(NoteError::DatabaseError("Failed to fetch notes".to_string(), err.into()).into())
        }
    }
}

pub async fn note_by_id(
    State(state): State<RouterState>,
    Extension(user): Extension<Option<User>>,
    Path(note_id): Path<Uuid>,
) -> Result<(StatusCode, Response), AppError> {
    tracing::debug!("Fetching note with ID: {}", note_id);
    match get_note_by_id(&state.db_wrapper, note_id, user.as_ref().map(|u| u.id)).await {
        Ok(note) => {
            let file_url = state
                .env_vars
                .paths
                .get_note_url(&format!("{}.pdf", note.note_id))
                .unwrap();
            let preview_image_url =

                state
                    .env_vars
                    .paths
                    .get_preview_url(&format!("{}.jpg", note.note_id))
                    .unwrap();

            let response_note =
                ResponseNote::from_note_with_user(note, file_url, preview_image_url);
            Ok((StatusCode::OK, Json(response_note).into_response()))
        }
        Err(err) => {
            tracing::error!("Failed to fetch note: {:?}", err);
            Err(NoteError::DatabaseError("Failed to fetch note".to_string(), err.into()).into())
        }
    }
}

#[derive(Deserialize)]
pub struct SearchQuery {
    query: String,
}

pub async fn search_notes(
    State(state): State<RouterState>,
    Extension(user): Extension<Option<User>>,
    Query(query): Query<SearchQuery>,
) -> Result<(StatusCode, Response), AppError> {
    tracing::debug!("Search query: {:?}", query.query);
    if query.query.is_empty() {
        return Err(NoteError::InvalidData("Query cannot be empty".to_string()).into());
    }
    match search_notes_by_query(&state.db_wrapper, &query.query, user.as_ref().map(|u| u.id)).await
    {
        Ok(notes) => {
            let response_notes: Vec<ResponseNote> = notes
                .into_iter()
                .map(|note| {
                    let file_url = state
                        .env_vars
                        .paths
                        .get_note_url(&format!("{}.pdf", note.note_id))
                        .unwrap();
                    let preview_image_url =

                        state
                            .env_vars
                            .paths
                            .get_preview_url(&format!("{}.jpg", note.note_id))
                            .unwrap();


                    ResponseNote::from_note_with_user(note, file_url, preview_image_url)
                })
                .collect();
            Ok((StatusCode::OK, Json(response_notes).into_response()))
        }
        Err(err) => {
            Err(NoteError::DatabaseError("Failed to fetch notes".to_string(), err.into()).into())
        }
    }
}

use std::process::Command;

async fn generate_preview_image(
    pdf_path: &str,
    preview_path: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let output = Command::new("pdftoppm")
        .args(&[
            "-singlefile",
            "-jpeg",
            "-scale-to-x",
            "800",
            "-scale-to-y",
            "-1",
            pdf_path,
            preview_path.trim_end_matches(".jpg"),
        ])
        .output()?;

    if !output.status.success() {
        return Err(format!(
            "pdftoppm failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )
            .into());
    }

    Ok(())
}

// Integration into your upload_note function
pub async fn upload_note(
    State(state): State<RouterState>,
    Extension(user): Extension<User>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Response), AppError> {
    let mut course_name = String::new();
    let mut course_code = String::new();
    let mut description: Option<String> = None;
    let mut professor_names: Option<Vec<String>> = None;
    let mut tags: Vec<String> = Vec::new();
    let mut file_data: Option<Bytes> = None;

    // New fields with sensible defaults (override from form if present)
    let mut year: usize = 2025;
    let mut semester: String = "Autumn".to_string();

    let file_size_limit = state.env_vars.file_size_limit << 20;
    tracing::info!("Upload request received, file size limit: {} MiB", file_size_limit >> 20);

    // Parse multipart form data
    while let Ok(Some(field)) = multipart.next_field().await {
        let name = match field.name() {
            Some(name) => name.to_string(),
            None => continue,
        };

        if name == "file" {
            if let Some(content_type) = field.content_type() {
                if content_type != "application/pdf" {
                    return Err(NoteError::InvalidData(
                        "Only PDF files are supported".to_string(),
                    ))?;
                }
            } else {
                return Err(NoteError::InvalidData(
                    "Content-type header not found. File type could not be determined".to_string(),
                ))?;
            }

            let data = field
                .bytes()
                .await
                .map_err(|_| NoteError::UploadFailed("Failed to read file bytes".to_string()))?;

            if data.len() > file_size_limit {
                return Err(NoteError::InvalidData(format!(
                    "File size too big. Only files up to {} MiB are allowed.",
                    file_size_limit >> 20
                )))?;
            }

            file_data = Some(data);
            continue;
        }

        // Handle text fields
        let data = field
            .text()
            .await
            .map_err(|_| NoteError::UploadFailed(format!("Invalid format for field: {}", name)))?;

        match name.as_str() {
            "course_name" => course_name = data,
            "course_code" => course_code = data,
            "description" => {
                if !data.trim().is_empty() {
                    description = Some(data);
                }
            }
            "professor_names" => {
                let names: Vec<String> = data
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
                if !names.is_empty() {
                    professor_names = Some(names);
                }
            }
            "tags" => {
                tags = data
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
            }

            "year" => {
                year = data
                    .trim()
                    .parse::<usize>()
                    .map_err(|_| NoteError::InvalidData("Invalid year".to_string()))?;
            }

            "semester" => {
                let s = data.trim();
                if !s.is_empty() {
                    semester = s.to_string();
                }
            }

            _ => (),
        }
    }

    // Validate required fields
    if course_name.trim().is_empty() {
        return Err(NoteError::InvalidData(
            "Course name is required".to_string(),
        ))?;
    }
    if course_code.trim().is_empty() {
        return Err(NoteError::InvalidData(
            "Course code is required".to_string(),
        ))?;
    }
    if semester.trim().is_empty() || (semester.trim() != "Autumn" && semester.trim() != "Spring") {
        return Err(NoteError::InvalidData(
            "Semester is required and must be one of: Autumn, Spring".to_string(),
        ))?;
    }

    let file_bytes = file_data.ok_or(NoteError::InvalidData("File not provided".to_string()))?;

    // Include the new fields here
    let new_note = CreateNote {
        course_name,
        course_code,
        description,
        professor_names,
        tags,
        has_preview_image: false,
        uploader_user_id: user.id,
        timestamp: Utc::now(),
        note_year: year,
        note_semester: semester,
    };

    let (mut tx, note) = create_note(&state.db_wrapper, new_note)
        .await
        .map_err(|err| NoteError::DatabaseError("Failed to create note".to_string(), err.into()))?;


    let file_url = state
        .env_vars
        .paths
        .get_note_url(&format!("{}.pdf", note.id))
        .unwrap();

    let preview_image_url = state
        .env_vars
        .paths
        .get_preview_url(&format!("{}.jpg", note.id))
        .unwrap();

    let mut note_with_user = ResponseNote {
        id: note.id,
        course_name: note.course_name,
        course_code: note.course_code,
        description: note.description,
        professor_names: note.professor_names,
        tags: note.tags,
        is_public: note.is_public,
        has_preview_image: false,
        preview_image_url: preview_image_url.clone(),
        file_url,
        year: note.note_year,
        semester: note.note_semester,
        upvotes: 0,
        downvotes: 0,
        downloads: 0,
        user_vote: None,
        uploader_user: ResponseUser {
            id: user.id,
            google_id: user.google_id.clone(),
            email: user.email.clone(),
            full_name: user.full_name.clone(),
            created_at: user.created_at,
        },
        created_at: note.created_at,
    };

    let file_path = state.env_vars.paths.get_note_path(&format!("{}.pdf", note.id));
    if let Some(parent_dir) = file_path.parent() {
        if !parent_dir.exists() {
            tokio::fs::create_dir_all(parent_dir).await.map_err(|_| {
                NoteError::UploadFailed("Failed to create upload directory".to_string())
            })?;
        }
    }

    let preview_path = state.env_vars.paths.get_preview_path(&format!("{}.jpg", note.id));
    if let Some(parent_dir) = preview_path.parent() {
        if !parent_dir.exists() {
            tokio::fs::create_dir_all(parent_dir).await.map_err(|_| {
                NoteError::UploadFailed("Failed to create preview directory".to_string())
            })?;
        }
    }

    // Write pdf file data
    if tokio::fs::write(&file_path, &file_bytes).await.is_ok() {
        // Try to build preview
        let result = generate_preview_image(
            file_path.to_str().unwrap(),
            preview_path.to_str().unwrap(),
        ).await;
        if result.is_ok() {
            let _res = update_note_preview_status(&mut tx, note.id, true).await;
            note_with_user.has_preview_image = true;
        }
        if tx.commit().await.is_ok() {
            Ok((StatusCode::CREATED, Json(note_with_user).into_response()))
        } else {
            let _ = tokio::fs::remove_file(file_path).await;
            let _ = tokio::fs::remove_file(preview_path).await;
            Err(NoteError::UploadFailed(
                "Failed to save note to database".to_string(),
            ))?
        }
    } else {
        tx.rollback()
            .await
            .map_err(|_| NoteError::UploadFailed("Failed to rollback database".to_string()))?;
        Err(NoteError::UploadFailed("Failed to save file".to_string()))?
    }
}

pub async fn download_note(
    State(state): State<RouterState>,
    Path(note_id): Path<Uuid>,
) -> Result<(StatusCode, Response), AppError> {
    increment_note_downloads(&state.db_wrapper, note_id)
        .await
        .map_err(|err| {
            NoteError::DatabaseError("Failed to increment note downloads".to_string(), err.into())
        })?;

    Ok((StatusCode::OK, Json("OK").into_response()))
}
