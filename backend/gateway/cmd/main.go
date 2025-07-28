package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/graphql-go/handler"
	"github.com/rs/cors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/jt-chihara/warikan/backend/gateway/internal"
	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

func main() {
	// Get group service URL from environment
	groupServiceURL := os.Getenv("GROUP_SERVICE_URL")
	if groupServiceURL == "" {
		groupServiceURL = "localhost:50051"
	}

	// Connect to group service
	conn, err := grpc.Dial(groupServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
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
	
	// API Key authentication middleware
	authMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip auth for OPTIONS requests (CORS preflight)
			if r.Method == "OPTIONS" {
				next.ServeHTTP(w, r)
				return
			}
			
			// Get API key from environment
			expectedAPIKey := os.Getenv("API_KEY")
			if expectedAPIKey == "" {
				// If no API key is set, allow all requests (development mode)
				next.ServeHTTP(w, r)
				return
			}
			
			// Check API key from header
			apiKey := r.Header.Get("X-API-Key")
			if apiKey != expectedAPIKey {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			
			next.ServeHTTP(w, r)
		})
	}
	
	// Apply auth middleware to GraphQL endpoint
	router.Handle("/graphql", authMiddleware(h)).Methods("GET", "POST", "OPTIONS")

	// Setup CORS for both local and production
	var allowedOrigins []string
	
	// Get FRONTEND_URLS from environment (comma-separated list)
	if frontendURLs := os.Getenv("FRONTEND_URLS"); frontendURLs != "" {
		origins := strings.Split(frontendURLs, ",")
		for _, origin := range origins {
			allowedOrigins = append(allowedOrigins, strings.TrimSpace(origin))
		}
	} else {
		// Default origins for local development
		allowedOrigins = []string{
			"http://localhost:5173", 
			"http://localhost:3000",
		}
	}
	
	// Add additional custom origins from ALLOWED_ORIGINS (for backward compatibility)
	if customOrigins := os.Getenv("ALLOWED_ORIGINS"); customOrigins != "" {
		additionalOrigins := strings.Split(customOrigins, ",")
		for _, origin := range additionalOrigins {
			allowedOrigins = append(allowedOrigins, strings.TrimSpace(origin))
		}
	}
	
	log.Printf("CORS allowed origins: %v", allowedOrigins)
	
	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "443"
	}

	log.Printf("GraphQL Gateway server started on :%s", port)
	log.Printf("GraphQL endpoint: http://localhost:%s/graphql", port)
	log.Printf("GraphiQL playground: http://localhost:%s/graphql", port)
	
	log.Fatal(http.ListenAndServe(":"+port, handler))
}