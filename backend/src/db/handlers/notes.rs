use crate::db::db::DBPoolWrapper;
use crate::db::models::{Note, NoteWithUser};
use sqlx::Postgres;
use uuid::Uuid;

use crate::api::models::CreateNote;

/// Inserts a new note record into the database.

pub async fn update_note_preview_status(
    tx: &mut sqlx::Transaction<'_, Postgres>,
    note_id: Uuid,
    status: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE notes SET has_preview_image = $1 WHERE id = $2",
        status,
        note_id
    )
        .execute(&mut **tx)
        .await?;

    Ok(())
}

// TODO: Handle Year and Semester fields in the future, Add migrations removing reputation
pub async fn create_note(
    db_wrapper: &DBPoolWrapper,
    new_note: CreateNote,
) -> Result<(sqlx::Transaction<'_, sqlx::Postgres>, Note), sqlx::Error> {
    // Begin a transaction
    let mut tx = db_wrapper.pool().begin().await?;

    let note = sqlx::query_as!(
        Note,
        r#"
        INSERT INTO notes (course_name, course_code, description, professor_names, tags, has_preview_image, uploader_user_id, note_year, note_semester)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, course_name, course_code, description, professor_names, tags, is_public, has_preview_image, uploader_user_id, created_at, downloads, note_year, note_semester
        "#,
        new_note.course_name,
        new_note.course_code,
        new_note.description,
        new_note.professor_names.as_deref(),
        &new_note.tags,
        new_note.has_preview_image,
        new_note.uploader_user_id,
        new_note.note_year as i64,
        new_note.note_semester,
    )
        .fetch_one(&mut *tx)  // Execute on the transaction instead of the pool
        .await?;

    Ok((tx, note))
}

pub async fn get_notes(
    db_wrapper: &DBPoolWrapper,
    num_notes: usize,
    current_user_id: Option<Uuid>,
) -> Result<Vec<NoteWithUser>, sqlx::Error> {
    let notes = sqlx::query_as!(
        NoteWithUser,
        r#"
        SELECT
            n.id as "note_id!",
            n.course_name as "note_course_name!",
            n.course_code as "note_course_code!",
            n.description as "note_description",
            n.professor_names as "note_professor_names",
            n.tags as "note_tags!",
            n.is_public as "note_is_public!",
            n.has_preview_image as "note_has_preview_image!",
            n.uploader_user_id as "note_uploader_user_id!",
            n.created_at as "note_created_at!",
            n.downloads as "note_downloads!",
            n.note_year as "note_year!",
            n.note_semester as "note_semester!",
            COALESCE(upvote_counts.count, 0) as "note_upvote_count!",
            COALESCE(downvote_counts.count, 0) as "note_downvote_count!",
            user_vote.is_upvote as "note_user_upvote?",
            u.id as "user_id!",
            u.google_id as "user_google_id!",
            u.email as "user_email!",
            u.full_name as "user_full_name!",
            u.created_at as "user_created_at!"
        FROM
            notes n
        JOIN
            users u ON n.uploader_user_id = u.id
        LEFT JOIN
            (SELECT note_id, COUNT(*) as count
             FROM votes
             WHERE is_upvote = true
             GROUP BY note_id) upvote_counts ON n.id = upvote_counts.note_id
        LEFT JOIN
            (SELECT note_id, COUNT(*) as count
             FROM votes
             WHERE is_upvote = false
             GROUP BY note_id) downvote_counts ON n.id = downvote_counts.note_id
        LEFT JOIN
            votes user_vote ON n.id = user_vote.note_id AND user_vote.user_id = $2
        ORDER BY
            n.created_at DESC
        LIMIT $1
        "#,
        num_notes as i64,
        current_user_id.as_ref()
    )
        .fetch_all(db_wrapper.pool())
        .await?;
    Ok(notes)
}
/// Searches for notes where the title or description match the query.
pub async fn search_notes_by_query(
    db_wrapper: &DBPoolWrapper,
    query: &str,
    current_user_id: Option<Uuid>,
) -> Result<Vec<NoteWithUser>, sqlx::Error> {
    let search_term = format!("%{}%", query); // Wrap query for partial matching
    let notes = sqlx::query_as!(
        NoteWithUser,
        r#"
        SELECT
            n.id as "note_id!",
            n.course_name as "note_course_name!",
            n.course_code as "note_course_code!",
            n.description as "note_description",
            n.professor_names as "note_professor_names",
            n.tags as "note_tags!",
            n.is_public as "note_is_public!",
            n.has_preview_image as "note_has_preview_image!",
            n.uploader_user_id as "note_uploader_user_id!",
            n.created_at as "note_created_at!",
            n.downloads as "note_downloads!",
            n.note_year as "note_year!",
            n.note_semester as "note_semester!",
            COALESCE(upvote_counts.count, 0) as "note_upvote_count!",
            COALESCE(downvote_counts.count, 0) as "note_downvote_count!",
            user_vote.is_upvote as "note_user_upvote?",
            u.id as "user_id!",
            u.google_id as "user_google_id!",
            u.email as "user_email!",
            u.full_name as "user_full_name!",
            u.created_at as "user_created_at!"
        FROM
            notes n
        JOIN
            users u ON n.uploader_user_id = u.id
        LEFT JOIN
            (SELECT note_id, COUNT(*) as count
             FROM votes
             WHERE is_upvote = true
             GROUP BY note_id) upvote_counts ON n.id = upvote_counts.note_id
        LEFT JOIN
            (SELECT note_id, COUNT(*) as count
             FROM votes
             WHERE is_upvote = false
             GROUP BY note_id) downvote_counts ON n.id = downvote_counts.note_id
        LEFT JOIN
            votes user_vote ON n.id = user_vote.note_id AND user_vote.user_id = $2
        WHERE course_name ILIKE $1 OR course_code ILIKE $1
        ORDER BY COALESCE(upvote_counts.count, 0) DESC, n.created_at DESC
        "#,
        search_term,
        current_user_id.as_ref()
    )
        .fetch_all(db_wrapper.pool())
        .await?;
    Ok(notes)
}

pub async fn get_note_by_id(
    db_wrapper: &DBPoolWrapper,
    note_id: Uuid,
    current_user_id: Option<Uuid>,
) -> Result<NoteWithUser, sqlx::Error> {
    let note_with_user = sqlx::query_as!(
        NoteWithUser,
        r#"
    SELECT
        n.id as "note_id!",
        n.course_name as "note_course_name!",
        n.course_code as "note_course_code!",
        n.description as "note_description",
        n.professor_names as "note_professor_names",
        n.tags as "note_tags!",
        n.is_public as "note_is_public!",
        n.has_preview_image as "note_has_preview_image!",
        n.uploader_user_id as "note_uploader_user_id!",
        n.created_at as "note_created_at!",
        n.downloads as "note_downloads!",
        n.note_year as "note_year!",
        n.note_semester as "note_semester!",
        COALESCE(upvote_counts.count, 0) as "note_upvote_count!",
        COALESCE(downvote_counts.count, 0) as "note_downvote_count!",
        user_vote.is_upvote as "note_user_upvote?",
        u.id as "user_id!",
        u.google_id as "user_google_id!",
        u.email as "user_email!",
        u.full_name as "user_full_name!",
        u.created_at as "user_created_at!"
    FROM
        notes n
    JOIN
        users u ON n.uploader_user_id = u.id
    LEFT JOIN
        (SELECT note_id, COUNT(*) as count
         FROM votes
         WHERE is_upvote = true
         GROUP BY note_id) upvote_counts ON n.id = upvote_counts.note_id
    LEFT JOIN
        (SELECT note_id, COUNT(*) as count
         FROM votes
         WHERE is_upvote = false
         GROUP BY note_id) downvote_counts ON n.id = downvote_counts.note_id
    LEFT JOIN
        votes user_vote ON n.id = user_vote.note_id AND user_vote.user_id = $2
    WHERE n.id = $1
    "#,
        note_id,
        current_user_id.as_ref()
    )
        .fetch_one(db_wrapper.pool())
        .await?;
    Ok(note_with_user)
}

pub async fn increment_note_downloads(
    db_wrapper: &DBPoolWrapper,
    note_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE notes SET downloads = downloads + 1 WHERE id = $1",
        note_id
    )
        .execute(db_wrapper.pool())
        .await?;

    Ok(())
}