package repository

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/jt-chihara/warikan/services/group/internal/domain"
)

func TestExpenseRepository_Create(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewExpenseRepository(db)

	groupID := uuid.New()
	expenseID := uuid.New()
	paidByID := uuid.New()
	member1ID := uuid.New()
	member2ID := uuid.New()
	now := time.Now()

	expense := &domain.Expense{
		ID:          expenseID,
		GroupID:     groupID,
		Amount:      3000,
		Description: "Lunch",
		Currency:    "JPY",
		PaidByID:    paidByID,
		PaidByName:  "Alice",
		SplitMembers: []domain.SplitMember{
			{
				MemberID:   member1ID,
				MemberName: "Alice",
				Amount:     1500,
			},
			{
				MemberID:   member2ID,
				MemberName: "Bob",
				Amount:     1500,
			},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	tests := []struct {
		name        string
		expense     *domain.Expense
		setupMocks  func()
		expectedErr bool
	}{
		{
			name:    "successful expense creation",
			expense: expense,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense insert
				mock.ExpectExec(`INSERT INTO expenses \(id, group_id, amount, description, currency, paid_by_id, created_at, updated_at\) VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8\)`).
					WithArgs(expenseID, groupID, int64(3000), "Lunch", "JPY", paidByID, now, now).
					WillReturnResult(sqlmock.NewResult(1, 1))

				// Expect split member inserts
				mock.ExpectExec(`INSERT INTO expense_splits \(expense_id, member_id, amount\) VALUES \(\$1, \$2, \$3\)`).
					WithArgs(expenseID, member1ID, int64(1500)).
					WillReturnResult(sqlmock.NewResult(1, 1))

				mock.ExpectExec(`INSERT INTO expense_splits \(expense_id, member_id, amount\) VALUES \(\$1, \$2, \$3\)`).
					WithArgs(expenseID, member2ID, int64(1500)).
					WillReturnResult(sqlmock.NewResult(1, 1))

				mock.ExpectCommit()
			},
			expectedErr: false,
		},
		{
			name:    "expense insert fails",
			expense: expense,
			setupMocks: func() {
				mock.ExpectBegin()
				mock.ExpectExec(`INSERT INTO expenses`).
					WithArgs(expenseID, groupID, int64(3000), "Lunch", "JPY", paidByID, now, now).
					WillReturnError(sql.ErrConnDone)
				mock.ExpectRollback()
			},
			expectedErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMocks()

			err := repo.Create(context.Background(), tt.expense)

			if tt.expectedErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestExpenseRepository_FindByGroupID(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewExpenseRepository(db)

	groupID := uuid.New()
	expenseID := uuid.New()
	paidByID := uuid.New()
	member1ID := uuid.New()
	member2ID := uuid.New()
	now := time.Now()

	tests := []struct {
		name        string
		groupID     uuid.UUID
		setupMocks  func()
		expectedErr bool
		expectedLen int
	}{
		{
			name:    "successful expenses retrieval",
			groupID: groupID,
			setupMocks: func() {
				// Mock main expense query
				expenseRows := sqlmock.NewRows([]string{
					"id", "group_id", "amount", "description", "currency", "paid_by_id", "created_at", "updated_at", "paid_by_name",
				}).AddRow(expenseID, groupID, int64(3000), "Lunch", "JPY", paidByID, now, now, "Alice")

				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.currency, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(groupID).
					WillReturnRows(expenseRows)

				// Mock split members query
				splitRows := sqlmock.NewRows([]string{"member_id", "amount", "name"}).
					AddRow(member1ID, int64(1500), "Alice").
					AddRow(member2ID, int64(1500), "Bob")

				mock.ExpectQuery(`SELECT es\.member_id, es\.amount, m\.name FROM expense_splits es JOIN members m`).
					WithArgs(expenseID).
					WillReturnRows(splitRows)
			},
			expectedErr: false,
			expectedLen: 1,
		},
		{
			name:    "no expenses found",
			groupID: groupID,
			setupMocks: func() {
				expenseRows := sqlmock.NewRows([]string{
					"id", "group_id", "amount", "description", "currency", "paid_by_id", "created_at", "updated_at", "paid_by_name",
				})

				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.currency, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(groupID).
					WillReturnRows(expenseRows)
			},
			expectedErr: false,
			expectedLen: 0,
		},
		{
			name:    "query error",
			groupID: groupID,
			setupMocks: func() {
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.currency, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(groupID).
					WillReturnError(sql.ErrConnDone)
			},
			expectedErr: true,
			expectedLen: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMocks()

			expenses, err := repo.FindByGroupID(context.Background(), tt.groupID)

			if tt.expectedErr {
				assert.Error(t, err)
				assert.Nil(t, expenses)
			} else {
				assert.NoError(t, err)
				assert.Len(t, expenses, tt.expectedLen)

				if tt.expectedLen > 0 {
					expense := expenses[0]
					assert.Equal(t, expenseID, expense.ID)
					assert.Equal(t, groupID, expense.GroupID)
					assert.Equal(t, int64(3000), expense.Amount)
					assert.Equal(t, "Lunch", expense.Description)
					assert.Equal(t, "Alice", expense.PaidByName)
					assert.Len(t, expense.SplitMembers, 2)
				}
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestExpenseRepository_FindByID(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewExpenseRepository(db)

	groupID := uuid.New()
	expenseID := uuid.New()
	paidByID := uuid.New()
	member1ID := uuid.New()
	member2ID := uuid.New()
	now := time.Now()

	tests := []struct {
		name            string
		expenseID       uuid.UUID
		setupMocks      func()
		expectedErr     bool
		expectedExpense *domain.Expense
	}{
		{
			name:      "successful expense retrieval",
			expenseID: expenseID,
			setupMocks: func() {
				// Mock main expense query
				expenseRow := sqlmock.NewRows([]string{
					"id", "group_id", "amount", "description", "currency", "paid_by_id", "created_at", "updated_at", "paid_by_name",
				}).AddRow(expenseID, groupID, int64(3000), "Lunch", "JPY", paidByID, now, now, "Alice")

				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.currency, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(expenseID).
					WillReturnRows(expenseRow)

				// Mock split members query
				splitRows := sqlmock.NewRows([]string{"member_id", "amount", "name"}).
					AddRow(member1ID, int64(1500), "Alice").
					AddRow(member2ID, int64(1500), "Bob")

				mock.ExpectQuery(`SELECT es\.member_id, es\.amount, m\.name FROM expense_splits es JOIN members m`).
					WithArgs(expenseID).
					WillReturnRows(splitRows)
			},
			expectedErr: false,
			expectedExpense: &domain.Expense{
				ID:          expenseID,
				GroupID:     groupID,
				Amount:      3000,
				Description: "Lunch",
				Currency:    "JPY",
				PaidByName:  "Alice",
			},
		},
		{
			name:      "expense not found",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.currency, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(expenseID).
					WillReturnError(sql.ErrNoRows)
			},
			expectedErr:     true,
			expectedExpense: nil,
		},
		{
			name:      "query error",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.currency, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(expenseID).
					WillReturnError(sql.ErrConnDone)
			},
			expectedErr:     true,
			expectedExpense: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMocks()

			expense, err := repo.FindByID(context.Background(), tt.expenseID)

			if tt.expectedErr {
				assert.Error(t, err)
				assert.Nil(t, expense)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, expense)
				assert.Equal(t, tt.expectedExpense.ID, expense.ID)
				assert.Equal(t, tt.expectedExpense.GroupID, expense.GroupID)
				assert.Equal(t, tt.expectedExpense.Amount, expense.Amount)
				assert.Equal(t, tt.expectedExpense.Description, expense.Description)
				assert.Equal(t, tt.expectedExpense.PaidByName, expense.PaidByName)
				assert.Len(t, expense.SplitMembers, 2)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestExpenseRepository_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewExpenseRepository(db)
	expenseID := uuid.New()

	tests := []struct {
		name        string
		expenseID   uuid.UUID
		setupMocks  func()
		expectedErr bool
	}{
		{
			name:      "successful expense deletion",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense splits deletion
				mock.ExpectExec(`DELETE FROM expense_splits WHERE expense_id = \$1`).
					WithArgs(expenseID).
					WillReturnResult(sqlmock.NewResult(0, 2))

				// Expect expense deletion
				mock.ExpectExec(`DELETE FROM expenses WHERE id = \$1`).
					WithArgs(expenseID).
					WillReturnResult(sqlmock.NewResult(0, 1))

				mock.ExpectCommit()
			},
			expectedErr: false,
		},
		{
			name:      "expense not found",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense splits deletion (might return 0 rows)
				mock.ExpectExec(`DELETE FROM expense_splits WHERE expense_id = \$1`).
					WithArgs(expenseID).
					WillReturnResult(sqlmock.NewResult(0, 0))

				// Expect expense deletion with 0 rows affected
				mock.ExpectExec(`DELETE FROM expenses WHERE id = \$1`).
					WithArgs(expenseID).
					WillReturnResult(sqlmock.NewResult(0, 0))

				mock.ExpectRollback()
			},
			expectedErr: true,
		},
		{
			name:      "splits deletion fails",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectBegin()

				mock.ExpectExec(`DELETE FROM expense_splits WHERE expense_id = \$1`).
					WithArgs(expenseID).
					WillReturnError(sql.ErrConnDone)

				mock.ExpectRollback()
			},
			expectedErr: true,
		},
		{
			name:      "expense deletion fails",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense splits deletion succeeds
				mock.ExpectExec(`DELETE FROM expense_splits WHERE expense_id = \$1`).
					WithArgs(expenseID).
					WillReturnResult(sqlmock.NewResult(0, 2))

				// Expect expense deletion fails
				mock.ExpectExec(`DELETE FROM expenses WHERE id = \$1`).
					WithArgs(expenseID).
					WillReturnError(sql.ErrConnDone)

				mock.ExpectRollback()
			},
			expectedErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMocks()

			err := repo.Delete(context.Background(), tt.expenseID)

			if tt.expectedErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestExpenseRepository_Update(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewExpenseRepository(db)

	groupID := uuid.New()
	expenseID := uuid.New()
	paidByID := uuid.New()
	member1ID := uuid.New()
	member2ID := uuid.New()
	now := time.Now()

	expense := &domain.Expense{
		ID:          expenseID,
		GroupID:     groupID,
		Amount:      4000, // Updated amount
		Description: "Updated Lunch", // Updated description
		Currency:    "JPY",
		PaidByID:    paidByID,
		PaidByName:  "Alice",
		SplitMembers: []domain.SplitMember{
			{
				MemberID:   member1ID,
				MemberName: "Alice",
				Amount:     2000, // Updated split
			},
			{
				MemberID:   member2ID,
				MemberName: "Bob",
				Amount:     2000, // Updated split
			},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	tests := []struct {
		name        string
		expense     *domain.Expense
		setupMocks  func()
		expectedErr bool
	}{
		{
			name:    "successful expense update",
			expense: expense,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense update
				mock.ExpectExec(`UPDATE expenses SET amount = \$2, description = \$3, paid_by_id = \$4, updated_at = \$5 WHERE id = \$1`).
					WithArgs(expenseID, int64(4000), "Updated Lunch", paidByID, now).
					WillReturnResult(sqlmock.NewResult(0, 1))

				// Expect deletion of existing splits
				mock.ExpectExec(`DELETE FROM expense_splits WHERE expense_id = \$1`).
					WithArgs(expenseID).
					WillReturnResult(sqlmock.NewResult(0, 2))

				// Expect insertion of new splits
				mock.ExpectExec(`INSERT INTO expense_splits \(expense_id, member_id, amount\) VALUES \(\$1, \$2, \$3\)`).
					WithArgs(expenseID, member1ID, int64(2000)).
					WillReturnResult(sqlmock.NewResult(1, 1))

				mock.ExpectExec(`INSERT INTO expense_splits \(expense_id, member_id, amount\) VALUES \(\$1, \$2, \$3\)`).
					WithArgs(expenseID, member2ID, int64(2000)).
					WillReturnResult(sqlmock.NewResult(2, 1))

				mock.ExpectCommit()
			},
			expectedErr: false,
		},
		{
			name:    "expense not found",
			expense: expense,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense update with 0 rows affected
				mock.ExpectExec(`UPDATE expenses SET amount = \$2, description = \$3, paid_by_id = \$4, updated_at = \$5 WHERE id = \$1`).
					WithArgs(expenseID, int64(4000), "Updated Lunch", paidByID, now).
					WillReturnResult(sqlmock.NewResult(0, 0))

				mock.ExpectRollback()
			},
			expectedErr: true,
		},
		{
			name:    "expense update fails",
			expense: expense,
			setupMocks: func() {
				mock.ExpectBegin()

				mock.ExpectExec(`UPDATE expenses SET amount = \$2, description = \$3, paid_by_id = \$4, updated_at = \$5 WHERE id = \$1`).
					WithArgs(expenseID, int64(4000), "Updated Lunch", paidByID, now).
					WillReturnError(sql.ErrConnDone)

				mock.ExpectRollback()
			},
			expectedErr: true,
		},
		{
			name:    "splits deletion fails",
			expense: expense,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense update succeeds
				mock.ExpectExec(`UPDATE expenses SET amount = \$2, description = \$3, paid_by_id = \$4, updated_at = \$5 WHERE id = \$1`).
					WithArgs(expenseID, int64(4000), "Updated Lunch", paidByID, now).
					WillReturnResult(sqlmock.NewResult(0, 1))

				// Expect deletion of existing splits fails
				mock.ExpectExec(`DELETE FROM expense_splits WHERE expense_id = \$1`).
					WithArgs(expenseID).
					WillReturnError(sql.ErrConnDone)

				mock.ExpectRollback()
			},
			expectedErr: true,
		},
		{
			name:    "split insertion fails",
			expense: expense,
			setupMocks: func() {
				mock.ExpectBegin()

				// Expect expense update succeeds
				mock.ExpectExec(`UPDATE expenses SET amount = \$2, description = \$3, paid_by_id = \$4, updated_at = \$5 WHERE id = \$1`).
					WithArgs(expenseID, int64(4000), "Updated Lunch", paidByID, now).
					WillReturnResult(sqlmock.NewResult(0, 1))

				// Expect deletion of existing splits succeeds
				mock.ExpectExec(`DELETE FROM expense_splits WHERE expense_id = \$1`).
					WithArgs(expenseID).
					WillReturnResult(sqlmock.NewResult(0, 2))

				// Expect first split insertion fails
				mock.ExpectExec(`INSERT INTO expense_splits \(expense_id, member_id, amount\) VALUES \(\$1, \$2, \$3\)`).
					WithArgs(expenseID, member1ID, int64(2000)).
					WillReturnError(sql.ErrConnDone)

				mock.ExpectRollback()
			},
			expectedErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMocks()

			err := repo.Update(context.Background(), tt.expense)

			if tt.expectedErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}
