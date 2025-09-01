use std::collections::HashMap;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use tracing::info;

use crate::models::{
    AppState, CalculateSettlementsRequest, CalculateSettlementsResult, MemberBalance, Settlement,
};
use sqlx::Row;

pub async fn calculate_settlements(
    State(state): State<AppState>,
    Path(group_id): Path<uuid::Uuid>,
    Json(req): Json<CalculateSettlementsRequest>,
) -> impl IntoResponse {
    info!(%group_id, expenses = req.expenses.len(), "calculate_settlements called");
    use std::cmp::Ordering;

    // Load members of the group to resolve names
    let member_rows = match sqlx::query(
        "SELECT id, name FROM members WHERE group_id = $1",
    )
    .bind(group_id)
    .fetch_all(&state.pool)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return (StatusCode::NOT_FOUND, "group not found").into_response(),
    };
    if member_rows.is_empty() {
        return (StatusCode::NOT_FOUND, "group not found").into_response();
    }
    // Initialize balances map for all members
    let mut balances: HashMap<uuid::Uuid, i64> = member_rows
        .iter()
        .map(|r| (r.get::<uuid::Uuid, _>("id"), 0_i64))
        .collect();

    // Compute balances from provided expenses
    for e in &req.expenses {
        if e.amount == 0 { continue; }
        let n = e.split_between.len() as i64;
        let per = if n > 0 { e.amount / n } else { e.amount };

        // Everyone in split pays their share
        for member_id in &e.split_between {
            if let Some(b) = balances.get_mut(member_id) {
                *b -= per;
            }
        }

        // Payer gets credited the full amount
        if let Some(b) = balances.get_mut(&e.payer_id) {
            *b += e.amount;
        }
    }

    // Build name map
    let name_of: HashMap<uuid::Uuid, String> = member_rows
        .iter()
        .map(|r| (r.get::<uuid::Uuid, _>("id"), r.get::<String, _>("name")))
        .collect();

    // Create lists of creditors and debtors
    let mut creditors: Vec<(uuid::Uuid, i64)> = balances
        .iter()
        .filter_map(|(id, &bal)| if bal > 0 { Some((*id, bal)) } else { None })
        .collect();
    let mut debtors: Vec<(uuid::Uuid, i64)> = balances
        .iter()
        .filter_map(|(id, &bal)| if bal < 0 { Some((*id, -bal)) } else { None })
        .collect();

    // Sort by magnitude descending for greedy pairing
    creditors.sort_by(|a, b| b.1.cmp(&a.1));
    debtors.sort_by(|a, b| b.1.cmp(&a.1));

    let mut settlements: Vec<Settlement> = Vec::new();
    let mut i = 0_usize;
    let mut j = 0_usize;
    while i < debtors.len() && j < creditors.len() {
        let (debtor_id, mut d_amt) = debtors[i];
        let (creditor_id, mut c_amt) = creditors[j];
        let pay = d_amt.min(c_amt);

        if pay > 0 {
            settlements.push(Settlement {
                from_member_id: debtor_id,
                to_member_id: creditor_id,
                amount: pay,
                from_name: name_of.get(&debtor_id).cloned().unwrap_or_default(),
                to_name: name_of.get(&creditor_id).cloned().unwrap_or_default(),
            });
        }

        d_amt -= pay;
        c_amt -= pay;
        match (d_amt.cmp(&0), c_amt.cmp(&0)) {
            (Ordering::Equal, Ordering::Equal) => { i += 1; j += 1; }
            (Ordering::Equal, _) => { debtors[i].1 = 0; i += 1; creditors[j].1 = c_amt; }
            (_, Ordering::Equal) => { creditors[j].1 = 0; j += 1; debtors[i].1 = d_amt; }
            _ => { debtors[i].1 = d_amt; creditors[j].1 = c_amt; }
        }
    }

    // Build balances list with names
    let balances_list: Vec<MemberBalance> = member_rows
        .iter()
        .map(|r| {
            let id: uuid::Uuid = r.get("id");
            MemberBalance {
                member_id: id,
                member_name: r.get::<String, _>("name"),
                balance: *balances.get(&id).unwrap_or(&0),
            }
        })
        .collect();

    (StatusCode::OK, Json(CalculateSettlementsResult { settlements, balances: balances_list })).into_response()
}
