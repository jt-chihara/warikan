package service

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
	"github.com/jt-chihara/warikan/services/group/internal/domain"
)

func TestGroupService_AddExpense(t *testing.T) {
	tests := []struct {
		name          string
		request       *groupv1.AddExpenseRequest
		mockGroup     *groupv1.Group
		mockError     error
		expectedError string
		setupMocks    func(*MockGroupRepositoryInterface, *MockExpenseRepository)
	}{
		{
			name: "successful expense addition",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "550e8400-e29b-41d4-a716-446655440000",
				Amount:         3000,
				Description:    "lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440001",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002", "550e8400-e29b-41d4-a716-446655440003"},
			},
			mockGroup: &groupv1.Group{
				Id:       "550e8400-e29b-41d4-a716-446655440000",
				Name:     "Test Group",
				Currency: "JPY",
				Members: []*groupv1.Member{
					{Id: "550e8400-e29b-41d4-a716-446655440001", Name: "Alice"},
					{Id: "550e8400-e29b-41d4-a716-446655440002", Name: "Bob"},
					{Id: "550e8400-e29b-41d4-a716-446655440003", Name: "Carol"},
				},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				groupRepo.On("GetGroupByID", "550e8400-e29b-41d4-a716-446655440000").Return(&groupv1.Group{
					Id:       "550e8400-e29b-41d4-a716-446655440000",
					Name:     "Test Group",
					Currency: "JPY",
					Members: []*groupv1.Member{
						{Id: "550e8400-e29b-41d4-a716-446655440001", Name: "Alice"},
						{Id: "550e8400-e29b-41d4-a716-446655440002", Name: "Bob"},
						{Id: "550e8400-e29b-41d4-a716-446655440003", Name: "Carol"},
					},
				}, nil)

				expenseRepo.On("Create", mock.Anything, mock.MatchedBy(func(expense *domain.Expense) bool {
					return expense.GroupID.String() != "" &&
						expense.Amount == 3000 &&
						expense.Description == "lunch" &&
						expense.PaidByID.String() != "" &&
						expense.PaidByName == "Alice" &&
						len(expense.SplitMembers) == 3
				})).Return(nil)
			},
		},
		{
			name: "group ID required",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "",
				Amount:         1000,
				Description:    "test",
				PaidById:       "550e8400-e29b-41d4-a716-446655440001",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440001"},
			},
			expectedError: "group ID is required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "amount must be positive",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "550e8400-e29b-41d4-a716-446655440000",
				Amount:         0,
				Description:    "test",
				PaidById:       "550e8400-e29b-41d4-a716-446655440001",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440001"},
			},
			expectedError: "amount must be positive",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "description required",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "550e8400-e29b-41d4-a716-446655440000",
				Amount:         1000,
				Description:    "",
				PaidById:       "550e8400-e29b-41d4-a716-446655440001",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440001"},
			},
			expectedError: "description is required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "paid by ID required",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "550e8400-e29b-41d4-a716-446655440000",
				Amount:         1000,
				Description:    "test",
				PaidById:       "",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440001"},
			},
			expectedError: "paid by ID is required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "split members required",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "550e8400-e29b-41d4-a716-446655440000",
				Amount:         1000,
				Description:    "test",
				PaidById:       "550e8400-e29b-41d4-a716-446655440001",
				SplitMemberIds: []string{},
			},
			expectedError: "split members are required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "invalid group ID format",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "invalid-uuid",
				Amount:         1000,
				Description:    "test",
				PaidById:       "550e8400-e29b-41d4-a716-446655440001",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440001"},
			},
			expectedError: "invalid group ID",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockGroupRepo := new(MockGroupRepositoryInterface)
			mockExpenseRepo := new(MockExpenseRepository)

			tt.setupMocks(mockGroupRepo, mockExpenseRepo)

			service := NewGroupService(mockGroupRepo, mockExpenseRepo)

			resp, err := service.AddExpense(context.Background(), tt.request)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotNil(t, resp.Expense)
				assert.Equal(t, tt.request.Amount, resp.Expense.Amount)
				assert.Equal(t, tt.request.Description, resp.Expense.Description)
				assert.Equal(t, len(tt.request.SplitMemberIds), len(resp.Expense.SplitMembers))
			}

			mockGroupRepo.AssertExpectations(t)
			mockExpenseRepo.AssertExpectations(t)
		})
	}
}

func TestGroupService_GetGroupExpenses(t *testing.T) {
	tests := []struct {
		name          string
		request       *groupv1.GetGroupExpensesRequest
		mockExpenses  []*domain.Expense
		expectedError string
		setupMocks    func(*MockExpenseRepository)
	}{
		{
			name: "successful expenses retrieval",
			request: &groupv1.GetGroupExpensesRequest{
				GroupId: "550e8400-e29b-41d4-a716-446655440000",
			},
			mockExpenses: []*domain.Expense{
				{
					ID:          uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
					GroupID:     uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
					Amount:      3000,
					Description: "Lunch",
					PaidByID:    uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
					PaidByName:  "Alice",
					SplitMembers: []domain.SplitMember{
						{
							MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
							MemberName: "Alice",
							Amount:     1000,
						},
						{
							MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440003"),
							MemberName: "Bob",
							Amount:     1000,
						},
						{
							MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440004"),
							MemberName: "Carol",
							Amount:     1000,
						},
					},
					CreatedAt: time.Now(),
				},
			},
			setupMocks: func(expenseRepo *MockExpenseRepository) {
				expenseRepo.On("FindByGroupID", mock.Anything, uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")).Return([]*domain.Expense{
					{
						ID:          uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
						GroupID:     uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
						Amount:      3000,
						Description: "Lunch",
						PaidByID:    uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
						PaidByName:  "Alice",
						SplitMembers: []domain.SplitMember{
							{
								MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
								MemberName: "Alice",
								Amount:     1000,
							},
							{
								MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440003"),
								MemberName: "Bob",
								Amount:     1000,
							},
							{
								MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440004"),
								MemberName: "Carol",
								Amount:     1000,
							},
						},
						CreatedAt: time.Now(),
					},
				}, nil)
			},
		},
		{
			name: "group ID required",
			request: &groupv1.GetGroupExpensesRequest{
				GroupId: "",
			},
			expectedError: "group ID is required",
			setupMocks: func(expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "invalid group ID format",
			request: &groupv1.GetGroupExpensesRequest{
				GroupId: "invalid-uuid",
			},
			expectedError: "invalid group ID",
			setupMocks: func(expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockGroupRepo := new(MockGroupRepositoryInterface)
			mockExpenseRepo := new(MockExpenseRepository)

			tt.setupMocks(mockExpenseRepo)

			service := NewGroupService(mockGroupRepo, mockExpenseRepo)

			resp, err := service.GetGroupExpenses(context.Background(), tt.request)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.Equal(t, len(tt.mockExpenses), len(resp.Expenses))

				if len(resp.Expenses) > 0 {
					expense := resp.Expenses[0]
					mockExpense := tt.mockExpenses[0]

					assert.Equal(t, mockExpense.ID.String(), expense.Id)
					assert.Equal(t, mockExpense.GroupID.String(), expense.GroupId)
					assert.Equal(t, mockExpense.Amount, expense.Amount)
					assert.Equal(t, mockExpense.Description, expense.Description)
					assert.Equal(t, mockExpense.PaidByName, expense.PaidByName)
					assert.Equal(t, len(mockExpense.SplitMembers), len(expense.SplitMembers))
				}
			}

			mockExpenseRepo.AssertExpectations(t)
		})
	}
}

func TestGroupService_UpdateExpense(t *testing.T) {
	tests := []struct {
		name          string
		request       *groupv1.UpdateExpenseRequest
		setupMocks    func(*MockGroupRepositoryInterface, *MockExpenseRepository)
		expectedError string
	}{
		{
			name: "successful expense update",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002", "550e8400-e29b-41d4-a716-446655440003"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				existingExpense := &domain.Expense{
					ID:          uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
					GroupID:     uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
					Amount:      3000,
					Description: "Lunch",
					PaidByID:    uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
				}
				expenseRepo.On("FindByID", mock.Anything, uuid.MustParse("550e8400-e29b-41d4-a716-446655440001")).Return(existingExpense, nil)

				mockGroup := &groupv1.Group{
					Id:       "550e8400-e29b-41d4-a716-446655440000",
					Name:     "Test Group",
					Currency: "JPY",
					Members: []*groupv1.Member{
						{Id: "550e8400-e29b-41d4-a716-446655440002", Name: "Alice"},
						{Id: "550e8400-e29b-41d4-a716-446655440003", Name: "Bob"},
					},
				}
				groupRepo.On("GetGroupByID", "550e8400-e29b-41d4-a716-446655440000").Return(mockGroup, nil)

				expenseRepo.On("Update", mock.Anything, mock.MatchedBy(func(expense *domain.Expense) bool {
					return expense.ID.String() == "550e8400-e29b-41d4-a716-446655440001" &&
						expense.Amount == 4000 &&
						expense.Description == "Updated Lunch" &&
						expense.PaidByID.String() == "550e8400-e29b-41d4-a716-446655440002" &&
						len(expense.SplitMembers) == 2
				})).Return(nil)

				updatedExpense := &domain.Expense{
					ID:          uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
					GroupID:     uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
					Amount:      4000,
					Description: "Updated Lunch",
					PaidByID:    uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
					PaidByName:  "Alice",
					SplitMembers: []domain.SplitMember{
						{
							MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440002"),
							MemberName: "Alice",
							Amount:     2000,
						},
						{
							MemberID:   uuid.MustParse("550e8400-e29b-41d4-a716-446655440003"),
							MemberName: "Bob",
							Amount:     2000,
						},
					},
				}
				expenseRepo.On("FindByID", mock.Anything, uuid.MustParse("550e8400-e29b-41d4-a716-446655440001")).Return(updatedExpense, nil)
			},
			expectedError: "",
		},
		{
			name: "expense ID required",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
			expectedError: "expense ID is required",
		},
		{
			name: "amount must be positive",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         0,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
			expectedError: "amount must be positive",
		},
		{
			name: "description required",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         4000,
				Description:    "",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
			expectedError: "description is required",
		},
		{
			name: "paid by ID required",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
			expectedError: "paid by ID is required",
		},
		{
			name: "split members required",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
			expectedError: "split members are required",
		},
		{
			name: "invalid expense ID format",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "invalid-uuid",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
			expectedError: "invalid expense ID",
		},
		{
			name: "expense not found",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				expenseRepo.On("FindByID", mock.Anything, uuid.MustParse("550e8400-e29b-41d4-a716-446655440001")).Return(nil, sql.ErrNoRows)
			},
			expectedError: "sql: no rows in result set",
		},
		{
			name: "invalid paid by member",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440999", // Invalid member ID
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002"},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				existingExpense := &domain.Expense{
					ID:      uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
					GroupID: uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
				}
				expenseRepo.On("FindByID", mock.Anything, uuid.MustParse("550e8400-e29b-41d4-a716-446655440001")).Return(existingExpense, nil)

				mockGroup := &groupv1.Group{
					Id:       "550e8400-e29b-41d4-a716-446655440000",
					Name:     "Test Group",
					Currency: "JPY",
					Members: []*groupv1.Member{
						{Id: "550e8400-e29b-41d4-a716-446655440002", Name: "Alice"},
						{Id: "550e8400-e29b-41d4-a716-446655440003", Name: "Bob"},
					},
				}
				groupRepo.On("GetGroupByID", "550e8400-e29b-41d4-a716-446655440000").Return(mockGroup, nil)
			},
			expectedError: "paid by member not found in group",
		},
		{
			name: "invalid split member",
			request: &groupv1.UpdateExpenseRequest{
				ExpenseId:      "550e8400-e29b-41d4-a716-446655440001",
				Amount:         4000,
				Description:    "Updated Lunch",
				PaidById:       "550e8400-e29b-41d4-a716-446655440002",
				SplitMemberIds: []string{"550e8400-e29b-41d4-a716-446655440002", "550e8400-e29b-41d4-a716-446655440999"}, // Invalid member ID
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				existingExpense := &domain.Expense{
					ID:      uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
					GroupID: uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
				}
				expenseRepo.On("FindByID", mock.Anything, uuid.MustParse("550e8400-e29b-41d4-a716-446655440001")).Return(existingExpense, nil)

				mockGroup := &groupv1.Group{
					Id:       "550e8400-e29b-41d4-a716-446655440000",
					Name:     "Test Group",
					Currency: "JPY",
					Members: []*groupv1.Member{
						{Id: "550e8400-e29b-41d4-a716-446655440002", Name: "Alice"},
						{Id: "550e8400-e29b-41d4-a716-446655440003", Name: "Bob"},
					},
				}
				groupRepo.On("GetGroupByID", "550e8400-e29b-41d4-a716-446655440000").Return(mockGroup, nil)
			},
			expectedError: "split member not found in group",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockGroupRepo := new(MockGroupRepositoryInterface)
			mockExpenseRepo := new(MockExpenseRepository)

			tt.setupMocks(mockGroupRepo, mockExpenseRepo)

			service := NewGroupService(mockGroupRepo, mockExpenseRepo)

			resp, err := service.UpdateExpense(context.Background(), tt.request)

			if tt.expectedError != "" {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotNil(t, resp.Expense)
				assert.Equal(t, tt.request.Amount, resp.Expense.Amount)
				assert.Equal(t, tt.request.Description, resp.Expense.Description)
				assert.Equal(t, len(tt.request.SplitMemberIds), len(resp.Expense.SplitMembers))
			}

			mockGroupRepo.AssertExpectations(t)
			mockExpenseRepo.AssertExpectations(t)
		})
	}
}
