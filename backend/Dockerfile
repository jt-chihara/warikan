# Multi-stage build for Rust Axum API

FROM rust:1.79 as builder
WORKDIR /app

# Copy manifest first to leverage Docker layer cache for deps
COPY Cargo.toml ./

# Copy actual source and build release binary
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
