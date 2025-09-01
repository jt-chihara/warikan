use axum::{extract::State, response::IntoResponse};

use crate::models::AppState;

pub async fn health(State(state): State<AppState>) -> impl IntoResponse {
    // Try a lightweight DB check
    let _ = sqlx::query_scalar::<_, i64>("SELECT 1")
        .fetch_one(&state.pool)
        .await
        .ok();
    "ok"
}
