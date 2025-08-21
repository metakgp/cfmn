use crate::api::handlers::votes::VoteType;
use crate::db::models::DBVote;
use crate::db::DBPoolWrapper;
use uuid::Uuid;

pub async fn vote(
    db_wrapper: &DBPoolWrapper,
    user_id: Uuid,
    note_id: Uuid,
    vote_type: VoteType,
) -> Result<Option<DBVote>, sqlx::Error> {
    let mut tx = db_wrapper.pool().begin().await?;
    let existing_vote = sqlx::query_as!(
        DBVote,
        "SELECT * FROM votes WHERE user_id = $1 AND note_id = $2",
        user_id,
        note_id
    )
    .fetch_optional(&mut *tx)
    .await?;

    let mut return_value: Option<DBVote> = None;

    if let Some(_vote) = existing_vote {
        if let VoteType::Upvote(is_upvote) = vote_type {
            let new_vote = sqlx::query_as!(
                DBVote,
                "UPDATE votes SET is_upvote = $1 WHERE user_id = $2 AND note_id = $3 RETURNING *",
                is_upvote,
                user_id,
                note_id
            )
            .fetch_one(&mut *tx)
            .await?;
            return_value = Some(new_vote);
        } else {
            sqlx::query!(
                "DELETE FROM votes WHERE user_id = $1 AND note_id = $2",
                user_id,
                note_id
            )
            .execute(&mut *tx)
            .await?;
            return_value = None;
        }
    } else {
        if let VoteType::Upvote(is_upvote) = vote_type {
            let new_vote = sqlx::query_as!(
                DBVote,
                "INSERT INTO votes (user_id, note_id, is_upvote) VALUES ($1, $2, $3) RETURNING *",
                user_id,
                note_id,
                is_upvote
            )
            .fetch_one(&mut *tx)
            .await?;
            return_value = Some(new_vote);
        }
    }
    // No else arm since we have already deleted any

    tx.commit().await?;

    Ok(return_value)
}
