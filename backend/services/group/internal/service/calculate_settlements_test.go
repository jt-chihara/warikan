package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

func TestGroupService_CalculateSettlements_Success(t *testing.T) {
	mockRepo := new(MockGroupRepositoryInterface)
	mockExpenseRepo := new(MockExpenseRepository)
	service := NewGroupService(mockRepo, mockExpenseRepo)

	groupID := "550e8400-e29b-41d4-a716-446655440000"
	expenses := []*groupv1.Expense{
		{
			Id:           "exp1",
			PayerId:      "550e8400-e29b-41d4-a716-446655440001",
			Amount:       2000,
			Description:  "Lunch",
			SplitBetween: []string{"550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"},
		},
	}

	group := &groupv1.Group{
		Id:       groupID,
		Currency: "JPY",
		Members: []*groupv1.Member{
			{Id: "550e8400-e29b-41d4-a716-446655440001", Name: "Alice"},
			{Id: "550e8400-e29b-41d4-a716-446655440002", Name: "Bob"},
		},
	}

	mockRepo.On("GetGroupByID", groupID).Return(group, nil)

	req := &groupv1.CalculateSettlementsRequest{
		GroupId:  groupID,
		Expenses: expenses,
	}

	resp, err := service.CalculateSettlements(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Len(t, resp.Settlements, 1)
	assert.Len(t, resp.Balances, 2)
	
	// Check settlement details
	settlement := resp.Settlements[0]
	assert.Equal(t, "550e8400-e29b-41d4-a716-446655440002", settlement.FromMemberId)
	assert.Equal(t, "550e8400-e29b-41d4-a716-446655440001", settlement.ToMemberId)
	assert.Equal(t, int64(1000), settlement.Amount)
	assert.Equal(t, "Bob", settlement.FromName)
	assert.Equal(t, "Alice", settlement.ToName)
	
	mockRepo.AssertExpectations(t)
}

func TestGroupService_CalculateSettlements_EmptyGroupID(t *testing.T) {
	mockRepo := new(MockGroupRepositoryInterface)
	mockExpenseRepo := new(MockExpenseRepository)
	service := NewGroupService(mockRepo, mockExpenseRepo)

	req := &groupv1.CalculateSettlementsRequest{
		GroupId:  "",
		Expenses: []*groupv1.Expense{},
	}

	resp, err := service.CalculateSettlements(context.Background(), req)

	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "group ID is required")
}

func TestGroupService_CalculateSettlements_GroupNotFound(t *testing.T) {
	mockRepo := new(MockGroupRepositoryInterface)
	mockExpenseRepo := new(MockExpenseRepository)
	service := NewGroupService(mockRepo, mockExpenseRepo)

	groupID := "nonexistent-group"
	req := &groupv1.CalculateSettlementsRequest{
		GroupId:  groupID,
		Expenses: []*groupv1.Expense{},
	}

	mockRepo.On("GetGroupByID", groupID).Return(nil, assert.AnError)

	resp, err := service.CalculateSettlements(context.Background(), req)

	assert.Error(t, err)
	assert.Nil(t, resp)
	mockRepo.AssertExpectations(t)
}