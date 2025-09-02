.PHONY: build-migrate run-migrate migrate-up migrate-down migrate-create proto help

# Build migration tool
build-migrate:
	go build -o bin/migrate ./cmd/migrate

# Run migration up
migrate-up: build-migrate
	cd migrations && ../bin/migrate -direction up

# Run migration down
migrate-down: build-migrate
	cd migrations && ../bin/migrate -direction down

# Generate protobuf files
proto:
	protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/group/v1/group.proto

# Create new migration file
migrate-create:
	@if [ -z "$(NAME)" ]; then \
		echo "Usage: make migrate-create NAME=migration_name"; \
		exit 1; \
	fi
	@timestamp=$$(date +%Y%m%d%H%M%S); \
	filename="migrations/$${timestamp}_$(NAME).sql"; \
	echo "-- Migration: $(NAME)" > $$filename; \
	echo "-- Created: $$(date)" >> $$filename; \
	echo "" >> $$filename; \
	echo "-- Up migration" >> $$filename; \
	echo "" >> $$filename; \
	echo "-- Down migration (add your down migration here)" >> $$filename; \
	echo "Created migration file: $$filename"

# Install dependencies
deps:
	go mod tidy

# Development setup
dev-setup: deps
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "DATABASE_URL=postgres://user:password@localhost/warikan?sslmode=disable" > .env; \
		echo "Created .env file with default database URL"; \
	fi

# Clean build artifacts
clean:
	rm -rf bin/

# Show help
help:
	@echo "Available commands:"
	@echo "  make migrate-up        - Run all up migrations"
	@echo "  make migrate-down      - Run all down migrations" 
	@echo "  make migrate-create NAME=name - Create new migration file"
	@echo "  make dev-setup         - Setup development environment"
	@echo "  make deps              - Install dependencies"
	@echo "  make clean             - Clean build artifacts"