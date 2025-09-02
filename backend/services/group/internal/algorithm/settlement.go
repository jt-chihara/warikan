package algorithm

import (
	"errors"
	"sort"
)

// Balance represents a member's balance (positive = owed money, negative = owes money)
type Balance struct {
	MemberID string
	Amount   int64 // Amount in cents (JPY)
	Name     string
}

// Settlement represents a payment from one member to another
type Settlement struct {
	FromMemberID string
	ToMemberID   string
	Amount       int64
	FromName     string
	ToName       string
}

// CalculateOptimalSettlements calculates the minimum number of settlements
// using a greedy algorithm that pairs largest creditor with largest debtor
func CalculateOptimalSettlements(balances []Balance) ([]Settlement, error) {
	if len(balances) == 0 {
		return []Settlement{}, nil
	}

	// Validate that total balance is zero
	var totalBalance int64
	for _, balance := range balances {
		totalBalance += balance.Amount
	}
	if totalBalance != 0 {
		return nil, errors.New("total balance is not zero")
	}

	// Filter out zero balances and copy to avoid modifying input
	activeBalances := make([]Balance, 0)
	for _, balance := range balances {
		if balance.Amount != 0 {
			activeBalances = append(activeBalances, balance)
		}
	}

	if len(activeBalances) == 0 {
		return []Settlement{}, nil
	}

	var settlements []Settlement

	for len(activeBalances) > 1 {
		// Sort by balance: creditors (positive) first, then debtors (negative)
		sort.Slice(activeBalances, func(i, j int) bool {
			return activeBalances[i].Amount > activeBalances[j].Amount
		})

		// Take the largest creditor and largest debtor
		creditorIdx := 0
		debtorIdx := len(activeBalances) - 1

		// If both are zero or same sign, we're done
		if activeBalances[creditorIdx].Amount <= 0 || activeBalances[debtorIdx].Amount >= 0 {
			break
		}

		creditor := &activeBalances[creditorIdx]
		debtor := &activeBalances[debtorIdx]

		// Calculate settlement amount (minimum of what creditor is owed and what debtor owes)
		settlementAmount := creditor.Amount
		if -debtor.Amount < creditor.Amount {
			settlementAmount = -debtor.Amount
		}

		// Create settlement
		settlement := Settlement{
			FromMemberID: debtor.MemberID,
			ToMemberID:   creditor.MemberID,
			Amount:       settlementAmount,
			FromName:     debtor.Name,
			ToName:       creditor.Name,
		}
		settlements = append(settlements, settlement)

		// Update balances in place using pointers
		creditor.Amount -= settlementAmount
		debtor.Amount += settlementAmount

		// Remove zero balances
		newBalances := make([]Balance, 0)
		for _, balance := range activeBalances {
			if balance.Amount != 0 {
				newBalances = append(newBalances, balance)
			}
		}
		activeBalances = newBalances
	}

	return settlements, nil
}

// CalculateMemberBalances calculates each member's balance from expenses
func CalculateMemberBalances(expenses []Expense, members []Member) []Balance {
	balances := make(map[string]Balance)

	// Initialize all members with zero balance
	for _, member := range members {
		balances[member.ID] = Balance{
			MemberID: member.ID,
			Amount:   0,
			Name:     member.Name,
		}
	}

	// Calculate balances from expenses
	for _, expense := range expenses {
		// Add amount paid by payer
		if payer, exists := balances[expense.PayerID]; exists {
			payer.Amount += expense.Amount
			balances[expense.PayerID] = payer
		}

		// Subtract each member's share
		sharePerMember := expense.Amount / int64(len(expense.SplitBetween))
		remainder := expense.Amount % int64(len(expense.SplitBetween))

		for i, memberID := range expense.SplitBetween {
			if member, exists := balances[memberID]; exists {
				share := sharePerMember
				// Distribute remainder among first few members
				if i < int(remainder) {
					share++
				}
				member.Amount -= share
				balances[memberID] = member
			}
		}
	}

	// Convert map to slice
	result := make([]Balance, 0, len(balances))
	for _, balance := range balances {
		result = append(result, balance)
	}

	return result
}

// Expense represents an expense record for balance calculation
type Expense struct {
	ID           string
	PayerID      string
	Amount       int64
	SplitBetween []string
}

// Member represents a group member for balance calculation
type Member struct {
	ID   string
	Name string
}
