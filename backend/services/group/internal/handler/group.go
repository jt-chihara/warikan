package handler

import (
	"context"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

type GroupHandler struct {
	groupv1.UnimplementedGroupServiceServer
	service GroupServiceInterface
}

func NewGroupHandler(service GroupServiceInterface) *GroupHandler {
	return &GroupHandler{
		service: service,
	}
}

func (h *GroupHandler) CreateGroup(ctx context.Context, req *groupv1.CreateGroupRequest) (*groupv1.CreateGroupResponse, error) {
	return h.service.CreateGroup(ctx, req)
}

func (h *GroupHandler) GetGroup(ctx context.Context, req *groupv1.GetGroupRequest) (*groupv1.GetGroupResponse, error) {
	return h.service.GetGroup(ctx, req)
}

func (h *GroupHandler) UpdateGroup(ctx context.Context, req *groupv1.UpdateGroupRequest) (*groupv1.UpdateGroupResponse, error) {
	return h.service.UpdateGroup(ctx, req)
}

func (h *GroupHandler) DeleteGroup(ctx context.Context, req *groupv1.DeleteGroupRequest) (*groupv1.DeleteGroupResponse, error) {
	return h.service.DeleteGroup(ctx, req)
}

func (h *GroupHandler) AddMember(ctx context.Context, req *groupv1.AddMemberRequest) (*groupv1.AddMemberResponse, error) {
	return h.service.AddMember(ctx, req)
}

func (h *GroupHandler) RemoveMember(ctx context.Context, req *groupv1.RemoveMemberRequest) (*groupv1.RemoveMemberResponse, error) {
	return h.service.RemoveMember(ctx, req)
}

func (h *GroupHandler) CalculateSettlements(ctx context.Context, req *groupv1.CalculateSettlementsRequest) (*groupv1.CalculateSettlementsResponse, error) {
	return h.service.CalculateSettlements(ctx, req)
}

func (h *GroupHandler) AddExpense(ctx context.Context, req *groupv1.AddExpenseRequest) (*groupv1.AddExpenseResponse, error) {
	return h.service.AddExpense(ctx, req)
}

func (h *GroupHandler) GetGroupExpenses(ctx context.Context, req *groupv1.GetGroupExpensesRequest) (*groupv1.GetGroupExpensesResponse, error) {
	return h.service.GetGroupExpenses(ctx, req)
}