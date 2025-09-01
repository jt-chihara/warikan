use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;

use crate::models::{AddExpenseInput, AppState, Expense, SplitMember, UpdateExpenseInput};

pub async fn list_expenses(
    State(state): State<AppState>,
    Path(group_id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    let store = state.0.read().await;
    if let Some(list) = store.expenses.get(&group_id) {
        Json(list.clone())
    } else {
        Json::<Vec<Expense>>(vec![])
    }
}

pub async fn add_expense(
    State(state): State<AppState>,
    Path(group_id): Path<uuid::Uuid>,
    Json(input): Json<AddExpenseInput>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    let group = match store.groups.get(&group_id) {
        Some(g) => g.clone(),
        None => return (StatusCode::NOT_FOUND, "group not found").into_response(),
    };

    let payer = group
        .members
        .iter()
        .find(|m| m.id == input.paid_by_id)
        .cloned();
    let payer = match payer {
        Some(p) => p,
        None => return (StatusCode::BAD_REQUEST, "invalid paid_by_id").into_response(),
    };

    let count = input.split_member_ids.len() as i64;
    let per = if count > 0 { input.amount / count } else { input.amount };
    let split_members: Vec<SplitMember> = input
        .split_member_ids
        .iter()
        .filter_map(|id| group.members.iter().find(|m| &m.id == id))
        .map(|m| SplitMember {
            member_id: m.id,
            member_name: m.name.clone(),
            amount: per,
        })
        .collect();

    let expense = Expense {
        id: uuid::Uuid::new_v4(),
        group_id,
        amount: input.amount,
        description: input.description,
        paid_by_id: payer.id,
        paid_by_name: payer.name,
        split_members,
        created_at: Utc::now(),
    };

    store.expenses.entry(group_id).or_default().push(expense.clone());
    (StatusCode::CREATED, Json(expense)).into_response()
}

pub async fn update_expense(
    State(state): State<AppState>,
    Path((group_id, expense_id)): Path<(uuid::Uuid, uuid::Uuid)>,
    Json(input): Json<UpdateExpenseInput>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    let Some(list) = store.expenses.get_mut(&group_id) else {
        return (StatusCode::NOT_FOUND, "group not found").into_response();
    };

    if let Some(idx) = list.iter().position(|e| e.id == expense_id) {
        let created_at = list[idx].created_at;
        let paid_by_name = list[idx].paid_by_name.clone();
        let mut expense = list[idx].clone();
        expense.amount = input.amount;
        expense.description = input.description;
        expense.paid_by_id = input.paid_by_id;
        expense.paid_by_name = paid_by_name;
        expense.created_at = created_at;
        let count = input.split_member_ids.len() as i64;
        let per = if count > 0 { input.amount / count } else { input.amount };
        expense.split_members = input
            .split_member_ids
            .iter()
            .map(|member_id| SplitMember {
                member_id: *member_id,
                member_name: String::new(),
                amount: per,
            })
            .collect();
        list[idx] = expense.clone();
        (StatusCode::OK, Json(expense)).into_response()
    } else {
        (StatusCode::NOT_FOUND, "expense not found").into_response()
    }
}

pub async fn delete_expense_by_id(
    State(state): State<AppState>,
    Path(expense_id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    for (_gid, list) in store.expenses.iter_mut() {
        let before = list.len();
        list.retain(|e| e.id != expense_id);
        if list.len() < before {
            return StatusCode::NO_CONTENT;
        }
    }
    StatusCode::NOT_FOUND
}

pub async fn update_expense_by_id(
    State(state): State<AppState>,
    Path(expense_id): Path<uuid::Uuid>,
    Json(input): Json<UpdateExpenseInput>,
) -> impl IntoResponse {
    let mut store = state.0.write().await;
    for (_gid, list) in store.expenses.iter_mut() {
        if let Some(idx) = list.iter().position(|e| e.id == expense_id) {
            let created_at = list[idx].created_at;
            let paid_by_name = list[idx].paid_by_name.clone();
            let mut expense = list[idx].clone();
            expense.amount = input.amount;
            expense.description = input.description;
            expense.paid_by_id = input.paid_by_id;
            expense.paid_by_name = paid_by_name;
            expense.created_at = created_at;
            let count = input.split_member_ids.len() as i64;
            let per = if count > 0 { input.amount / count } else { input.amount };
            expense.split_members = input
                .split_member_ids
                .iter()
                .map(|member_id| SplitMember {
                    member_id: *member_id,
                    member_name: String::new(),
                    amount: per,
                })
                .collect();
            list[idx] = expense.clone();
            return (StatusCode::OK, Json(expense)).into_response();
        }
    }
    (StatusCode::NOT_FOUND, "expense not found").into_response()
}

