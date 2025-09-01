use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;

use crate::models::{AddMemberInput, AppState, Member};

pub async fn add_member(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<AddMemberInput>,
) -> impl IntoResponse {
    // Ensure group exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM groups WHERE id = $1")
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);
    if exists == 0 {
        return (StatusCode::NOT_FOUND, "group not found").into_response();
    }
    let member = Member {
        id: uuid::Uuid::new_v4(),
        name: input.member_name,
        email: input.member_email,
        joined_at: Utc::now(),
    };
    let res = sqlx::query(
        "INSERT INTO members (id, group_id, name, email, joined_at) VALUES ($1,$2,$3,$4,$5)",
    )
    .bind(member.id)
    .bind(id)
    .bind(&member.name)
    .bind(&member.email)
    .bind(member.joined_at)
    .execute(&state.pool)
    .await;
    match res {
        Ok(_) => (StatusCode::CREATED, Json(member)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "failed to add member").into_response(),
    }
}

pub async fn remove_member(
    State(state): State<AppState>,
    Path((group_id, member_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> impl IntoResponse {
    match sqlx::query("DELETE FROM members WHERE id = $1 AND group_id = $2")
        .bind(member_id)
        .bind(group_id)
        .execute(&state.pool)
        .await
    {
        Ok(r) if r.rows_affected() > 0 => StatusCode::NO_CONTENT,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}
