package repository

import (
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGroupRepository_CreateGroup(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewGroupRepository(db)

	// Test data
	name := "Test Group"
	description := "Test Description"
	currency := "JPY"
	memberNames := []string{"Alice", "Bob"}

	// Mock expectations
	mock.ExpectBegin()

	// Mock group insertion
	mock.ExpectExec(`INSERT INTO groups`).
		WithArgs(sqlmock.AnyArg(), name, description, currency, sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock member insertions
	mock.ExpectExec(`INSERT INTO members`).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), "Alice", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	mock.ExpectExec(`INSERT INTO members`).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), "Bob", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	mock.ExpectCommit()

	// Execute
	group, err := repo.CreateGroup(name, description, currency, memberNames)

	// Assertions
	require.NoError(t, err)
	assert.Equal(t, name, group.Name)
	assert.Equal(t, description, group.Description)
	assert.Equal(t, currency, group.Currency)
	assert.Len(t, group.Members, 2)
	assert.Equal(t, "Alice", group.Members[0].Name)
	assert.Equal(t, "Bob", group.Members[1].Name)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGroupRepository_CreateGroup_WithEmptyMembers(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewGroupRepository(db)

	// Test data with empty member names
	name := "Test Group"
	description := "Test Description"
	currency := "USD"
	memberNames := []string{"Alice", "", "Bob", ""}

	// Mock expectations
	mock.ExpectBegin()

	// Mock group insertion
	mock.ExpectExec(`INSERT INTO groups`).
		WithArgs(sqlmock.AnyArg(), name, description, currency, sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Only expect insertions for non-empty names
	mock.ExpectExec(`INSERT INTO members`).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), "Alice", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	mock.ExpectExec(`INSERT INTO members`).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), "Bob", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	mock.ExpectCommit()

	// Execute
	group, err := repo.CreateGroup(name, description, currency, memberNames)

	// Assertions
	require.NoError(t, err)
	assert.Len(t, group.Members, 2) // Only non-empty names should be added
	assert.Equal(t, "Alice", group.Members[0].Name)
	assert.Equal(t, "Bob", group.Members[1].Name)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGroupRepository_GetGroupByID(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewGroupRepository(db)

	// Test data
	groupID := uuid.New().String()
	name := "Test Group"
	description := "Test Description"
	currency := "JPY"
	createdAt := time.Now()
	updatedAt := time.Now()

	// Mock group query
	groupRows := sqlmock.NewRows([]string{"id", "name", "description", "currency", "created_at", "updated_at"}).
		AddRow(groupID, name, description, currency, createdAt, updatedAt)

	mock.ExpectQuery(`SELECT id, name, description, currency, created_at, updated_at FROM groups WHERE id = \$1`).
		WithArgs(groupID).
		WillReturnRows(groupRows)

	// Mock members query
	memberRows := sqlmock.NewRows([]string{"id", "name", "email", "joined_at"}).
		AddRow(uuid.New().String(), "Alice", sql.NullString{String: "alice@example.com", Valid: true}, createdAt).
		AddRow(uuid.New().String(), "Bob", sql.NullString{Valid: false}, createdAt)

	mock.ExpectQuery(`SELECT id, name, email, joined_at FROM members WHERE group_id = \$1 ORDER BY joined_at ASC`).
		WithArgs(groupID).
		WillReturnRows(memberRows)

	// Execute
	group, err := repo.GetGroupByID(groupID)

	// Assertions
	require.NoError(t, err)
	assert.Equal(t, groupID, group.Id)
	assert.Equal(t, name, group.Name)
	assert.Equal(t, description, group.Description)
	assert.Equal(t, currency, group.Currency)
	assert.Len(t, group.Members, 2)
	assert.Equal(t, "Alice", group.Members[0].Name)
	assert.Equal(t, "alice@example.com", group.Members[0].Email)
	assert.Equal(t, "Bob", group.Members[1].Name)
	assert.Equal(t, "", group.Members[1].Email) // Empty email for Bob

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGroupRepository_UpdateGroup(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewGroupRepository(db)

	// Test data
	groupID := uuid.New().String()
	name := "Updated Group"
	description := "Updated Description"
	currency := "USD"

	// Mock update query
	mock.ExpectExec(`UPDATE groups SET name = \$1, description = \$2, currency = \$3, updated_at = \$4 WHERE id = \$5`).
		WithArgs(name, description, currency, sqlmock.AnyArg(), groupID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock the GetGroupByID call that follows the update
	groupRows := sqlmock.NewRows([]string{"id", "name", "description", "currency", "created_at", "updated_at"}).
		AddRow(groupID, name, description, currency, time.Now(), time.Now())

	mock.ExpectQuery(`SELECT id, name, description, currency, created_at, updated_at FROM groups WHERE id = \$1`).
		WithArgs(groupID).
		WillReturnRows(groupRows)

	memberRows := sqlmock.NewRows([]string{"id", "name", "email", "joined_at"})

	mock.ExpectQuery(`SELECT id, name, email, joined_at FROM members WHERE group_id = \$1 ORDER BY joined_at ASC`).
		WithArgs(groupID).
		WillReturnRows(memberRows)

	// Execute
	group, err := repo.UpdateGroup(groupID, name, description, currency)

	// Assertions
	require.NoError(t, err)
	assert.Equal(t, groupID, group.Id)
	assert.Equal(t, name, group.Name)
	assert.Equal(t, description, group.Description)
	assert.Equal(t, currency, group.Currency)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGroupRepository_DeleteGroup(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewGroupRepository(db)

	// Test data
	groupID := uuid.New().String()

	// Mock delete query
	mock.ExpectExec(`DELETE FROM groups WHERE id = \$1`).
		WithArgs(groupID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Execute
	err = repo.DeleteGroup(groupID)

	// Assertions
	require.NoError(t, err)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGroupRepository_AddMember(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewGroupRepository(db)

	// Test data
	groupID := uuid.New().String()
	memberName := "Charlie"
	memberEmail := "charlie@example.com"

	// Mock member insertion
	mock.ExpectExec(`INSERT INTO members`).
		WithArgs(sqlmock.AnyArg(), groupID, memberName, memberEmail, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Execute
	member, err := repo.AddMember(groupID, memberName, memberEmail)

	// Assertions
	require.NoError(t, err)
	assert.Equal(t, memberName, member.Name)
	assert.Equal(t, memberEmail, member.Email)
	assert.NotEmpty(t, member.Id)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGroupRepository_RemoveMember(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewGroupRepository(db)

	// Test data
	groupID := uuid.New().String()
	memberID := uuid.New().String()

	// Mock member deletion
	mock.ExpectExec(`DELETE FROM members WHERE id = \$1 AND group_id = \$2`).
		WithArgs(memberID, groupID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Execute
	err = repo.RemoveMember(groupID, memberID)

	// Assertions
	require.NoError(t, err)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}
