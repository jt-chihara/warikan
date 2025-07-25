package handler

import (
	"context"
	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

// GroupServiceInterface defines the interface for group service operations
type GroupServiceInterface interface {
	CreateGroup(ctx context.Context, req *groupv1.CreateGroupRequest) (*groupv1.CreateGroupResponse, error)
	GetGroup(ctx context.Context, req *groupv1.GetGroupRequest) (*groupv1.GetGroupResponse, error)
	UpdateGroup(ctx context.Context, req *groupv1.UpdateGroupRequest) (*groupv1.UpdateGroupResponse, error)
	DeleteGroup(ctx context.Context, req *groupv1.DeleteGroupRequest) (*groupv1.DeleteGroupResponse, error)
	AddMember(ctx context.Context, req *groupv1.AddMemberRequest) (*groupv1.AddMemberResponse, error)
	RemoveMember(ctx context.Context, req *groupv1.RemoveMemberRequest) (*groupv1.RemoveMemberResponse, error)
	CalculateSettlements(ctx context.Context, req *groupv1.CalculateSettlementsRequest) (*groupv1.CalculateSettlementsResponse, error)
	AddExpense(ctx context.Context, req *groupv1.AddExpenseRequest) (*groupv1.AddExpenseResponse, error)
	GetGroupExpenses(ctx context.Context, req *groupv1.GetGroupExpensesRequest) (*groupv1.GetGroupExpensesResponse, error)
	UpdateExpense(ctx context.Context, req *groupv1.UpdateExpenseRequest) (*groupv1.UpdateExpenseResponse, error)
	DeleteExpense(ctx context.Context, req *groupv1.DeleteExpenseRequest) (*groupv1.DeleteExpenseResponse, error)
}
