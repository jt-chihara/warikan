package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"google.golang.org/protobuf/types/known/timestamppb"

	groupv1 "github.com/jt-chihara/warikan/backend/proto/group/v1"
)

type GroupRepository struct {
	db *sql.DB
}

func NewGroupRepository(db *sql.DB) *GroupRepository {
	return &GroupRepository{db: db}
}

func (r *GroupRepository) CreateGroup(name, description, currency string, memberNames []string) (*groupv1.Group, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Create group
	groupID := uuid.New().String()
	now := time.Now()

	_, err = tx.Exec(`
		INSERT INTO groups (id, name, description, currency, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, groupID, name, description, currency, now, now)
	if err != nil {
		return nil, err
	}

	// Create members
	var members []*groupv1.Member
	for _, memberName := range memberNames {
		if memberName == "" {
			continue
		}

		memberID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO members (id, group_id, name, joined_at)
			VALUES ($1, $2, $3, $4)
		`, memberID, groupID, memberName, now)
		if err != nil {
			return nil, err
		}

		members = append(members, &groupv1.Member{
			Id:       memberID,
			Name:     memberName,
			JoinedAt: timestamppb.New(now),
		})
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return &groupv1.Group{
		Id:          groupID,
		Name:        name,
		Description: description,
		Currency:    currency,
		CreatedAt:   timestamppb.New(now),
		UpdatedAt:   timestamppb.New(now),
		Members:     members,
	}, nil
}

func (r *GroupRepository) GetGroupByID(groupID string) (*groupv1.Group, error) {
	var group groupv1.Group
	var createdAt, updatedAt time.Time
	err := r.db.QueryRow(`
		SELECT id, name, description, currency, created_at, updated_at
		FROM groups WHERE id = $1
	`, groupID).Scan(
		&group.Id, &group.Name, &group.Description, &group.Currency,
		&createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("group not found")
		}
		return nil, err
	}

	group.CreatedAt = timestamppb.New(createdAt)
	group.UpdatedAt = timestamppb.New(updatedAt)

	// Get members
	rows, err := r.db.Query(`
		SELECT id, name, email, joined_at
		FROM members WHERE group_id = $1
		ORDER BY joined_at ASC
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []*groupv1.Member
	for rows.Next() {
		var member groupv1.Member
		var email sql.NullString
		var joinedAt time.Time

		err := rows.Scan(&member.Id, &member.Name, &email, &joinedAt)
		if err != nil {
			return nil, err
		}

		if email.Valid {
			member.Email = email.String
		}
		member.JoinedAt = timestamppb.New(joinedAt)

		members = append(members, &member)
	}

	group.Members = members
	return &group, nil
}

func (r *GroupRepository) UpdateGroup(groupID, name, description, currency string) (*groupv1.Group, error) {
	now := time.Now()
	_, err := r.db.Exec(`
		UPDATE groups 
		SET name = $1, description = $2, currency = $3, updated_at = $4
		WHERE id = $5
	`, name, description, currency, now, groupID)
	if err != nil {
		return nil, err
	}

	return r.GetGroupByID(groupID)
}

func (r *GroupRepository) DeleteGroup(groupID string) error {
	_, err := r.db.Exec("DELETE FROM groups WHERE id = $1", groupID)
	return err
}

func (r *GroupRepository) AddMember(groupID, memberName, memberEmail string) (*groupv1.Member, error) {
	memberID := uuid.New().String()
	now := time.Now()

	_, err := r.db.Exec(`
		INSERT INTO members (id, group_id, name, email, joined_at)
		VALUES ($1, $2, $3, $4, $5)
	`, memberID, groupID, memberName, memberEmail, now)
	if err != nil {
		return nil, err
	}

	return &groupv1.Member{
		Id:       memberID,
		Name:     memberName,
		Email:    memberEmail,
		JoinedAt: timestamppb.New(now),
	}, nil
}

func (r *GroupRepository) RemoveMember(groupID, memberID string) error {
	_, err := r.db.Exec(`
		DELETE FROM members 
		WHERE id = $1 AND group_id = $2
	`, memberID, groupID)
	return err
}
