# Gateway Dockerfile for development
FROM golang:1.23-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go workspace files
COPY go.work go.work.sum ./
COPY go.mod go.sum ./

# Copy source code for all modules
COPY . .

# Download dependencies
RUN go work sync
RUN go mod download

# Expose port
EXPOSE 8080

# Start development server with hot reload
CMD ["go", "run", "./gateway/cmd/main.go"]