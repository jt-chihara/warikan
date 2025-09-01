use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use sqlx::Row;
use tracing::error;

use crate::models::{AddExpenseInput, AppState, Expense, SplitMember, UpdateExpenseInput};

pub async fn list_expenses(
    State(state): State<AppState>,
    Path(group_id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    let rows = match sqlx::query(
        "SELECT id, amount, description, paid_by_id, paid_by_name, created_at FROM expenses WHERE group_id = $1 ORDER BY created_at DESC",
    )
    .bind(group_id)
    .fetch_all(&state.pool)
    .await
    {
        Ok(r) => r,
        Err(_) => return Json::<Vec<Expense>>(vec![]),
    };
    let mut list = Vec::new();
    for row in rows {
        let expense_id: uuid::Uuid = row.get("id");
        let splits = match sqlx::query(
            "SELECT member_id, member_name, amount FROM expense_splits WHERE expense_id = $1",
        )
        .bind(expense_id)
        .fetch_all(&state.pool)
        .await
        {
            Ok(s) => s
                .into_iter()
                .map(|r| SplitMember {
                    member_id: r.get("member_id"),
                    member_name: r.get::<String, _>("member_name"),
                    amount: r.get("amount"),
                })
                .collect(),
            Err(_) => Vec::new(),
        };
        list.push(Expense {
            id: expense_id,
            group_id,
            amount: row.get("amount"),
            description: row.get("description"),
            paid_by_id: row.get("paid_by_id"),
            paid_by_name: row.get("paid_by_name"),
            split_members: splits,
            created_at: row.get("created_at"),
        });
    }
    Json(list)
}

pub async fn add_expense(
    State(state): State<AppState>,
    Path(group_id): Path<uuid::Uuid>,
    Json(input): Json<AddExpenseInput>,
) -> impl IntoResponse {
    // Validate group exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM groups WHERE id = $1")
        .bind(group_id)
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);
    if exists == 0 {
        return (StatusCode::NOT_FOUND, "group not found").into_response();
    }
    // Fetch payer name
    let payer_name = sqlx::query_scalar::<_, String>(
        "SELECT name FROM members WHERE id = $1 AND group_id = $2",
    )
    .bind(input.paid_by_id)
    .bind(group_id)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let payer_name = match payer_name {
        Some(n) => n,
        None => return (StatusCode::BAD_REQUEST, "invalid paid_by_id").into_response(),
    };

    let count = input.split_member_ids.len() as i64;
    let per = if count > 0 { input.amount / count } else { input.amount };
    let now = Utc::now();
    let exp_id = uuid::Uuid::new_v4();
    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "tx begin failed").into_response(),
    };
    if let Err(e) = sqlx::query(
        "INSERT INTO expenses (id, group_id, amount, description, paid_by_id, paid_by_name, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    )
    .bind(exp_id)
    .bind(group_id)
    .bind(input.amount)
    .bind(&input.description)
    .bind(input.paid_by_id)
    .bind(&payer_name)
    .bind(now)
    .execute(&mut *tx)
    .await
    {
        error!(?e, "insert expense failed");
        return (StatusCode::INTERNAL_SERVER_ERROR, "insert expense failed").into_response();
    }
    // Insert splits with resolved names
    for mid in &input.split_member_ids {
        let mname = sqlx::query_scalar::<_, String>(
            "SELECT name FROM members WHERE id = $1 AND group_id = $2",
        )
        .bind(mid)
        .bind(group_id)
        .fetch_optional(&mut *tx)
        .await
        .ok()
        .flatten()
        .unwrap_or_default();
        if let Err(e) = sqlx::query(
            "INSERT INTO expense_splits (expense_id, member_id, member_name, amount) VALUES ($1,$2,$3,$4)",
        )
        .bind(exp_id)
        .bind(mid)
        .bind(&mname)
        .bind(per)
        .execute(&mut *tx)
        .await
        {
            error!(?e, "insert splits failed");
            return (StatusCode::INTERNAL_SERVER_ERROR, "insert splits failed").into_response();
        }
    }
    if let Err(_) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, "tx commit failed").into_response();
    }
    let split_members: Vec<SplitMember> = input
        .split_member_ids
        .into_iter()
        .map(|mid| SplitMember { member_id: mid, member_name: String::new(), amount: per })
        .collect();
    let expense = Expense {
        id: exp_id,
        group_id,
        amount: input.amount,
        description: input.description,
        paid_by_id: input.paid_by_id,
        paid_by_name: payer_name,
        split_members,
        created_at: now,
    };
    (StatusCode::CREATED, Json(expense)).into_response()
}

pub async fn update_expense(
    State(state): State<AppState>,
    Path((group_id, expense_id)): Path<(uuid::Uuid, uuid::Uuid)>,
    Json(input): Json<UpdateExpenseInput>,
) -> impl IntoResponse {
    // Fetch payer name in this group
    let payer_name = sqlx::query_scalar::<_, String>(
        "SELECT name FROM members WHERE id = $1 AND group_id = $2",
    )
    .bind(input.paid_by_id)
    .bind(group_id)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let Some(payer_name) = payer_name else { return (StatusCode::BAD_REQUEST, "invalid paid_by_id").into_response(); };
    let count = input.split_member_ids.len() as i64;
    let per = if count > 0 { input.amount / count } else { input.amount };
    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "tx begin failed").into_response(),
    };
    let res = sqlx::query(
        "UPDATE expenses SET amount=$1, description=$2, paid_by_id=$3, paid_by_name=$4 WHERE id=$5 AND group_id=$6",
    )
    .bind(input.amount)
    .bind(&input.description)
    .bind(input.paid_by_id)
    .bind(&payer_name)
    .bind(expense_id)
    .bind(group_id)
    .execute(&mut *tx)
    .await;
    match res {
        Ok(r) if r.rows_affected() > 0 => {}
        Ok(_) => return (StatusCode::NOT_FOUND, "expense not found").into_response(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, "update failed").into_response(),
    }
    // Refresh splits
    if let Err(_) = sqlx::query("DELETE FROM expense_splits WHERE expense_id = $1")
        .bind(expense_id)
        .execute(&mut *tx)
        .await
    {
        return (StatusCode::INTERNAL_SERVER_ERROR, "delete splits failed").into_response();
    }
    for mid in &input.split_member_ids {
        let mname = sqlx::query_scalar::<_, String>(
            "SELECT name FROM members WHERE id = $1 AND group_id = $2",
        )
        .bind(mid)
        .bind(group_id)
        .fetch_optional(&mut *tx)
        .await
        .ok()
        .flatten()
        .unwrap_or_default();
        if let Err(_) = sqlx::query(
            "INSERT INTO expense_splits (expense_id, member_id, member_name, amount) VALUES ($1,$2,$3,$4)",
        )
        .bind(expense_id)
        .bind(mid)
        .bind(&mname)
        .bind(per)
        .execute(&mut *tx)
        .await
        {
            return (StatusCode::INTERNAL_SERVER_ERROR, "insert splits failed").into_response();
        }
    }
    if let Err(_) = tx.commit().await {
        return (StatusCode::INTERNAL_SERVER_ERROR, "tx commit failed").into_response();
    }
    // Build response model
    let splits = input
        .split_member_ids
        .into_iter()
        .map(|mid| SplitMember { member_id: mid, member_name: String::new(), amount: per })
        .collect();
    let expense = Expense {
        id: expense_id,
        group_id,
        amount: input.amount,
        description: input.description,
        paid_by_id: input.paid_by_id,
        paid_by_name: payer_name,
        split_members: splits,
        created_at: Utc::now(),
    };
    (StatusCode::OK, Json(expense)).into_response()
}

pub async fn delete_expense_by_id(
    State(state): State<AppState>,
    Path(expense_id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    match sqlx::query("DELETE FROM expenses WHERE id = $1")
        .bind(expense_id)
        .execute(&state.pool)
        .await
    {
        Ok(r) if r.rows_affected() > 0 => StatusCode::NO_CONTENT,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub async fn update_expense_by_id(
    State(state): State<AppState>,
    Path(expense_id): Path<uuid::Uuid>,
    Json(input): Json<UpdateExpenseInput>,
) -> impl IntoResponse {
    // Find existing expense to get group_id
    let row = sqlx::query("SELECT group_id FROM expenses WHERE id = $1")
        .bind(expense_id)
        .fetch_optional(&state.pool)
        .await;
    let row = match row { Ok(r) => r, Err(_) => None };
    let Some(row) = row else { return (StatusCode::NOT_FOUND, "expense not found").into_response(); };
    let group_id: uuid::Uuid = row.get("group_id");
    // Delegate to update_expense path using group_id
    update_expense(State(state), Path((group_id, expense_id)), Json(input)).await.into_response()
}
