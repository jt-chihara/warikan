//go:build integration
// +build integration

package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	_ "github.com/lib/pq"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
	"github.com/jt-chihara/warikan/services/group/internal/handler"
	"github.com/jt-chihara/warikan/services/group/internal/repository"
	"github.com/jt-chihara/warikan/services/group/internal/service"
)

type IntegrationTestSuite struct {
	suite.Suite
	db      *sql.DB
	handler *handler.GroupHandler
}

func (suite *IntegrationTestSuite) SetupSuite() {
	// Get test database URL from environment
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://user:password@localhost/warikan_test?sslmode=disable"
	}

	// Connect to test database
	db, err := sql.Open("postgres", dbURL)
	require.NoError(suite.T(), err)
	
	err = db.Ping()
	require.NoError(suite.T(), err)

	suite.db = db

	// Initialize service layers
	repo := repository.NewGroupRepository(db)
	svc := service.NewGroupService(repo)
	suite.handler = handler.NewGroupHandler(svc)

	// Run migrations or create test tables
	suite.setupTestTables()
}

func (suite *IntegrationTestSuite) TearDownSuite() {
	if suite.db != nil {
		suite.cleanupTestTables()
		suite.db.Close()
	}
}

func (suite *IntegrationTestSuite) SetupTest() {
	// Clean up data before each test
	_, err := suite.db.Exec("DELETE FROM members")
	require.NoError(suite.T(), err)
	_, err = suite.db.Exec("DELETE FROM groups")
	require.NoError(suite.T(), err)
}

func (suite *IntegrationTestSuite) setupTestTables() {
	// Create test tables (simplified schema for testing)
	queries := []string{
		`CREATE TABLE IF NOT EXISTS groups (
			id UUID PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS members (
			id UUID PRIMARY KEY,
			group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255),
			joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, query := range queries {
		_, err := suite.db.Exec(query)
		require.NoError(suite.T(), err)
	}
}

func (suite *IntegrationTestSuite) cleanupTestTables() {
	// Drop test tables
	queries := []string{
		"DROP TABLE IF EXISTS members",
		"DROP TABLE IF EXISTS groups",
	}

	for _, query := range queries {
		_, err := suite.db.Exec(query)
		if err != nil {
			log.Printf("Error cleaning up table: %v", err)
		}
	}
}

func (suite *IntegrationTestSuite) TestCreateAndGetGroup() {
	ctx := context.Background()

	// Test CreateGroup
	createReq := &groupv1.CreateGroupRequest{
		Name:        "Integration Test Group",
		Description: "Test Description",
		Currency:    "USD",
		MemberNames: []string{"Alice", "Bob", "Charlie"},
	}

	createResp, err := suite.handler.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), createResp.Group.ID)
	assert.Equal(suite.T(), createReq.Name, createResp.Group.Name)
	assert.Equal(suite.T(), createReq.Description, createResp.Group.Description)
	assert.Equal(suite.T(), createReq.Currency, createResp.Group.Currency)
	assert.Len(suite.T(), createResp.Group.Members, 3)

	groupID := createResp.Group.ID

	// Test GetGroup
	getReq := &groupv1.GetGroupRequest{ID: groupID}
	getResp, err := suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), groupID, getResp.Group.ID)
	assert.Equal(suite.T(), createReq.Name, getResp.Group.Name)
	assert.Len(suite.T(), getResp.Group.Members, 3)

	// Verify member names
	memberNames := make([]string, len(getResp.Group.Members))
	for i, member := range getResp.Group.Members {
		memberNames[i] = member.Name
	}
	assert.Contains(suite.T(), memberNames, "Alice")
	assert.Contains(suite.T(), memberNames, "Bob")
	assert.Contains(suite.T(), memberNames, "Charlie")
}

func (suite *IntegrationTestSuite) TestUpdateGroup() {
	ctx := context.Background()

	// Create initial group
	createReq := &groupv1.CreateGroupRequest{
		Name:        "Original Group",
		Description: "Original Description",
		Currency:    "JPY",
		MemberNames: []string{"Alice"},
	}

	createResp, err := suite.handler.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)

	groupID := createResp.Group.ID

	// Update group
	updateReq := &groupv1.UpdateGroupRequest{
		ID:          groupID,
		Name:        "Updated Group",
		Description: "Updated Description",
		Currency:    "USD",
	}

	updateResp, err := suite.handler.UpdateGroup(ctx, updateReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), updateReq.Name, updateResp.Group.Name)
	assert.Equal(suite.T(), updateReq.Description, updateResp.Group.Description)
	assert.Equal(suite.T(), updateReq.Currency, updateResp.Group.Currency)

	// Verify update persisted
	getReq := &groupv1.GetGroupRequest{ID: groupID}
	getResp, err := suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), updateReq.Name, getResp.Group.Name)
	assert.Equal(suite.T(), updateReq.Description, getResp.Group.Description)
	assert.Equal(suite.T(), updateReq.Currency, getResp.Group.Currency)
}

func (suite *IntegrationTestSuite) TestAddAndRemoveMember() {
	ctx := context.Background()

	// Create initial group
	createReq := &groupv1.CreateGroupRequest{
		Name:        "Test Group",
		Description: "Test Description",
		Currency:    "JPY",
		MemberNames: []string{"Alice"},
	}

	createResp, err := suite.handler.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)

	groupID := createResp.Group.ID
	initialMemberCount := len(createResp.Group.Members)

	// Add member
	addReq := &groupv1.AddMemberRequest{
		GroupID:     groupID,
		MemberName:  "Bob",
		MemberEmail: "bob@example.com",
	}

	addResp, err := suite.handler.AddMember(ctx, addReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Bob", addResp.Member.Name)
	assert.Equal(suite.T(), "bob@example.com", addResp.Member.Email)

	// Verify member was added
	getReq := &groupv1.GetGroupRequest{ID: groupID}
	getResp, err := suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), getResp.Group.Members, initialMemberCount+1)

	// Find Bob in members list
	var bobMember *groupv1.Member
	for _, member := range getResp.Group.Members {
		if member.Name == "Bob" {
			bobMember = &member
			break
		}
	}
	require.NotNil(suite.T(), bobMember)
	assert.Equal(suite.T(), "bob@example.com", bobMember.Email)

	// Remove member
	removeReq := &groupv1.RemoveMemberRequest{
		GroupID:  groupID,
		MemberID: bobMember.ID,
	}

	removeResp, err := suite.handler.RemoveMember(ctx, removeReq)
	require.NoError(suite.T(), err)
	assert.True(suite.T(), removeResp.Success)

	// Verify member was removed
	getResp2, err := suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), getResp2.Group.Members, initialMemberCount)

	// Verify Bob is not in members list
	for _, member := range getResp2.Group.Members {
		assert.NotEqual(suite.T(), "Bob", member.Name)
	}
}

func (suite *IntegrationTestSuite) TestDeleteGroup() {
	ctx := context.Background()

	// Create group
	createReq := &groupv1.CreateGroupRequest{
		Name:        "Group to Delete",
		Description: "This group will be deleted",
		Currency:    "JPY",
		MemberNames: []string{"Alice"},
	}

	createResp, err := suite.handler.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)

	groupID := createResp.Group.ID

	// Verify group exists
	getReq := &groupv1.GetGroupRequest{ID: groupID}
	_, err = suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)

	// Delete group
	deleteReq := &groupv1.DeleteGroupRequest{ID: groupID}
	deleteResp, err := suite.handler.DeleteGroup(ctx, deleteReq)
	require.NoError(suite.T(), err)
	assert.True(suite.T(), deleteResp.Success)

	// Verify group was deleted
	_, err = suite.handler.GetGroup(ctx, getReq)
	assert.Error(suite.T(), err) // Should fail because group no longer exists
}

func TestIntegrationTestSuite(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}

	suite.Run(t, new(IntegrationTestSuite))
}