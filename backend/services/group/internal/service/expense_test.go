package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/jt-chihara/warikan/services/group/internal/domain"
	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

// MockExpenseRepository is a mock implementation of ExpenseRepository
type MockExpenseRepository struct {
	mock.Mock
}

func (m *MockExpenseRepository) Create(ctx context.Context, expense *domain.Expense) error {
	args := m.Called(ctx, expense)
	return args.Error(0)
}

func (m *MockExpenseRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Expense, error) {
	args := m.Called(ctx, groupID)
	return args.Get(0).([]*domain.Expense), args.Error(1)
}

func (m *MockExpenseRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Expense, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*domain.Expense), args.Error(1)
}

// MockGroupRepositoryInterface for testing
type MockGroupRepositoryInterface struct {
	mock.Mock
}

func (m *MockGroupRepositoryInterface) CreateGroup(name, description, currency string, memberNames []string) (*groupv1.Group, error) {
	args := m.Called(name, description, currency, memberNames)
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepositoryInterface) GetGroupByID(id string) (*groupv1.Group, error) {
	args := m.Called(id)
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepositoryInterface) UpdateGroup(id, name, description, currency string) (*groupv1.Group, error) {
	args := m.Called(id, name, description, currency)
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepositoryInterface) DeleteGroup(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockGroupRepositoryInterface) AddMember(groupId, memberName, memberEmail string) (*groupv1.Member, error) {
	args := m.Called(groupId, memberName, memberEmail)
	return args.Get(0).(*groupv1.Member), args.Error(1)
}

func (m *MockGroupRepositoryInterface) RemoveMember(groupId, memberId string) error {
	args := m.Called(groupId, memberId)
	return args.Error(0)
}

func TestGroupService_AddExpense(t *testing.T) {
	tests := []struct {
		name           string
		request        *groupv1.AddExpenseRequest
		mockGroup      *groupv1.Group
		mockError      error
		expectedError  string
		setupMocks     func(*MockGroupRepositoryInterface, *MockExpenseRepository)
	}{
		{
			name: "successful expense addition",
			request: &groupv1.AddExpenseRequest{
				GroupId:         "group-123",
				Amount:          3000,
				Description:     "lunch",
				PaidById:        "member-1",
				SplitMemberIds:  []string{"member-1", "member-2", "member-3"},
			},
			mockGroup: &groupv1.Group{
				Id:   "group-123",
				Name: "Test Group",
				Members: []*groupv1.Member{
					{Id: "member-1", Name: "Alice"},
					{Id: "member-2", Name: "Bob"},
					{Id: "member-3", Name: "Carol"},
				},
			},
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				groupRepo.On("GetGroupByID", "group-123").Return(&groupv1.Group{
					Id:   "group-123",
					Name: "Test Group",
					Members: []*groupv1.Member{
						{Id: "member-1", Name: "Alice"},
						{Id: "member-2", Name: "Bob"},
						{Id: "member-3", Name: "Carol"},
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
				GroupId:         "",
				Amount:          1000,
				Description:     "test",
				PaidById:        "member-1",
				SplitMemberIds:  []string{"member-1"},
			},
			expectedError: "group ID is required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "amount must be positive",
			request: &groupv1.AddExpenseRequest{
				GroupId:         "group-123",
				Amount:          0,
				Description:     "test",
				PaidById:        "member-1",
				SplitMemberIds:  []string{"member-1"},
			},
			expectedError: "amount must be positive",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "description required",
			request: &groupv1.AddExpenseRequest{
				GroupId:         "group-123",
				Amount:          1000,
				Description:     "",
				PaidById:        "member-1",
				SplitMemberIds:  []string{"member-1"},
			},
			expectedError: "description is required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "paid by ID required",
			request: &groupv1.AddExpenseRequest{
				GroupId:         "group-123",
				Amount:          1000,
				Description:     "test",
				PaidById:        "",
				SplitMemberIds:  []string{"member-1"},
			},
			expectedError: "paid by ID is required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "split members required",
			request: &groupv1.AddExpenseRequest{
				GroupId:         "group-123",
				Amount:          1000,
				Description:     "test",
				PaidById:        "member-1",
				SplitMemberIds:  []string{},
			},
			expectedError: "split members are required",
			setupMocks: func(groupRepo *MockGroupRepositoryInterface, expenseRepo *MockExpenseRepository) {
				// No mocks needed for validation errors
			},
		},
		{
			name: "invalid group ID format",
			request: &groupv1.AddExpenseRequest{
				GroupId:         "invalid-uuid",
				Amount:          1000,
				Description:     "test",
				PaidById:        "member-1",
				SplitMemberIds:  []string{"member-1"},
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