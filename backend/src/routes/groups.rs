use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use sqlx::Row;

use crate::models::{AppState, CreateGroupInput, Group, Member, UpdateGroupInput};

pub async fn list_groups(State(state): State<AppState>) -> impl IntoResponse {
    let mut groups: Vec<Group> = Vec::new();
    let rows = match sqlx::query(
        "SELECT id, name, description, currency, created_at, updated_at FROM groups ORDER BY created_at DESC",
    )
    .fetch_all(&state.pool)
    .await
    {
        Ok(r) => r,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("{e}")).into_response(),
    };

    for row in rows {
        let id: uuid::Uuid = row.get("id");
        let members = match sqlx::query(
            "SELECT id, name, email, joined_at FROM members WHERE group_id = $1 ORDER BY joined_at",
        )
        .bind(id)
        .fetch_all(&state.pool)
        .await
        {
            Ok(m) => m
                .into_iter()
                .map(|r| Member {
                    id: r.get("id"),
                    name: r.get::<String, _>("name"),
                    email: r.get::<Option<String>, _>("email"),
                    joined_at: r.get("joined_at"),
                })
                .collect(),
            Err(_) => Vec::new(),
        };

        groups.push(Group {
            id,
            name: row.get("name"),
            description: row.get::<Option<String>, _>("description"),
            currency: row.get("currency"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            members,
        });
    }

    Json(groups).into_response()
}

pub async fn get_group(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    let row = match sqlx::query(
        "SELECT id, name, description, currency, created_at, updated_at FROM groups WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await
    {
        Ok(r) => r,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("{e}")).into_response(),
    };
    let Some(row) = row else { return (StatusCode::NOT_FOUND, "group not found").into_response(); };
    let members = match sqlx::query(
        "SELECT id, name, email, joined_at FROM members WHERE group_id = $1 ORDER BY joined_at",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    {
        Ok(m) => m
            .into_iter()
            .map(|r| Member {
                id: r.get("id"),
                name: r.get::<String, _>("name"),
                email: r.get::<Option<String>, _>("email"),
                joined_at: r.get("joined_at"),
            })
            .collect(),
        Err(_) => Vec::new(),
    };
    let g = Group {
        id,
        name: row.get("name"),
        description: row.get::<Option<String>, _>("description"),
        currency: row.get("currency"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        members,
    };
    (StatusCode::OK, Json(g)).into_response()
}

pub async fn create_group(
    State(state): State<AppState>,
    Json(input): Json<CreateGroupInput>,
) -> impl IntoResponse {
    let now = Utc::now();
    let id = uuid::Uuid::new_v4();
    let currency = input.currency.unwrap_or_else(|| "JPY".into());

    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("{e}")).into_response(),
    };
    if let Err(e) = sqlx::query(
        "INSERT INTO groups (id, name, description, currency, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)",
    )
    .bind(id)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&currency)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    {
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("{e}")).into_response();
    }

    let mut members: Vec<Member> = Vec::new();
    for name in input.member_names {
        let mid = uuid::Uuid::new_v4();
        if let Err(e) = sqlx::query(
            "INSERT INTO members (id, group_id, name, email, joined_at) VALUES ($1,$2,$3,$4,$5)",
        )
        .bind(mid)
        .bind(id)
        .bind(&name)
        .bind(Option::<String>::None)
        .bind(now)
        .execute(&mut *tx)
        .await
        {
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("{e}")).into_response();
        }
        members.push(Member { id: mid, name, email: None, joined_at: now });
    }

    if let Err(e) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("{e}")).into_response();
    }

    let group = Group {
        id,
        name: input.name,
        description: input.description,
        currency,
        created_at: now,
        updated_at: now,
        members,
    };
    (StatusCode::CREATED, Json(group)).into_response()
}

pub async fn update_group(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateGroupInput>,
) -> impl IntoResponse {
    let now = Utc::now();
    let res = sqlx::query(
        "UPDATE groups SET name=$1, description=$2, currency=$3, updated_at=$4 WHERE id=$5",
    )
    .bind(&input.name)
    .bind(&input.description)
    .bind(&input.currency)
    .bind(now)
    .bind(id)
    .execute(&state.pool)
    .await;
    match res {
        Ok(r) if r.rows_affected() > 0 => {
            // reload
            return get_group(State(state), Path(id)).await.into_response();
        }
        Ok(_) => return (StatusCode::NOT_FOUND, "group not found").into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, format!("{e}")).into_response(),
    }
}

pub async fn delete_group(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    match sqlx::query("DELETE FROM groups WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
    {
        Ok(r) if r.rows_affected() > 0 => StatusCode::NO_CONTENT,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}
