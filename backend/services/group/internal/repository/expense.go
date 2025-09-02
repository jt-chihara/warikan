package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/jt-chihara/warikan/services/group/internal/domain"
)

type ExpenseRepository interface {
	Create(ctx context.Context, expense *domain.Expense) error
	Update(ctx context.Context, expense *domain.Expense) error
	FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Expense, error)
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Expense, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type expenseRepository struct {
	db *sql.DB
}

func NewExpenseRepository(db *sql.DB) ExpenseRepository {
	return &expenseRepository{db: db}
}

func (r *expenseRepository) Create(ctx context.Context, expense *domain.Expense) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert expense
	query := `
		INSERT INTO expenses (id, group_id, amount, description, currency, paid_by_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err = tx.ExecContext(ctx, query,
		expense.ID,
		expense.GroupID,
		expense.Amount,
		expense.Description,
		expense.Currency,
		expense.PaidByID,
		expense.CreatedAt,
		expense.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert expense: %w", err)
	}

	// Insert expense splits
	if len(expense.SplitMembers) > 0 {
		splitQuery := `
			INSERT INTO expense_splits (expense_id, member_id, amount)
			VALUES ($1, $2, $3)`

		for _, split := range expense.SplitMembers {
			_, err = tx.ExecContext(ctx, splitQuery,
				expense.ID,
				split.MemberID,
				split.Amount,
			)
			if err != nil {
				return fmt.Errorf("failed to insert expense split: %w", err)
			}
		}
	}

	return tx.Commit()
}

func (r *expenseRepository) Update(ctx context.Context, expense *domain.Expense) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Update expense
	query := `
		UPDATE expenses 
		SET amount = $2, description = $3, paid_by_id = $4, updated_at = $5
		WHERE id = $1`

	result, err := tx.ExecContext(ctx, query,
		expense.ID,
		expense.Amount,
		expense.Description,
		expense.PaidByID,
		expense.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update expense: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return domain.ErrExpenseNotFound
	}

	// Delete existing expense splits
	deleteQuery := `DELETE FROM expense_splits WHERE expense_id = $1`
	_, err = tx.ExecContext(ctx, deleteQuery, expense.ID)
	if err != nil {
		return fmt.Errorf("failed to delete expense splits: %w", err)
	}

	// Insert new expense splits
	if len(expense.SplitMembers) > 0 {
		splitQuery := `
			INSERT INTO expense_splits (expense_id, member_id, amount)
			VALUES ($1, $2, $3)`

		for _, split := range expense.SplitMembers {
			_, err = tx.ExecContext(ctx, splitQuery,
				expense.ID,
				split.MemberID,
				split.Amount,
			)
			if err != nil {
				return fmt.Errorf("failed to insert expense split: %w", err)
			}
		}
	}

	return tx.Commit()
}

func (r *expenseRepository) FindByGroupID(ctx context.Context, groupID uuid.UUID) ([]*domain.Expense, error) {
	query := `
		SELECT e.id, e.group_id, e.amount, e.description, e.currency, e.paid_by_id, 
		       e.created_at, e.updated_at,
		       m.name as paid_by_name
		FROM expenses e
		JOIN members m ON e.paid_by_id = m.id
		WHERE e.group_id = $1
		ORDER BY e.created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, groupID)
	if err != nil {
		return nil, fmt.Errorf("failed to query expenses: %w", err)
	}
	defer rows.Close()

	var expenses []*domain.Expense
	for rows.Next() {
		var expense domain.Expense
		err := rows.Scan(
			&expense.ID,
			&expense.GroupID,
			&expense.Amount,
			&expense.Description,
			&expense.Currency,
			&expense.PaidByID,
			&expense.CreatedAt,
			&expense.UpdatedAt,
			&expense.PaidByName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan expense: %w", err)
		}

		// Load split members
		splits, err := r.findSplitMembers(ctx, expense.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to load split members for expense %s: %w", expense.ID, err)
		}
		expense.SplitMembers = splits

		expenses = append(expenses, &expense)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during row iteration: %w", err)
	}

	return expenses, nil
}

func (r *expenseRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Expense, error) {
	query := `
		SELECT e.id, e.group_id, e.amount, e.description, e.currency, e.paid_by_id, 
		       e.created_at, e.updated_at,
		       m.name as paid_by_name
		FROM expenses e
		JOIN members m ON e.paid_by_id = m.id
		WHERE e.id = $1`

	var expense domain.Expense
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&expense.ID,
		&expense.GroupID,
		&expense.Amount,
		&expense.Description,
		&expense.Currency,
		&expense.PaidByID,
		&expense.CreatedAt,
		&expense.UpdatedAt,
		&expense.PaidByName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrExpenseNotFound
		}
		return nil, fmt.Errorf("failed to query expense: %w", err)
	}

	// Load split members
	splits, err := r.findSplitMembers(ctx, expense.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to load split members: %w", err)
	}
	expense.SplitMembers = splits

	return &expense, nil
}

func (r *expenseRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete expense splits first (foreign key constraint)
	splitQuery := `DELETE FROM expense_splits WHERE expense_id = $1`
	_, err = tx.ExecContext(ctx, splitQuery, id)
	if err != nil {
		return fmt.Errorf("failed to delete expense splits: %w", err)
	}

	// Delete expense
	expenseQuery := `DELETE FROM expenses WHERE id = $1`
	result, err := tx.ExecContext(ctx, expenseQuery, id)
	if err != nil {
		return fmt.Errorf("failed to delete expense: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return domain.ErrExpenseNotFound
	}

	return tx.Commit()
}

func (r *expenseRepository) findSplitMembers(ctx context.Context, expenseID uuid.UUID) ([]domain.SplitMember, error) {
	query := `
		SELECT es.member_id, es.amount, m.name
		FROM expense_splits es
		JOIN members m ON es.member_id = m.id
		WHERE es.expense_id = $1
		ORDER BY m.name`

	rows, err := r.db.QueryContext(ctx, query, expenseID)
	if err != nil {
		return nil, fmt.Errorf("failed to query split members: %w", err)
	}
	defer rows.Close()

	var splits []domain.SplitMember
	for rows.Next() {
		var split domain.SplitMember
		err := rows.Scan(&split.MemberID, &split.Amount, &split.MemberName)
		if err != nil {
			return nil, fmt.Errorf("failed to scan split member: %w", err)
		}
		splits = append(splits, split)
	}

	return splits, rows.Err()
}
