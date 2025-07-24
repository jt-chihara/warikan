package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
	"github.com/jt-chihara/warikan/services/group/internal/domain"
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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Expense), args.Error(1)
}

func (m *MockExpenseRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Expense, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Expense), args.Error(1)
}

func (m *MockExpenseRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockGroupRepositoryInterface for testing
type MockGroupRepositoryInterface struct {
	mock.Mock
}

func (m *MockGroupRepositoryInterface) CreateGroup(name, description, currency string, memberNames []string) (*groupv1.Group, error) {
	args := m.Called(name, description, currency, memberNames)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepositoryInterface) GetGroupByID(id string) (*groupv1.Group, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepositoryInterface) UpdateGroup(id, name, description, currency string) (*groupv1.Group, error) {
	args := m.Called(id, name, description, currency)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Group), args.Error(1)
}

func (m *MockGroupRepositoryInterface) DeleteGroup(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockGroupRepositoryInterface) AddMember(groupId, memberName, memberEmail string) (*groupv1.Member, error) {
	args := m.Called(groupId, memberName, memberEmail)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*groupv1.Member), args.Error(1)
}

func (m *MockGroupRepositoryInterface) RemoveMember(groupId, memberId string) error {
	args := m.Called(groupId, memberId)
	return args.Error(0)
}
