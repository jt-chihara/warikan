package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/graphql-go/handler"
	"github.com/rs/cors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/username/warikan/backend/gateway/internal"
	groupv1 "github.com/username/warikan/backend/proto/group/v1"
)

func main() {
	// Connect to group service
	conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to group service: %v", err)
	}
	defer conn.Close()

	groupClient := groupv1.NewGroupServiceClient(conn)

	// Create GraphQL schema
	schema, err := internal.NewSchema(groupClient)
	if err != nil {
		log.Fatalf("Failed to create schema: %v", err)
	}

	// Create GraphQL handler
	h := handler.New(&handler.Config{
		Schema:     &schema,
		Pretty:     true,
		GraphiQL:   true,
		Playground: true,
	})

	// Setup router
	router := mux.NewRouter()
	router.Handle("/graphql", h).Methods("GET", "POST", "OPTIONS")

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	log.Println("GraphQL Gateway server started on :8080")
	log.Println("GraphQL endpoint: http://localhost:8080/graphql")
	log.Println("GraphiQL playground: http://localhost:8080/graphql")
	
	log.Fatal(http.ListenAndServe(":8080", handler))
}