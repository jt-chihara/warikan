//go:build integration
// +build integration

package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
	"github.com/jt-chihara/warikan/services/group/internal/handler"
	"github.com/jt-chihara/warikan/services/group/internal/repository"
	"github.com/jt-chihara/warikan/services/group/internal/service"
)

type IntegrationTestSuite struct {
	suite.Suite
	db         *sql.DB
	handler    *handler.GroupHandler
	grpcServer *grpc.Server
	listener   *bufconn.Listener
	client     groupv1.GroupServiceClient
}

func (suite *IntegrationTestSuite) SetupSuite() {
	// Get test database URL from environment
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		// Use existing docker compose database for integration tests
		// Try docker network hostname first, then localhost
		if os.Getenv("DOCKER_ENV") != "" {
			dbURL = "postgres://warikan:warikan_dev_password@db:5432/warikan?sslmode=disable"
		} else {
			dbURL = "postgres://warikan:warikan_dev_password@localhost:5432/warikan?sslmode=disable"
		}
	}

	// Connect to test database
	db, err := sql.Open("postgres", dbURL)
	require.NoError(suite.T(), err)
	
	err = db.Ping()
	require.NoError(suite.T(), err)

	suite.db = db

	// Initialize service layers
	groupRepo := repository.NewGroupRepository(db)
	expenseRepo := repository.NewExpenseRepository(db)
	groupService := service.NewGroupService(groupRepo, expenseRepo)
	suite.handler = handler.NewGroupHandler(groupService)

	// Set up gRPC server for testing
	suite.setupGRPCServer()

	// Run migrations or create test tables
	suite.setupTestTables()
}

func (suite *IntegrationTestSuite) setupGRPCServer() {
	const bufSize = 1024 * 1024
	suite.listener = bufconn.Listen(bufSize)
	
	suite.grpcServer = grpc.NewServer()
	groupv1.RegisterGroupServiceServer(suite.grpcServer, suite.handler)
	
	go func() {
		if err := suite.grpcServer.Serve(suite.listener); err != nil {
			log.Printf("gRPC server error: %v", err)
		}
	}()

	// Create gRPC client
	conn, err := grpc.DialContext(context.Background(), "bufnet",
		grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) {
			return suite.listener.Dial()
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(suite.T(), err)
	
	suite.client = groupv1.NewGroupServiceClient(conn)
}

func (suite *IntegrationTestSuite) TearDownSuite() {
	if suite.grpcServer != nil {
		suite.grpcServer.Stop()
	}
	if suite.listener != nil {
		suite.listener.Close()
	}
	if suite.db != nil {
		suite.cleanupTestTables()
		suite.db.Close()
	}
}

func (suite *IntegrationTestSuite) SetupTest() {
	// Clean up data before each test
	_, err := suite.db.Exec("DELETE FROM expense_splits")
	require.NoError(suite.T(), err)
	_, err = suite.db.Exec("DELETE FROM expenses")
	require.NoError(suite.T(), err)
	_, err = suite.db.Exec("DELETE FROM members")
	require.NoError(suite.T(), err)
	_, err = suite.db.Exec("DELETE FROM groups")
	require.NoError(suite.T(), err)
}

func (suite *IntegrationTestSuite) setupTestTables() {
	// Tables already exist in the database, no need to create them
	// Just verify they exist
	tableCheckQueries := []string{
		"SELECT 1 FROM groups LIMIT 1",
		"SELECT 1 FROM members LIMIT 1", 
		"SELECT 1 FROM expenses LIMIT 1",
		"SELECT 1 FROM expense_splits LIMIT 1",
	}

	for _, query := range tableCheckQueries {
		_, err := suite.db.Exec(query)
		if err != nil {
			suite.T().Logf("Warning: Table check failed for query '%s': %v", query, err)
		}
	}
}

func (suite *IntegrationTestSuite) cleanupTestTables() {
	// Don't drop tables as they are part of the persistent database
	// Just clean up test data if needed
	suite.T().Log("Skipping table cleanup - using persistent database")
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
	assert.NotEmpty(suite.T(), createResp.Group.Id)
	assert.Equal(suite.T(), createReq.Name, createResp.Group.Name)
	assert.Equal(suite.T(), createReq.Description, createResp.Group.Description)
	assert.Equal(suite.T(), createReq.Currency, createResp.Group.Currency)
	assert.Len(suite.T(), createResp.Group.Members, 3)

	groupID := createResp.Group.Id

	// Test GetGroup
	getReq := &groupv1.GetGroupRequest{Id: groupID}
	getResp, err := suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), groupID, getResp.Group.Id)
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

	groupID := createResp.Group.Id

	// Update group
	updateReq := &groupv1.UpdateGroupRequest{
		Id:          groupID,
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
	getReq := &groupv1.GetGroupRequest{Id: groupID}
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

	groupID := createResp.Group.Id
	initialMemberCount := len(createResp.Group.Members)

	// Add member
	addReq := &groupv1.AddMemberRequest{
		GroupId:    groupID,
		MemberName: "Bob",
	}

	addResp, err := suite.handler.AddMember(ctx, addReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Bob", addResp.Member.Name)

	// Verify member was added
	getReq := &groupv1.GetGroupRequest{Id: groupID}
	getResp, err := suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), getResp.Group.Members, initialMemberCount+1)

	// Find Bob in members list
	var bobMember *groupv1.Member
	for _, member := range getResp.Group.Members {
		if member.Name == "Bob" {
			bobMember = member
			break
		}
	}
	require.NotNil(suite.T(), bobMember)

	// Remove member
	removeReq := &groupv1.RemoveMemberRequest{
		GroupId:  groupID,
		MemberId: bobMember.Id,
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

	groupID := createResp.Group.Id

	// Verify group exists
	getReq := &groupv1.GetGroupRequest{Id: groupID}
	_, err = suite.handler.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)

	// Delete group
	deleteReq := &groupv1.DeleteGroupRequest{Id: groupID}
	deleteResp, err := suite.handler.DeleteGroup(ctx, deleteReq)
	require.NoError(suite.T(), err)
	assert.True(suite.T(), deleteResp.Success)

	// Verify group was deleted
	_, err = suite.handler.GetGroup(ctx, getReq)
	assert.Error(suite.T(), err) // Should fail because group no longer exists
}

// Test gRPC communication using actual gRPC client
func (suite *IntegrationTestSuite) TestGRPCCommunication() {
	ctx := context.Background()

	// Test CreateGroup via gRPC
	createReq := &groupv1.CreateGroupRequest{
		Name:        "gRPC Test Group",
		Description: "Testing gRPC communication",
		Currency:    "JPY",
		MemberNames: []string{"Alice", "Bob"},
	}

	createResp, err := suite.client.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), createResp.Group.Id)
	assert.Equal(suite.T(), createReq.Name, createResp.Group.Name)
	assert.Len(suite.T(), createResp.Group.Members, 2)

	groupID := createResp.Group.Id

	// Test GetGroup via gRPC
	getReq := &groupv1.GetGroupRequest{Id: groupID}
	getResp, err := suite.client.GetGroup(ctx, getReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), groupID, getResp.Group.Id)
	assert.Equal(suite.T(), createReq.Name, getResp.Group.Name)
}

// Test expense operations end-to-end
func (suite *IntegrationTestSuite) TestExpenseOperations() {
	ctx := context.Background()

	// Create group with members
	createReq := &groupv1.CreateGroupRequest{
		Name:        "Expense Test Group",
		Description: "Testing expense operations",
		Currency:    "JPY",
		MemberNames: []string{"Alice", "Bob", "Carol"},
	}

	createResp, err := suite.client.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)
	
	groupID := createResp.Group.Id
	members := createResp.Group.Members
	require.Len(suite.T(), members, 3)

	// Create expense
	expenseReq := &groupv1.AddExpenseRequest{
		GroupId:        groupID,
		Amount:         3000,
		Description:    "Lunch",
		PaidById:       members[0].Id, // Alice pays
		SplitMemberIds: []string{members[0].Id, members[1].Id, members[2].Id}, // Split among all
	}

	expenseResp, err := suite.client.AddExpense(ctx, expenseReq)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), int64(3000), expenseResp.Expense.Amount)
	assert.Equal(suite.T(), "Lunch", expenseResp.Expense.Description)
	assert.Len(suite.T(), expenseResp.Expense.SplitMembers, 3)

	expenseID := expenseResp.Expense.Id

	// Get group expenses
	expensesReq := &groupv1.GetGroupExpensesRequest{GroupId: groupID}
	expensesResp, err := suite.client.GetGroupExpenses(ctx, expensesReq)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), expensesResp.Expenses, 1)
	assert.Equal(suite.T(), expenseID, expensesResp.Expenses[0].Id)

	// Delete expense
	deleteReq := &groupv1.DeleteExpenseRequest{ExpenseId: expenseID}
	deleteResp, err := suite.client.DeleteExpense(ctx, deleteReq)
	require.NoError(suite.T(), err)
	assert.True(suite.T(), deleteResp.Success)

	// Verify expense was deleted
	expensesResp2, err := suite.client.GetGroupExpenses(ctx, expensesReq)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), expensesResp2.Expenses, 0)
}

// Test settlement calculation
func (suite *IntegrationTestSuite) TestSettlementCalculation() {
	ctx := context.Background()

	// Create group
	createReq := &groupv1.CreateGroupRequest{
		Name:        "Settlement Test Group",
		Description: "Testing settlement calculation",
		Currency:    "JPY",
		MemberNames: []string{"Alice", "Bob", "Carol"},
	}

	createResp, err := suite.client.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)
	
	members := createResp.Group.Members
	require.Len(suite.T(), members, 3)

	// Create multiple expenses with different payers
	expenses := []struct {
		amount      int64
		description string
		payerIdx    int
	}{
		{3000, "Lunch", 0}, // Alice pays
		{2000, "Coffee", 1}, // Bob pays
		{1500, "Snacks", 2}, // Carol pays
	}

	var expenseData []*groupv1.Expense
	for _, exp := range expenses {
		expenseReq := &groupv1.AddExpenseRequest{
			GroupId:        createResp.Group.Id,
			Amount:         exp.amount,
			Description:    exp.description,
			PaidById:       members[exp.payerIdx].Id,
			SplitMemberIds: []string{members[0].Id, members[1].Id, members[2].Id},
		}

		expenseResp, err := suite.client.AddExpense(ctx, expenseReq)
		require.NoError(suite.T(), err)
		
		expenseData = append(expenseData, &groupv1.Expense{
			Id:           expenseResp.Expense.Id,
			PayerId:      expenseResp.Expense.PaidById,
			Amount:       expenseResp.Expense.Amount,
			SplitBetween: []string{members[0].Id, members[1].Id, members[2].Id},
		})
	}

	// Calculate settlements
	settleReq := &groupv1.CalculateSettlementsRequest{
		GroupId:  createResp.Group.Id,
		Expenses: expenseData,
	}

	settleResp, err := suite.client.CalculateSettlements(ctx, settleReq)
	require.NoError(suite.T(), err)
	
	// Verify settlements are calculated
	assert.NotEmpty(suite.T(), settleResp.Settlements)
	assert.NotEmpty(suite.T(), settleResp.Balances)
	assert.Len(suite.T(), settleResp.Balances, 3) // One balance per member

	// Verify total balance is zero
	var totalBalance int64
	for _, balance := range settleResp.Balances {
		totalBalance += balance.Balance
	}
	assert.Equal(suite.T(), int64(0), totalBalance)
}

// Security tests - test input validation and SQL injection prevention
func (suite *IntegrationTestSuite) TestSecurityInputValidation() {
	ctx := context.Background()

	// Test malicious SQL injection attempts
	maliciousInputs := []string{
		"'; DROP TABLE groups; --",
		"<script>alert('xss')</script>",
		string(make([]byte, 10000)), // Very long string
		"",                          // Empty string
		"SELECT * FROM groups",
		"../../../etc/passwd",
		"{{constructor.constructor('return process')().exit()}}", // Template injection
	}

	for _, maliciousInput := range maliciousInputs {
		t := suite.T()
		t.Run(fmt.Sprintf("Malicious input: %s", strings.ReplaceAll(maliciousInput, "\n", "\\n")[:min(50, len(maliciousInput))]), func(t *testing.T) {
			// Test CreateGroup with malicious input
			createReq := &groupv1.CreateGroupRequest{
				Name:        maliciousInput,
				Description: maliciousInput,
				Currency:    "JPY",
				MemberNames: []string{"Test"},
			}

			// Should either succeed (input is sanitized) or fail gracefully (not crash)
			createResp, err := suite.client.CreateGroup(ctx, createReq)
			if err == nil {
				// If creation succeeded, verify the data is stored safely
				assert.NotEmpty(t, createResp.Group.Id)
				
				// Try to get the group to ensure database integrity
				getReq := &groupv1.GetGroupRequest{Id: createResp.Group.Id}
				_, err = suite.client.GetGroup(ctx, getReq)
				assert.NoError(t, err, "Database should remain consistent after malicious input")
			}
			// If error occurred, that's acceptable as input validation
		})
	}
}

// Test invalid UUIDs and edge cases
func (suite *IntegrationTestSuite) TestInvalidInputHandling() {
	ctx := context.Background()

	invalidUUIDs := []string{
		"invalid-uuid",
		"",
		"not-a-uuid-at-all",
		"12345678-1234-1234-1234-12345678901z", // Invalid character
		"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // Invalid hex characters
	}

	for _, invalidUUID := range invalidUUIDs {
		// Test GetGroup with invalid UUID
		getReq := &groupv1.GetGroupRequest{Id: invalidUUID}
		_, err := suite.client.GetGroup(ctx, getReq)
		assert.Error(suite.T(), err, "Should return error for invalid UUID: %s", invalidUUID)

		// Test DeleteGroup with invalid UUID
		deleteReq := &groupv1.DeleteGroupRequest{Id: invalidUUID}
		_, err = suite.client.DeleteGroup(ctx, deleteReq)
		assert.Error(suite.T(), err, "Should return error for invalid UUID: %s", invalidUUID)
	}

	// Test invalid amounts for expenses
	createReq := &groupv1.CreateGroupRequest{
		Name:        "Test Group",
		Description: "Test",
		Currency:    "JPY",
		MemberNames: []string{"Alice"},
	}

	createResp, err := suite.client.CreateGroup(ctx, createReq)
	require.NoError(suite.T(), err)

	invalidAmounts := []int64{-1000, 0, -1}
	for _, amount := range invalidAmounts {
		expenseReq := &groupv1.AddExpenseRequest{
			GroupId:        createResp.Group.Id,
			Amount:         amount,
			Description:    "Test",
			PaidById:       createResp.Group.Members[0].Id,
			SplitMemberIds: []string{createResp.Group.Members[0].Id},
		}

		_, err = suite.client.AddExpense(ctx, expenseReq)
		assert.Error(suite.T(), err, "Should return error for invalid amount: %d", amount)
	}
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func TestIntegrationTestSuite(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}

	suite.Run(t, new(IntegrationTestSuite))
}