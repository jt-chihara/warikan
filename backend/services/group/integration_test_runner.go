//go:build integration
// +build integration

package main

// This file helps with integration test compilation by providing a separate build target
import (
	"os"

	_ "github.com/jt-chihara/warikan/backend/proto/group/v1"
	_ "github.com/jt-chihara/warikan/services/group/internal/algorithm"
	_ "github.com/jt-chihara/warikan/services/group/internal/domain"
	_ "github.com/jt-chihara/warikan/services/group/internal/handler"
	_ "github.com/jt-chihara/warikan/services/group/internal/repository"
	_ "github.com/jt-chihara/warikan/services/group/internal/service"
)

func init() {
	// Set test database URL if not provided
	if os.Getenv("TEST_DATABASE_URL") == "" {
		os.Setenv("TEST_DATABASE_URL", "postgres://user:password@localhost/warikan_test?sslmode=disable")
	}
}