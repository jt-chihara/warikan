package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

func TestGroupService_CalculateSettlements_Success(t *testing.T) {
	mockRepo := NewMockGroupRepositoryInterface(t)
	service := NewGroupService(mockRepo)

	groupID := "group-123"
	expenses := []*groupv1.Expense{
		{
			Id:           "exp1",
			PayerId:      "member1",
			Amount:       2000,
			Description:  "Lunch",
			SplitBetween: []string{"member1", "member2"},
		},
	}

	group := &groupv1.Group{
		Id: groupID,
		Members: []*groupv1.Member{
			{Id: "member1", Name: "Alice"},
			{Id: "member2", Name: "Bob"},
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
	assert.Equal(t, "member2", settlement.FromMemberId)
	assert.Equal(t, "member1", settlement.ToMemberId)
	assert.Equal(t, int64(1000), settlement.Amount)
	assert.Equal(t, "Bob", settlement.FromName)
	assert.Equal(t, "Alice", settlement.ToName)
	
	mockRepo.AssertExpectations(t)
}

func TestGroupService_CalculateSettlements_EmptyGroupID(t *testing.T) {
	mockRepo := NewMockGroupRepositoryInterface(t)
	service := NewGroupService(mockRepo)

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
	mockRepo := NewMockGroupRepositoryInterface(t)
	service := NewGroupService(mockRepo)

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