# Development Dockerfile
FROM golang:1.23-alpine

WORKDIR /app

# Install dependencies including protobuf compiler
RUN apk add --no-cache git protobuf-dev

# Install protoc-gen-go and protoc-gen-go-grpc
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Copy go workspace files
COPY go.work go.work.sum ./
COPY go.mod go.sum ./

# Copy source code for all modules
COPY . .

# Generate protobuf files
RUN protoc --go_out=. --go-grpc_out=. proto/group/v1/group.proto

# Download dependencies
RUN go work sync
RUN go mod download

# Expose port
EXPOSE 50051

# Start development server with hot reload
CMD ["go", "run", "./services/group/cmd/server/main.go"]