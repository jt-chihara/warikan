use std::net::SocketAddr;

use axum::{
    http::{HeaderName, Method},
    routing::{delete, get, post, put},
    Router,
};
use tower_http::cors::CorsLayer;
use tracing::{info, Level};

mod models;
mod routes;
use crate::models::AppState;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let state = AppState::default();

    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([
            HeaderName::from_static("content-type"),
            HeaderName::from_static("x-api-key"),
        ]);

    let app = Router::new()
        .route("/healthz", get(routes::health::health))
        .route(
            "/groups",
            get(routes::groups::list_groups).post(routes::groups::create_group),
        )
        .route(
            "/groups/:id",
            get(routes::groups::get_group)
                .put(routes::groups::update_group)
                .delete(routes::groups::delete_group),
        )
        .route(
            "/groups/:id/members",
            post(routes::members::add_member),
        )
        .route(
            "/groups/:id/members/:member_id",
            delete(routes::members::remove_member),
        )
        .route(
            "/groups/:id/expenses",
            get(routes::expenses::list_expenses).post(routes::expenses::add_expense),
        )
        .route(
            "/groups/:id/expenses/:expense_id",
            put(routes::expenses::update_expense),
        )
        .route(
            "/expenses/:expense_id",
            delete(routes::expenses::delete_expense_by_id)
                .put(routes::expenses::update_expense_by_id),
        )
        .route(
            "/groups/:id/settlements/calculate",
            post(routes::settlements::calculate_settlements),
        )
        .with_state(state)
        .layer(cors);

    let port: u16 = std::env::var("PORT").ok().and_then(|s| s.parse().ok()).unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!(%addr, "starting server");
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}
