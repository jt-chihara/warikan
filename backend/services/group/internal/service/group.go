package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
	"github.com/jt-chihara/warikan/services/group/internal/algorithm"
	"github.com/jt-chihara/warikan/services/group/internal/domain"
	"github.com/jt-chihara/warikan/services/group/internal/repository"
	"github.com/jt-chihara/warikan/services/group/internal/validator"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type GroupService struct {
	repo        GroupRepositoryInterface
	expenseRepo repository.ExpenseRepository
}

func NewGroupService(repo GroupRepositoryInterface, expenseRepo repository.ExpenseRepository) *GroupService {
	return &GroupService{
		repo:        repo,
		expenseRepo: expenseRepo,
	}
}

func (s *GroupService) CreateGroup(ctx context.Context, req *groupv1.CreateGroupRequest) (*groupv1.CreateGroupResponse, error) {
	// 入力値検証
	if err := validator.ValidateGroupName(req.Name); err != nil {
		return nil, err
	}

	if err := validator.ValidateDescription(req.Description); err != nil {
		return nil, err
	}

	// デフォルト通貨設定
	if req.Currency == "" {
		req.Currency = "JPY"
	}
	if err := validator.ValidateCurrency(req.Currency); err != nil {
		return nil, err
	}

	if err := validator.ValidateMemberNames(req.MemberNames); err != nil {
		return nil, err
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
	if err := validator.ValidateUUID(req.Id); err != nil {
		return nil, errors.New("グループIDが無効です")
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
	// 入力値検証
	if err := validator.ValidateUUID(req.Id); err != nil {
		return nil, errors.New("グループIDが無効です")
	}
	
	if err := validator.ValidateGroupName(req.Name); err != nil {
		return nil, err
	}
	
	if err := validator.ValidateDescription(req.Description); err != nil {
		return nil, err
	}
	
	if err := validator.ValidateCurrency(req.Currency); err != nil {
		return nil, err
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
	if err := validator.ValidateUUID(req.Id); err != nil {
		return nil, errors.New("グループIDが無効です")
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
	// 入力値検証
	if err := validator.ValidateUUID(req.GroupId); err != nil {
		return nil, errors.New("グループIDが無効です")
	}
	
	if err := validator.ValidateMemberName(req.MemberName); err != nil {
		return nil, err
	}

	member, err := s.repo.AddMember(req.GroupId, req.MemberName)
	if err != nil {
		return nil, err
	}

	return &groupv1.AddMemberResponse{
		Member: member,
	}, nil
}

func (s *GroupService) RemoveMember(ctx context.Context, req *groupv1.RemoveMemberRequest) (*groupv1.RemoveMemberResponse, error) {
	// 入力値検証
	if err := validator.ValidateUUID(req.GroupId); err != nil {
		return nil, errors.New("グループIDが無効です")
	}
	
	if err := validator.ValidateUUID(req.MemberId); err != nil {
		return nil, errors.New("メンバーIDが無効です")
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
	if err := validator.ValidateUUID(req.GroupId); err != nil {
		return nil, errors.New("グループIDが無効です")
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

func (s *GroupService) AddExpense(ctx context.Context, req *groupv1.AddExpenseRequest) (*groupv1.AddExpenseResponse, error) {
	// 入力値検証
	if err := validator.ValidateUUID(req.GroupId); err != nil {
		return nil, errors.New("グループIDが無効です")
	}
	
	if err := validator.ValidateExpenseAmount(req.Amount); err != nil {
		return nil, err
	}
	
	if err := validator.ValidateExpenseDescription(req.Description); err != nil {
		return nil, err
	}
	
	if err := validator.ValidateUUID(req.PaidById); err != nil {
		return nil, errors.New("支払い者IDが無効です")
	}
	
	if err := validator.ValidateSplitMemberIds(req.SplitMemberIds); err != nil {
		return nil, err
	}

	// Parse UUIDs
	groupID, err := uuid.Parse(req.GroupId)
	if err != nil {
		return nil, errors.New("invalid group ID")
	}

	paidByID, err := uuid.Parse(req.PaidById)
	if err != nil {
		return nil, errors.New("invalid paid by ID")
	}

	// Validate group exists and get members
	group, err := s.repo.GetGroupByID(req.GroupId)
	if err != nil {
		return nil, err
	}

	// Calculate split amount
	splitAmount := req.Amount / int64(len(req.SplitMemberIds))

	// Create split members
	var splitMembers []domain.SplitMember
	var paidByName string

	for _, memberID := range req.SplitMemberIds {
		memberUUID, err := uuid.Parse(memberID)
		if err != nil {
			return nil, errors.New("invalid member ID: " + memberID)
		}

		// Find member name
		var memberName string
		for _, member := range group.Members {
			if member.Id == memberID {
				memberName = member.Name
				break
			}
		}
		if memberName == "" {
			return nil, errors.New("member not found: " + memberID)
		}

		// Set paid by name if this is the payer
		if memberID == req.PaidById {
			paidByName = memberName
		}

		splitMembers = append(splitMembers, domain.SplitMember{
			MemberID:   memberUUID,
			MemberName: memberName,
			Amount:     splitAmount,
		})
	}

	// Create expense
	now := time.Now()
	expense := &domain.Expense{
		ID:           uuid.New(),
		GroupID:      groupID,
		Amount:       req.Amount,
		Description:  req.Description,
		Currency:     group.Currency,
		PaidByID:     paidByID,
		PaidByName:   paidByName,
		SplitMembers: splitMembers,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Save expense
	err = s.expenseRepo.Create(ctx, expense)
	if err != nil {
		return nil, err
	}

	// Convert to proto format
	protoSplitMembers := make([]*groupv1.SplitMember, len(splitMembers))
	for i, split := range splitMembers {
		protoSplitMembers[i] = &groupv1.SplitMember{
			MemberId:   split.MemberID.String(),
			MemberName: split.MemberName,
			Amount:     split.Amount,
		}
	}

	return &groupv1.AddExpenseResponse{
		Expense: &groupv1.ExpenseWithDetails{
			Id:           expense.ID.String(),
			GroupId:      expense.GroupID.String(),
			Amount:       expense.Amount,
			Description:  expense.Description,
			PaidById:     expense.PaidByID.String(),
			PaidByName:   expense.PaidByName,
			SplitMembers: protoSplitMembers,
			CreatedAt:    timestamppb.New(expense.CreatedAt),
		},
	}, nil
}

func (s *GroupService) GetGroupExpenses(ctx context.Context, req *groupv1.GetGroupExpensesRequest) (*groupv1.GetGroupExpensesResponse, error) {
	if err := validator.ValidateUUID(req.GroupId); err != nil {
		return nil, errors.New("グループIDが無効です")
	}

	groupID, err := uuid.Parse(req.GroupId)
	if err != nil {
		return nil, errors.New("invalid group ID")
	}

	expenses, err := s.expenseRepo.FindByGroupID(ctx, groupID)
	if err != nil {
		return nil, err
	}

	// Convert to proto format
	protoExpenses := make([]*groupv1.ExpenseWithDetails, len(expenses))
	for i, expense := range expenses {
		protoSplitMembers := make([]*groupv1.SplitMember, len(expense.SplitMembers))
		for j, split := range expense.SplitMembers {
			protoSplitMembers[j] = &groupv1.SplitMember{
				MemberId:   split.MemberID.String(),
				MemberName: split.MemberName,
				Amount:     split.Amount,
			}
		}

		protoExpenses[i] = &groupv1.ExpenseWithDetails{
			Id:           expense.ID.String(),
			GroupId:      expense.GroupID.String(),
			Amount:       expense.Amount,
			Description:  expense.Description,
			PaidById:     expense.PaidByID.String(),
			PaidByName:   expense.PaidByName,
			SplitMembers: protoSplitMembers,
			CreatedAt:    timestamppb.New(expense.CreatedAt),
		}
	}

	return &groupv1.GetGroupExpensesResponse{
		Expenses: protoExpenses,
	}, nil
}

func (s *GroupService) UpdateExpense(ctx context.Context, req *groupv1.UpdateExpenseRequest) (*groupv1.UpdateExpenseResponse, error) {
	// 入力値検証
	if err := validator.ValidateUUID(req.ExpenseId); err != nil {
		return nil, errors.New("支払いIDが無効です")
	}
	
	if err := validator.ValidateExpenseAmount(req.Amount); err != nil {
		return nil, err
	}
	
	if err := validator.ValidateExpenseDescription(req.Description); err != nil {
		return nil, err
	}
	
	if err := validator.ValidateUUID(req.PaidById); err != nil {
		return nil, errors.New("支払い者IDが無効です")
	}
	
	if err := validator.ValidateSplitMemberIds(req.SplitMemberIds); err != nil {
		return nil, err
	}

	// Parse UUIDs
	expenseID, err := uuid.Parse(req.ExpenseId)
	if err != nil {
		return nil, errors.New("invalid expense ID")
	}

	paidByID, err := uuid.Parse(req.PaidById)
	if err != nil {
		return nil, errors.New("invalid paid by ID")
	}

	// Get existing expense to validate it exists and get group ID
	existingExpense, err := s.expenseRepo.FindByID(ctx, expenseID)
	if err != nil {
		return nil, err
	}

	// Get group to validate members
	group, err := s.repo.GetGroupByID(existingExpense.GroupID.String())
	if err != nil {
		return nil, err
	}

	// Validate paid by member exists
	var paidByName string
	paidByFound := false
	memberMap := make(map[string]string) // ID -> Name
	for _, member := range group.Members {
		memberMap[member.Id] = member.Name
		if member.Id == req.PaidById {
			paidByFound = true
			paidByName = member.Name
		}
	}
	if !paidByFound {
		return nil, errors.New("paid by member not found in group")
	}

	// Validate split members exist
	splitMembers := make([]domain.SplitMember, 0, len(req.SplitMemberIds))
	splitAmount := req.Amount / int64(len(req.SplitMemberIds))
	remainder := req.Amount % int64(len(req.SplitMemberIds))

	for i, memberID := range req.SplitMemberIds {
		memberName, found := memberMap[memberID]
		if !found {
			return nil, errors.New("split member not found in group")
		}

		memberUUID, err := uuid.Parse(memberID)
		if err != nil {
			return nil, errors.New("invalid split member ID")
		}

		amount := splitAmount
		if i < int(remainder) {
			amount++ // Distribute remainder
		}

		splitMembers = append(splitMembers, domain.SplitMember{
			MemberID:   memberUUID,
			MemberName: memberName,
			Amount:     amount,
		})
	}

	// Update expense
	expense := &domain.Expense{
		ID:           expenseID,
		GroupID:      existingExpense.GroupID,
		Amount:       req.Amount,
		Description:  req.Description,
		Currency:     existingExpense.Currency,
		PaidByID:     paidByID,
		PaidByName:   paidByName,
		SplitMembers: splitMembers,
		CreatedAt:    existingExpense.CreatedAt,
		UpdatedAt:    time.Now(),
	}

	// Save updated expense
	err = s.expenseRepo.Update(ctx, expense)
	if err != nil {
		return nil, err
	}

	// Convert to proto format
	protoSplitMembers := make([]*groupv1.SplitMember, len(splitMembers))
	for i, split := range splitMembers {
		protoSplitMembers[i] = &groupv1.SplitMember{
			MemberId:   split.MemberID.String(),
			MemberName: split.MemberName,
			Amount:     split.Amount,
		}
	}

	return &groupv1.UpdateExpenseResponse{
		Expense: &groupv1.ExpenseWithDetails{
			Id:           expense.ID.String(),
			GroupId:      expense.GroupID.String(),
			Amount:       expense.Amount,
			Description:  expense.Description,
			PaidById:     expense.PaidByID.String(),
			PaidByName:   expense.PaidByName,
			SplitMembers: protoSplitMembers,
			CreatedAt:    timestamppb.New(expense.CreatedAt),
		},
	}, nil
}

func (s *GroupService) DeleteExpense(ctx context.Context, req *groupv1.DeleteExpenseRequest) (*groupv1.DeleteExpenseResponse, error) {
	if err := validator.ValidateUUID(req.ExpenseId); err != nil {
		return nil, errors.New("支払いIDが無効です")
	}

	expenseID, err := uuid.Parse(req.ExpenseId)
	if err != nil {
		return nil, errors.New("invalid expense ID")
	}

	err = s.expenseRepo.Delete(ctx, expenseID)
	if err != nil {
		return nil, err
	}

	return &groupv1.DeleteExpenseResponse{
		Success: true,
	}, nil
}
