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
				mock.ExpectExec(`INSERT INTO expenses \(id, group_id, amount, description, paid_by_id, created_at, updated_at\) VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7\)`).
					WithArgs(expenseID, groupID, int64(3000), "Lunch", paidByID, now, now).
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
					WithArgs(expenseID, groupID, int64(3000), "Lunch", paidByID, now, now).
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
					"id", "group_id", "amount", "description", "paid_by_id", "created_at", "updated_at", "paid_by_name",
				}).AddRow(expenseID, groupID, int64(3000), "Lunch", paidByID, now, now, "Alice")
				
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
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
					"id", "group_id", "amount", "description", "paid_by_id", "created_at", "updated_at", "paid_by_name",
				})
				
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
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
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
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
		name        string
		expenseID   uuid.UUID
		setupMocks  func()
		expectedErr bool
		expectedExpense *domain.Expense
	}{
		{
			name:      "successful expense retrieval",
			expenseID: expenseID,
			setupMocks: func() {
				// Mock main expense query
				expenseRow := sqlmock.NewRows([]string{
					"id", "group_id", "amount", "description", "paid_by_id", "created_at", "updated_at", "paid_by_name",
				}).AddRow(expenseID, groupID, int64(3000), "Lunch", paidByID, now, now, "Alice")
				
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
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
				PaidByName:  "Alice",
			},
		},
		{
			name:      "expense not found",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(expenseID).
					WillReturnError(sql.ErrNoRows)
			},
			expectedErr: true,
			expectedExpense: nil,
		},
		{
			name:      "query error",
			expenseID: expenseID,
			setupMocks: func() {
				mock.ExpectQuery(`SELECT e\.id, e\.group_id, e\.amount, e\.description, e\.paid_by_id, e\.created_at, e\.updated_at, m\.name as paid_by_name FROM expenses e JOIN members m`).
					WithArgs(expenseID).
					WillReturnError(sql.ErrConnDone)
			},
			expectedErr: true,
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