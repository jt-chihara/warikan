use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;

use crate::models::{AppState, CreateGroupInput, Group, Member, UpdateGroupInput};

pub async fn list_groups(State(state): State<AppState>) -> impl IntoResponse {
    let store = state.0.read().await;
    let groups: Vec<Group> = store.groups.values().cloned().collect();
    Json(groups)
}

pub async fn get_group(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    let store = state.0.read().await;
    match store.groups.get(&id) {
        Some(g) => (StatusCode::OK, Json(g.clone())).into_response(),
        None => (StatusCode::NOT_FOUND, "group not found").into_response(),
    }
}

pub async fn create_group(
    State(state): State<AppState>,
    Json(input): Json<CreateGroupInput>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    let now = Utc::now();
    let id = uuid::Uuid::new_v4();

    let members: Vec<Member> = input
        .member_names
        .into_iter()
        .map(|name| Member {
            id: uuid::Uuid::new_v4(),
            name,
            email: None,
            joined_at: now,
        })
        .collect();

    let group = Group {
        id,
        name: input.name,
        description: input.description,
        currency: input.currency.unwrap_or_else(|| "JPY".into()),
        created_at: now,
        updated_at: now,
        members,
    };
    store.groups.insert(id, group.clone());
    store.expenses.entry(id).or_default();
    (StatusCode::CREATED, Json(group))
}

pub async fn update_group(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateGroupInput>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    match store.groups.get_mut(&id) {
        Some(g) => {
            g.name = input.name;
            g.description = input.description;
            g.currency = input.currency;
            g.updated_at = Utc::now();
            (StatusCode::OK, Json(g.clone())).into_response()
        }
        None => (StatusCode::NOT_FOUND, "group not found").into_response(),
    }
}

pub async fn delete_group(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    let existed = store.groups.remove(&id).is_some();
    store.expenses.remove(&id);
    if existed {
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    }
}

