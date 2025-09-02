package handler

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/protobuf/types/known/timestamppb"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

// MockGroupServiceInterface is a mock implementation for testing handlers
type MockGroupServiceInterface struct {
	mock.Mock
}

// Implement all GroupServiceInterface methods
func (m *MockGroupServiceInterface) CreateGroup(ctx context.Context, req *groupv1.CreateGroupRequest) (*groupv1.CreateGroupResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*groupv1.CreateGroupResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) GetGroup(ctx context.Context, req *groupv1.GetGroupRequest) (*groupv1.GetGroupResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*groupv1.GetGroupResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) UpdateGroup(ctx context.Context, req *groupv1.UpdateGroupRequest) (*groupv1.UpdateGroupResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*groupv1.UpdateGroupResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) DeleteGroup(ctx context.Context, req *groupv1.DeleteGroupRequest) (*groupv1.DeleteGroupResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*groupv1.DeleteGroupResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) AddMember(ctx context.Context, req *groupv1.AddMemberRequest) (*groupv1.AddMemberResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*groupv1.AddMemberResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) RemoveMember(ctx context.Context, req *groupv1.RemoveMemberRequest) (*groupv1.RemoveMemberResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*groupv1.RemoveMemberResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) CalculateSettlements(ctx context.Context, req *groupv1.CalculateSettlementsRequest) (*groupv1.CalculateSettlementsResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*groupv1.CalculateSettlementsResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) AddExpense(ctx context.Context, req *groupv1.AddExpenseRequest) (*groupv1.AddExpenseResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.AddExpenseResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) GetGroupExpenses(ctx context.Context, req *groupv1.GetGroupExpensesRequest) (*groupv1.GetGroupExpensesResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.GetGroupExpensesResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) DeleteExpense(ctx context.Context, req *groupv1.DeleteExpenseRequest) (*groupv1.DeleteExpenseResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.DeleteExpenseResponse), args.Error(1)
}

func (m *MockGroupServiceInterface) UpdateExpense(ctx context.Context, req *groupv1.UpdateExpenseRequest) (*groupv1.UpdateExpenseResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.UpdateExpenseResponse), args.Error(1)
}

func TestGroupHandler_AddExpense(t *testing.T) {
	tests := []struct {
		name          string
		request       *groupv1.AddExpenseRequest
		mockResponse  *groupv1.AddExpenseResponse
		mockError     error
		expectedError bool
		setupMocks    func(*MockGroupServiceInterface)
	}{
		{
			name: "successful expense addition",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "group-123",
				Amount:         3000,
				Description:    "Lunch",
				PaidById:       "member-1",
				SplitMemberIds: []string{"member-1", "member-2", "member-3"},
			},
			mockResponse: &groupv1.AddExpenseResponse{
				Expense: &groupv1.ExpenseWithDetails{
					Id:          "expense-123",
					GroupId:     "group-123",
					Amount:      3000,
					Description: "Lunch",
					PaidById:    "member-1",
					PaidByName:  "Alice",
					SplitMembers: []*groupv1.SplitMember{
						{
							MemberId:   "member-1",
							MemberName: "Alice",
							Amount:     1000,
						},
						{
							MemberId:   "member-2",
							MemberName: "Bob",
							Amount:     1000,
						},
						{
							MemberId:   "member-3",
							MemberName: "Carol",
							Amount:     1000,
						},
					},
					CreatedAt: timestamppb.Now(),
				},
			},
			mockError:     nil,
			expectedError: false,
			setupMocks: func(mockService *MockGroupServiceInterface) {
				mockService.On("AddExpense", mock.Anything, mock.MatchedBy(func(req *groupv1.AddExpenseRequest) bool {
					return req.GroupId == "group-123" &&
						req.Amount == 3000 &&
						req.Description == "Lunch" &&
						req.PaidById == "member-1" &&
						len(req.SplitMemberIds) == 3
				})).Return(&groupv1.AddExpenseResponse{
					Expense: &groupv1.ExpenseWithDetails{
						Id:          "expense-123",
						GroupId:     "group-123",
						Amount:      3000,
						Description: "Lunch",
						PaidById:    "member-1",
						PaidByName:  "Alice",
						SplitMembers: []*groupv1.SplitMember{
							{
								MemberId:   "member-1",
								MemberName: "Alice",
								Amount:     1000,
							},
							{
								MemberId:   "member-2",
								MemberName: "Bob",
								Amount:     1000,
							},
							{
								MemberId:   "member-3",
								MemberName: "Carol",
								Amount:     1000,
							},
						},
						CreatedAt: timestamppb.Now(),
					},
				}, nil)
			},
		},
		{
			name: "service returns error",
			request: &groupv1.AddExpenseRequest{
				GroupId:        "group-123",
				Amount:         3000,
				Description:    "Lunch",
				PaidById:       "member-1",
				SplitMemberIds: []string{"member-1", "member-2"},
			},
			mockResponse:  nil,
			mockError:     errors.New("group not found"),
			expectedError: true,
			setupMocks: func(mockService *MockGroupServiceInterface) {
				mockService.On("AddExpense", mock.Anything, mock.Anything).Return(nil, errors.New("group not found"))
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(MockGroupServiceInterface)
			tt.setupMocks(mockService)

			handler := NewGroupHandler(mockService)

			resp, err := handler.AddExpense(context.Background(), tt.request)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotNil(t, resp.Expense)
				assert.Equal(t, tt.mockResponse.Expense.Id, resp.Expense.Id)
				assert.Equal(t, tt.mockResponse.Expense.Amount, resp.Expense.Amount)
				assert.Equal(t, tt.mockResponse.Expense.Description, resp.Expense.Description)
				assert.Equal(t, len(tt.mockResponse.Expense.SplitMembers), len(resp.Expense.SplitMembers))
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestGroupHandler_GetGroupExpenses(t *testing.T) {
	tests := []struct {
		name          string
		request       *groupv1.GetGroupExpensesRequest
		mockResponse  *groupv1.GetGroupExpensesResponse
		mockError     error
		expectedError bool
		setupMocks    func(*MockGroupServiceInterface)
	}{
		{
			name: "successful expenses retrieval",
			request: &groupv1.GetGroupExpensesRequest{
				GroupId: "group-123",
			},
			mockResponse: &groupv1.GetGroupExpensesResponse{
				Expenses: []*groupv1.ExpenseWithDetails{
					{
						Id:          "expense-123",
						GroupId:     "group-123",
						Amount:      3000,
						Description: "Lunch",
						PaidById:    "member-1",
						PaidByName:  "Alice",
						SplitMembers: []*groupv1.SplitMember{
							{
								MemberId:   "member-1",
								MemberName: "Alice",
								Amount:     1500,
							},
							{
								MemberId:   "member-2",
								MemberName: "Bob",
								Amount:     1500,
							},
						},
						CreatedAt: timestamppb.Now(),
					},
					{
						Id:          "expense-456",
						GroupId:     "group-123",
						Amount:      2000,
						Description: "Coffee",
						PaidById:    "member-2",
						PaidByName:  "Bob",
						SplitMembers: []*groupv1.SplitMember{
							{
								MemberId:   "member-1",
								MemberName: "Alice",
								Amount:     1000,
							},
							{
								MemberId:   "member-2",
								MemberName: "Bob",
								Amount:     1000,
							},
						},
						CreatedAt: timestamppb.Now(),
					},
				},
			},
			mockError:     nil,
			expectedError: false,
			setupMocks: func(mockService *MockGroupServiceInterface) {
				mockService.On("GetGroupExpenses", mock.Anything, mock.MatchedBy(func(req *groupv1.GetGroupExpensesRequest) bool {
					return req.GroupId == "group-123"
				})).Return(&groupv1.GetGroupExpensesResponse{
					Expenses: []*groupv1.ExpenseWithDetails{
						{
							Id:          "expense-123",
							GroupId:     "group-123",
							Amount:      3000,
							Description: "Lunch",
							PaidById:    "member-1",
							PaidByName:  "Alice",
							SplitMembers: []*groupv1.SplitMember{
								{
									MemberId:   "member-1",
									MemberName: "Alice",
									Amount:     1500,
								},
								{
									MemberId:   "member-2",
									MemberName: "Bob",
									Amount:     1500,
								},
							},
							CreatedAt: timestamppb.Now(),
						},
						{
							Id:          "expense-456",
							GroupId:     "group-123",
							Amount:      2000,
							Description: "Coffee",
							PaidById:    "member-2",
							PaidByName:  "Bob",
							SplitMembers: []*groupv1.SplitMember{
								{
									MemberId:   "member-1",
									MemberName: "Alice",
									Amount:     1000,
								},
								{
									MemberId:   "member-2",
									MemberName: "Bob",
									Amount:     1000,
								},
							},
							CreatedAt: timestamppb.Now(),
						},
					},
				}, nil)
			},
		},
		{
			name: "empty expenses list",
			request: &groupv1.GetGroupExpensesRequest{
				GroupId: "group-123",
			},
			mockResponse: &groupv1.GetGroupExpensesResponse{
				Expenses: []*groupv1.ExpenseWithDetails{},
			},
			mockError:     nil,
			expectedError: false,
			setupMocks: func(mockService *MockGroupServiceInterface) {
				mockService.On("GetGroupExpenses", mock.Anything, mock.Anything).Return(&groupv1.GetGroupExpensesResponse{
					Expenses: []*groupv1.ExpenseWithDetails{},
				}, nil)
			},
		},
		{
			name: "service returns error",
			request: &groupv1.GetGroupExpensesRequest{
				GroupId: "group-123",
			},
			mockResponse:  nil,
			mockError:     errors.New("group not found"),
			expectedError: true,
			setupMocks: func(mockService *MockGroupServiceInterface) {
				mockService.On("GetGroupExpenses", mock.Anything, mock.Anything).Return(nil, errors.New("group not found"))
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(MockGroupServiceInterface)
			tt.setupMocks(mockService)

			handler := NewGroupHandler(mockService)

			resp, err := handler.GetGroupExpenses(context.Background(), tt.request)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotNil(t, resp.Expenses)
				assert.Equal(t, len(tt.mockResponse.Expenses), len(resp.Expenses))

				if len(resp.Expenses) > 0 {
					expense := resp.Expenses[0]
					mockExpense := tt.mockResponse.Expenses[0]

					assert.Equal(t, mockExpense.Id, expense.Id)
					assert.Equal(t, mockExpense.Amount, expense.Amount)
					assert.Equal(t, mockExpense.Description, expense.Description)
					assert.Equal(t, mockExpense.PaidByName, expense.PaidByName)
					assert.Equal(t, len(mockExpense.SplitMembers), len(expense.SplitMembers))
				}
			}

			mockService.AssertExpectations(t)
		})
	}
}
