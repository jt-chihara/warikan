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
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Setup database connection
    let db_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        // Local default (docker-compose host)
        "postgres://warikan:warikan_dev_password@localhost:5432/warikan".to_string()
    });
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .expect("failed to connect to database");

    // Run SQLx migrations (tracked in sqlx_migrations table)
    if let Err(e) = sqlx::migrate!().run(&pool).await {
        // Strict mode by default; set SQLX_MIGRATE_STRICT=false to allow duplicate-entry warning
        let strict = std::env::var("SQLX_MIGRATE_STRICT").map(|v| v != "false" && v != "0").unwrap_or(true);
        let msg = e.to_string();
        let is_dup = msg.contains("_sqlx_migrations_pkey") || msg.contains("duplicate key value") || msg.contains("23505");
        if is_dup && !strict {
            tracing::warn!(%msg, "duplicate migration entry detected; continuing (non-strict mode)");
        } else {
            panic!("failed to run migrations: {e}");
        }
    }

    // Apply SQLx migrations (schema managed under backend/migrations)
    let state = AppState::new(pool);

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
