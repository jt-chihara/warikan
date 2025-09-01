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
    let mut store = state.0.write().await;
    match store.groups.get_mut(&id) {
        Some(g) => {
            let member = Member {
                id: uuid::Uuid::new_v4(),
                name: input.member_name,
                email: input.member_email,
                joined_at: Utc::now(),
            };
            g.members.push(member.clone());
            (StatusCode::CREATED, Json(member)).into_response()
        }
        None => (StatusCode::NOT_FOUND, "group not found").into_response(),
    }
}

pub async fn remove_member(
    State(state): State<AppState>,
    Path((group_id, member_id)): Path<(uuid::Uuid, uuid::Uuid)>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    match store.groups.get_mut(&group_id) {
        Some(g) => {
            let before = g.members.len();
            g.members.retain(|m| m.id != member_id);
            if g.members.len() < before {
                StatusCode::NO_CONTENT
            } else {
                StatusCode::NOT_FOUND
            }
        }
        None => StatusCode::NOT_FOUND,
    }
}

