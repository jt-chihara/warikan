# Multi-stage build for Rust Axum API

FROM rust:1.83 as builder
WORKDIR /app

# Copy manifest first to leverage Docker layer cache for deps
COPY Cargo.toml Cargo.lock ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy actual source and build release binary
# Bring in migrations for sqlx::migrate! macro at compile-time
COPY migrations ./migrations
COPY src ./src
RUN cargo build --release

FROM debian:12-slim
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/warikan-api /usr/local/bin/warikan-api

ENV PORT=8080
EXPOSE 8080
# run as non-root user
RUN useradd -u 10001 -r -s /usr/sbin/nologin appuser
USER 10001
ENTRYPOINT ["/usr/local/bin/warikan-api"]
