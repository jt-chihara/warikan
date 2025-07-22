package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"

	groupv1 "github.com/username/warikan/backend/proto/group/v1"
)

// MockGroupRepository is a mock implementation of the GroupRepository
type MockGroupRepository struct {
	mock.Mock
}

func (m *MockGroupRepository) CreateGroup(name, description, currency string, memberNames []string) (*groupv1.Group, error) {
	args := m.Called(name, description, currency, memberNames)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepository) GetGroupByID(groupID string) (*groupv1.Group, error) {
	args := m.Called(groupID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepository) UpdateGroup(groupID, name, description, currency string) (*groupv1.Group, error) {
	args := m.Called(groupID, name, description, currency)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepository) DeleteGroup(groupID string) error {
	args := m.Called(groupID)
	return args.Error(0)
}

func (m *MockGroupRepository) AddMember(groupID, memberName, memberEmail string) (*groupv1.Member, error) {
	args := m.Called(groupID, memberName, memberEmail)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Member), args.Error(1)
}

func (m *MockGroupRepository) RemoveMember(groupID, memberID string) error {
	args := m.Called(groupID, memberID)
	return args.Error(0)
}

func TestGroupService_CreateGroup_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	req := &groupv1.CreateGroupRequest{
		Name:        "Test Group",
		Description: "Test Description",
		Currency:    "JPY",
		MemberNames: []string{"Alice", "Bob"},
	}

	expectedGroup := &groupv1.Group{
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
	}

	mockRepo.On("CreateGroup", req.Name, req.Description, req.Currency, req.MemberNames).
		Return(expectedGroup, nil)

	// Act
	resp, err := service.CreateGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedGroup.Name, resp.Group.Name)
	assert.Equal(t, expectedGroup.Description, resp.Group.Description)
	assert.Equal(t, expectedGroup.Currency, resp.Group.Currency)
	assert.Len(t, resp.Group.Members, 2)

	mockRepo.AssertExpectations(t)
}

func TestGroupService_CreateGroup_EmptyName(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	req := &groupv1.CreateGroupRequest{
		Name:        "", // Empty name should cause error
		Description: "Test Description",
		Currency:    "JPY",
		MemberNames: []string{"Alice"},
	}

	// Act
	resp, err := service.CreateGroup(context.Background(), req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "group name is required")

	// Repository should not be called
	mockRepo.AssertNotCalled(t, "CreateGroup")
}

func TestGroupService_CreateGroup_DefaultCurrency(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	req := &groupv1.CreateGroupRequest{
		Name:        "Test Group",
		Description: "Test Description",
		Currency:    "", // Empty currency should default to JPY
		MemberNames: []string{"Alice"},
	}

	expectedGroup := &groupv1.Group{
		Id:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Currency:    "JPY", // Should be defaulted
		CreatedAt:   timestamppb.Now(),
		UpdatedAt:   timestamppb.Now(),
	}

	mockRepo.On("CreateGroup", req.Name, req.Description, "JPY", req.MemberNames).
		Return(expectedGroup, nil)

	// Act
	resp, err := service.CreateGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, "JPY", resp.Group.Currency)

	mockRepo.AssertExpectations(t)
}

func TestGroupService_GetGroup_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	groupID := uuid.New().String()
	req := &groupv1.GetGroupRequest{Id: groupID}

	expectedGroup := &groupv1.Group{
		Id:          groupID,
		Name:        "Test Group",
		Description: "Test Description",
		Currency:    "JPY",
		CreatedAt:   timestamppb.Now(),
		UpdatedAt:   timestamppb.Now(),
	}

	mockRepo.On("GetGroupByID", groupID).Return(expectedGroup, nil)

	// Act
	resp, err := service.GetGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedGroup.Id, resp.Group.Id)
	assert.Equal(t, expectedGroup.Name, resp.Group.Name)

	mockRepo.AssertExpectations(t)
}

func TestGroupService_GetGroup_EmptyID(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	req := &groupv1.GetGroupRequest{Id: ""} // Empty ID should cause error

	// Act
	resp, err := service.GetGroup(context.Background(), req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "group ID is required")

	mockRepo.AssertNotCalled(t, "GetGroupByID")
}

func TestGroupService_UpdateGroup_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	groupID := uuid.New().String()
	req := &groupv1.UpdateGroupRequest{
		Id:          groupID,
		Name:        "Updated Group",
		Description: "Updated Description",
		Currency:    "USD",
	}

	expectedGroup := &groupv1.Group{
		Id:          groupID,
		Name:        req.Name,
		Description: req.Description,
		Currency:    req.Currency,
		UpdatedAt:   timestamppb.Now(),
	}

	mockRepo.On("UpdateGroup", groupID, req.Name, req.Description, req.Currency).
		Return(expectedGroup, nil)

	// Act
	resp, err := service.UpdateGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedGroup.Name, resp.Group.Name)
	assert.Equal(t, expectedGroup.Description, resp.Group.Description)

	mockRepo.AssertExpectations(t)
}

func TestGroupService_DeleteGroup_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	groupID := uuid.New().String()
	req := &groupv1.DeleteGroupRequest{Id: groupID}

	mockRepo.On("DeleteGroup", groupID).Return(nil)

	// Act
	resp, err := service.DeleteGroup(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.True(t, resp.Success)

	mockRepo.AssertExpectations(t)
}

func TestGroupService_DeleteGroup_RepositoryError(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	groupID := uuid.New().String()
	req := &groupv1.DeleteGroupRequest{Id: groupID}

	expectedError := errors.New("database error")
	mockRepo.On("DeleteGroup", groupID).Return(expectedError)

	// Act
	resp, err := service.DeleteGroup(context.Background(), req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, expectedError, err)

	mockRepo.AssertExpectations(t)
}

func TestGroupService_AddMember_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	req := &groupv1.AddMemberRequest{
		GroupId:     uuid.New().String(),
		MemberName:  "Charlie",
		MemberEmail: "charlie@example.com",
	}

	expectedMember := &groupv1.Member{
		Id:       uuid.New().String(),
		Name:     req.MemberName,
		Email:    req.MemberEmail,
		JoinedAt: timestamppb.Now(),
	}

	mockRepo.On("AddMember", req.GroupId, req.MemberName, req.MemberEmail).
		Return(expectedMember, nil)

	// Act
	resp, err := service.AddMember(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedMember.Name, resp.Member.Name)
	assert.Equal(t, expectedMember.Email, resp.Member.Email)

	mockRepo.AssertExpectations(t)
}

func TestGroupService_AddMember_EmptyName(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	req := &groupv1.AddMemberRequest{
		GroupId:     uuid.New().String(),
		MemberName:  "", // Empty name should cause error
		MemberEmail: "charlie@example.com",
	}

	// Act
	resp, err := service.AddMember(context.Background(), req)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "member name is required")

	mockRepo.AssertNotCalled(t, "AddMember")
}

func TestGroupService_RemoveMember_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockGroupRepository)
	service := NewGroupService(mockRepo)

	req := &groupv1.RemoveMemberRequest{
		GroupId:  uuid.New().String(),
		MemberId: uuid.New().String(),
	}

	mockRepo.On("RemoveMember", req.GroupId, req.MemberId).Return(nil)

	// Act
	resp, err := service.RemoveMember(context.Background(), req)

	// Assert
	require.NoError(t, err)
	assert.True(t, resp.Success)

	mockRepo.AssertExpectations(t)
}