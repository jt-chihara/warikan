package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrExpenseNotFound = errors.New("expense not found")
)

type Expense struct {
	ID           uuid.UUID     `json:"id"`
	GroupID      uuid.UUID     `json:"group_id"`
	Amount       int64         `json:"amount"` // Amount in cents (JPY)
	Description  string        `json:"description"`
	Currency     string        `json:"currency"`
	PaidByID     uuid.UUID     `json:"paid_by_id"`
	PaidByName   string        `json:"paid_by_name"`
	SplitMembers []SplitMember `json:"split_members"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

type SplitMember struct {
	MemberID   uuid.UUID `json:"member_id"`
	MemberName string    `json:"member_name"`
	Amount     int64     `json:"amount"` // Amount owed by this member in cents (JPY)
}