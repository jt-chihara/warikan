package main

import (
	"database/sql"
	"log"
	"net"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
	"github.com/jt-chihara/warikan/services/group/internal/handler"
	"github.com/jt-chihara/warikan/services/group/internal/repository"
	"github.com/jt-chihara/warikan/services/group/internal/service"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Local development fallback
		dbURL = "postgres://user:password@localhost/warikan?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Initialize layers
	groupRepo := repository.NewGroupRepository(db)
	expenseRepo := repository.NewExpenseRepository(db)
	groupService := service.NewGroupService(groupRepo, expenseRepo)
	groupHandler := handler.NewGroupHandler(groupService)

	// gRPC server setup
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()

	// Register GroupService
	groupv1.RegisterGroupServiceServer(s, groupHandler)

	log.Printf("Group service listening on port %s", port)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
