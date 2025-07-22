package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrGroupNotFound  = errors.New("group not found")
	ErrMemberNotFound = errors.New("member not found")
)

type Group struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Currency    string    `json:"currency"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Members     []Member  `json:"members"`
}

type Member struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Email    string    `json:"email,omitempty"`
	JoinedAt time.Time `json:"joined_at"`
}