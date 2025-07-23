package handler

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

// MockGroupService is a mock implementation of the GroupService
type MockGroupService struct {
	mock.Mock
}

func (m *MockGroupService) CreateGroup(ctx context.Context, req *groupv1.CreateGroupRequest) (*groupv1.CreateGroupResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.CreateGroupResponse), args.Error(1)
}

func (m *MockGroupService) GetGroup(ctx context.Context, req *groupv1.GetGroupRequest) (*groupv1.GetGroupResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.GetGroupResponse), args.Error(1)
}

func (m *MockGroupService) UpdateGroup(ctx context.Context, req *groupv1.UpdateGroupRequest) (*groupv1.UpdateGroupResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.UpdateGroupResponse), args.Error(1)
}

func (m *MockGroupService) DeleteGroup(ctx context.Context, req *groupv1.DeleteGroupRequest) (*groupv1.DeleteGroupResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.DeleteGroupResponse), args.Error(1)
}

func (m *MockGroupService) AddMember(ctx context.Context, req *groupv1.AddMemberRequest) (*groupv1.AddMemberResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.AddMemberResponse), args.Error(1)
}

func (m *MockGroupService) RemoveMember(ctx context.Context, req *groupv1.RemoveMemberRequest) (*groupv1.RemoveMemberResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.RemoveMemberResponse), args.Error(1)
}

func (m *MockGroupService) CalculateSettlements(ctx context.Context, req *groupv1.CalculateSettlementsRequest) (*groupv1.CalculateSettlementsResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.CalculateSettlementsResponse), args.Error(1)
}

func (m *MockGroupService) AddExpense(ctx context.Context, req *groupv1.AddExpenseRequest) (*groupv1.AddExpenseResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.AddExpenseResponse), args.Error(1)
}

func (m *MockGroupService) GetGroupExpenses(ctx context.Context, req *groupv1.GetGroupExpensesRequest) (*groupv1.GetGroupExpensesResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.GetGroupExpensesResponse), args.Error(1)
}

func TestGroupHandler_CreateGroup_Success(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	req := &groupv1.CreateGroupRequest{
		Name:        "Test Group",
		Description: "Test Description",
		Currency:    "JPY",
		MemberNames: []string{"Alice", "Bob"},
	}

	expectedResp := &groupv1.CreateGroupResponse{
		Group: &groupv1.Group{
			Id:          uuid.New().String(),
			Name:        req.Name,
			Description: req.Description,
			Currency:    req.Currency,
			CreatedAt:   timestamppb.Now(),
			UpdatedAt:   timestamppb.Now(),
			Members: []*groupv1.Member{
				&groupv1.Member{Id: uuid.New().String(), Name: "Alice", JoinedAt: timestamppb.Now()},
				&groupv1.Member{Id: uuid.New().String(), Name: "Bob", JoinedAt: timestamppb.Now()},
			},
		},
	}

	mockService.On("CreateGroup", mock.Anything, req).Return(expectedResp, nil)

	// Act
	resp, err := handler.CreateGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedResp.Group.Name, resp.Group.Name)
	assert.Equal(t, expectedResp.Group.Description, resp.Group.Description)
	assert.Len(t, resp.Group.Members, 2)

	mockService.AssertExpectations(t)
}

func TestGroupHandler_CreateGroup_ServiceError(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	req := &groupv1.CreateGroupRequest{
		Name:        "",
		Description: "Test Description",
		Currency:    "JPY",
	}

	expectedError := errors.New("group name is required")
	mockService.On("CreateGroup", mock.Anything, req).Return(nil, expectedError)

	// Act
	resp, err := handler.CreateGroup(context.Background(), req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, expectedError, err)

	mockService.AssertExpectations(t)
}

func TestGroupHandler_GetGroup_Success(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	groupID := uuid.New().String()
	req := &groupv1.GetGroupRequest{Id: groupID}

	expectedResp := &groupv1.GetGroupResponse{
		Group: &groupv1.Group{
			Id:          groupID,
			Name:        "Test Group",
			Description: "Test Description",
			Currency:    "JPY",
			CreatedAt:   timestamppb.Now(),
			UpdatedAt:   timestamppb.Now(),
		},
	}

	mockService.On("GetGroup", mock.Anything, req).Return(expectedResp, nil)

	// Act
	resp, err := handler.GetGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedResp.Group.Id, resp.Group.Id)
	assert.Equal(t, expectedResp.Group.Name, resp.Group.Name)

	mockService.AssertExpectations(t)
}

func TestGroupHandler_UpdateGroup_Success(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	groupID := uuid.New().String()
	req := &groupv1.UpdateGroupRequest{
		Id:          groupID,
		Name:        "Updated Group",
		Description: "Updated Description",
		Currency:    "USD",
	}

	expectedResp := &groupv1.UpdateGroupResponse{
		Group: &groupv1.Group{
			Id:          groupID,
			Name:        req.Name,
			Description: req.Description,
			Currency:    req.Currency,
			UpdatedAt:   timestamppb.Now(),
		},
	}

	mockService.On("UpdateGroup", mock.Anything, req).Return(expectedResp, nil)

	// Act
	resp, err := handler.UpdateGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedResp.Group.Name, resp.Group.Name)

	mockService.AssertExpectations(t)
}

func TestGroupHandler_DeleteGroup_Success(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	groupID := uuid.New().String()
	req := &groupv1.DeleteGroupRequest{Id: groupID}

	expectedResp := &groupv1.DeleteGroupResponse{Success: true}

	mockService.On("DeleteGroup", mock.Anything, req).Return(expectedResp, nil)

	// Act
	resp, err := handler.DeleteGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.True(t, resp.Success)

	mockService.AssertExpectations(t)
}

func TestGroupHandler_AddMember_Success(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	req := &groupv1.AddMemberRequest{
		GroupId:     uuid.New().String(),
		MemberName:  "Charlie",
		MemberEmail: "charlie@example.com",
	}

	expectedResp := &groupv1.AddMemberResponse{
		Member: &groupv1.Member{
			Id:       uuid.New().String(),
			Name:     req.MemberName,
			Email:    req.MemberEmail,
			JoinedAt: timestamppb.Now(),
		},
	}

	mockService.On("AddMember", mock.Anything, req).Return(expectedResp, nil)

	// Act
	resp, err := handler.AddMember(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedResp.Member.Name, resp.Member.Name)
	assert.Equal(t, expectedResp.Member.Email, resp.Member.Email)

	mockService.AssertExpectations(t)
}

func TestGroupHandler_RemoveMember_Success(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	req := &groupv1.RemoveMemberRequest{
		GroupId:  uuid.New().String(),
		MemberId: uuid.New().String(),
	}

	expectedResp := &groupv1.RemoveMemberResponse{Success: true}

	mockService.On("RemoveMember", mock.Anything, req).Return(expectedResp, nil)

	// Act
	resp, err := handler.RemoveMember(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.True(t, resp.Success)

	mockService.AssertExpectations(t)
}

func TestGroupHandler_RemoveMember_ServiceError(t *testing.T) {
	// Arrange
	mockService := new(MockGroupService)
	handler := NewGroupHandler(mockService)

	req := &groupv1.RemoveMemberRequest{
		GroupId:  uuid.New().String(),
		MemberId: "",
	}

	expectedError := errors.New("member ID is required")
	mockService.On("RemoveMember", mock.Anything, req).Return(nil, expectedError)

	// Act
	resp, err := handler.RemoveMember(context.Background(), req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, expectedError, err)

	mockService.AssertExpectations(t)
}