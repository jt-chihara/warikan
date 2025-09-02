package main

import (
	"database/sql"
	"flag"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	var direction = flag.String("direction", "up", "Migration direction: up or down")
	var steps = flag.Int("steps", 0, "Number of steps (0 means all)")
	flag.Parse()

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
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

	// Create postgres driver instance
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		log.Fatalf("Failed to create postgres driver: %v", err)
	}

	// Create migrate instance
	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"postgres", 
		driver,
	)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}

	// Run migration
	switch *direction {
	case "up":
		if *steps == 0 {
			err = m.Up()
			if err != nil && err != migrate.ErrNoChange {
				log.Fatalf("Failed to run up migrations: %v", err)
			}
			log.Println("Up migrations completed successfully")
		} else {
			err = m.Steps(*steps)
			if err != nil {
				log.Fatalf("Failed to run %d steps: %v", *steps, err)
			}
			log.Printf("Successfully ran %d migration steps", *steps)
		}
	case "down":
		if *steps == 0 {
			err = m.Down()
			if err != nil && err != migrate.ErrNoChange {
				log.Fatalf("Failed to run down migrations: %v", err)
			}
			log.Println("Down migrations completed successfully")
		} else {
			err = m.Steps(-*steps)
			if err != nil {
				log.Fatalf("Failed to run %d down steps: %v", *steps, err)
			}
			log.Printf("Successfully ran %d down migration steps", *steps)
		}
	default:
		log.Fatalf("Invalid direction: %s. Use 'up' or 'down'", *direction)
	}

	version, dirty, err := m.Version()
	if err != nil {
		log.Printf("Could not get migration version: %v", err)
	} else {
		log.Printf("Current migration version: %d (dirty: %t)", version, dirty)
	}
}