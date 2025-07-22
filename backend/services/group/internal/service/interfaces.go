package service

import groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"

// GroupRepositoryInterface defines the interface for group repository operations
type GroupRepositoryInterface interface {
	CreateGroup(name, description, currency string, memberNames []string) (*groupv1.Group, error)
	GetGroupByID(groupID string) (*groupv1.Group, error)
	UpdateGroup(groupID, name, description, currency string) (*groupv1.Group, error)
	DeleteGroup(groupID string) error
	AddMember(groupID, memberName, memberEmail string) (*groupv1.Member, error)
	RemoveMember(groupID, memberID string) error
}