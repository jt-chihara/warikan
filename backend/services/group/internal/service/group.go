package service

import (
	"context"
	"errors"

	"github.com/jt-chihara/warikan/services/group/internal/algorithm"
	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

type GroupService struct {
	repo GroupRepositoryInterface
}

func NewGroupService(repo GroupRepositoryInterface) *GroupService {
	return &GroupService{repo: repo}
}

func (s *GroupService) CreateGroup(ctx context.Context, req *groupv1.CreateGroupRequest) (*groupv1.CreateGroupResponse, error) {
	if req.Name == "" {
		return nil, errors.New("group name is required")
	}

	if req.Currency == "" {
		req.Currency = "JPY" // default currency
	}

	group, err := s.repo.CreateGroup(req.Name, req.Description, req.Currency, req.MemberNames)
	if err != nil {
		return nil, err
	}

	return &groupv1.CreateGroupResponse{
		Group: group,
	}, nil
}

func (s *GroupService) GetGroup(ctx context.Context, req *groupv1.GetGroupRequest) (*groupv1.GetGroupResponse, error) {
	if req.Id == "" {
		return nil, errors.New("group ID is required")
	}

	group, err := s.repo.GetGroupByID(req.Id)
	if err != nil {
		return nil, err
	}

	return &groupv1.GetGroupResponse{
		Group: group,
	}, nil
}

func (s *GroupService) UpdateGroup(ctx context.Context, req *groupv1.UpdateGroupRequest) (*groupv1.UpdateGroupResponse, error) {
	if req.Id == "" {
		return nil, errors.New("group ID is required")
	}
	if req.Name == "" {
		return nil, errors.New("group name is required")
	}

	group, err := s.repo.UpdateGroup(req.Id, req.Name, req.Description, req.Currency)
	if err != nil {
		return nil, err
	}

	return &groupv1.UpdateGroupResponse{
		Group: group,
	}, nil
}

func (s *GroupService) DeleteGroup(ctx context.Context, req *groupv1.DeleteGroupRequest) (*groupv1.DeleteGroupResponse, error) {
	if req.Id == "" {
		return nil, errors.New("group ID is required")
	}

	err := s.repo.DeleteGroup(req.Id)
	if err != nil {
		return nil, err
	}

	return &groupv1.DeleteGroupResponse{
		Success: true,
	}, nil
}

func (s *GroupService) AddMember(ctx context.Context, req *groupv1.AddMemberRequest) (*groupv1.AddMemberResponse, error) {
	if req.GroupId == "" {
		return nil, errors.New("group ID is required")
	}
	if req.MemberName == "" {
		return nil, errors.New("member name is required")
	}

	member, err := s.repo.AddMember(req.GroupId, req.MemberName, req.MemberEmail)
	if err != nil {
		return nil, err
	}

	return &groupv1.AddMemberResponse{
		Member: member,
	}, nil
}

func (s *GroupService) RemoveMember(ctx context.Context, req *groupv1.RemoveMemberRequest) (*groupv1.RemoveMemberResponse, error) {
	if req.GroupId == "" {
		return nil, errors.New("group ID is required")
	}
	if req.MemberId == "" {
		return nil, errors.New("member ID is required")
	}

	err := s.repo.RemoveMember(req.GroupId, req.MemberId)
	if err != nil {
		return nil, err
	}

	return &groupv1.RemoveMemberResponse{
		Success: true,
	}, nil
}

func (s *GroupService) CalculateSettlements(ctx context.Context, req *groupv1.CalculateSettlementsRequest) (*groupv1.CalculateSettlementsResponse, error) {
	if req.GroupId == "" {
		return nil, errors.New("group ID is required")
	}

	// Get group to validate it exists and get members
	group, err := s.repo.GetGroupByID(req.GroupId)
	if err != nil {
		return nil, err
	}

	// Convert proto expenses to algorithm format
	algExpenses := make([]algorithm.Expense, len(req.Expenses))
	for i, expense := range req.Expenses {
		algExpenses[i] = algorithm.Expense{
			ID:           expense.Id,
			PayerID:      expense.PayerId,
			Amount:       expense.Amount,
			SplitBetween: expense.SplitBetween,
		}
	}

	// Convert proto members to algorithm format
	algMembers := make([]algorithm.Member, len(group.Members))
	for i, member := range group.Members {
		algMembers[i] = algorithm.Member{
			ID:   member.Id,
			Name: member.Name,
		}
	}

	// Calculate member balances
	balances := algorithm.CalculateMemberBalances(algExpenses, algMembers)

	// Calculate optimal settlements
	settlements, err := algorithm.CalculateOptimalSettlements(balances)
	if err != nil {
		return nil, err
	}

	// Convert algorithm results to proto format
	protoSettlements := make([]*groupv1.Settlement, len(settlements))
	for i, settlement := range settlements {
		protoSettlements[i] = &groupv1.Settlement{
			FromMemberId: settlement.FromMemberID,
			ToMemberId:   settlement.ToMemberID,
			Amount:       settlement.Amount,
			FromName:     settlement.FromName,
			ToName:       settlement.ToName,
		}
	}

	protoBalances := make([]*groupv1.MemberBalance, len(balances))
	for i, balance := range balances {
		protoBalances[i] = &groupv1.MemberBalance{
			MemberId:   balance.MemberID,
			MemberName: balance.Name,
			Balance:    balance.Amount,
		}
	}

	return &groupv1.CalculateSettlementsResponse{
		Settlements: protoSettlements,
		Balances:    protoBalances,
	}, nil
}