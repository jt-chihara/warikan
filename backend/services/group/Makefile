.PHONY: build run test clean docker-build docker-run

# Build the application
build:
	go build -o bin/group-server ./cmd/server

# Run the application
run: build
	./bin/group-server

# Run unit tests
test:
	go test -v ./internal/...

# Run unit tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./internal/...
	go tool cover -html=coverage.out -o coverage.html

# Run integration tests (requires test database)
test-integration:
	go test -v -tags=integration .

# Clean build artifacts
clean:
	rm -rf bin/

# Build Docker image
docker-build:
	docker build -t warikan-group-service .

# Run Docker container
docker-run: docker-build
	docker run -p 50051:50051 --env-file .env warikan-group-service

# Install dependencies
deps:
	go mod tidy

# Development setup
dev-setup: deps
	cp .env.example .env