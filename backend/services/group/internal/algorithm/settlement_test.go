package algorithm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCalculateOptimalSettlements(t *testing.T) {
	tests := []struct {
		name      string
		balances  []Balance
		want      []Settlement
		wantError bool
	}{
		{
			name:     "empty balances",
			balances: []Balance{},
			want:     []Settlement{},
		},
		{
			name: "all zero balances",
			balances: []Balance{
				{MemberID: "1", Amount: 0, Name: "Alice"},
				{MemberID: "2", Amount: 0, Name: "Bob"},
			},
			want: []Settlement{},
		},
		{
			name: "simple two-person settlement",
			balances: []Balance{
				{MemberID: "1", Amount: 1000, Name: "Alice"}, // Alice is owed 1000
				{MemberID: "2", Amount: -1000, Name: "Bob"},  // Bob owes 1000
			},
			want: []Settlement{
				{FromMemberID: "2", ToMemberID: "1", Amount: 1000, FromName: "Bob", ToName: "Alice"},
			},
		},
		{
			name: "three-person optimal settlement",
			balances: []Balance{
				{MemberID: "1", Amount: 2000, Name: "Alice"},  // Alice is owed 2000
				{MemberID: "2", Amount: -1000, Name: "Bob"},   // Bob owes 1000
				{MemberID: "3", Amount: -1000, Name: "Carol"}, // Carol owes 1000
			},
			want: []Settlement{
				{FromMemberID: "2", ToMemberID: "1", Amount: 1000, FromName: "Bob", ToName: "Alice"},
				{FromMemberID: "3", ToMemberID: "1", Amount: 1000, FromName: "Carol", ToName: "Alice"},
			},
		},
		{
			name: "complex four-person settlement",
			balances: []Balance{
				{MemberID: "1", Amount: 3000, Name: "Alice"},  // Alice is owed 3000
				{MemberID: "2", Amount: 1000, Name: "Bob"},    // Bob is owed 1000
				{MemberID: "3", Amount: -2000, Name: "Carol"}, // Carol owes 2000
				{MemberID: "4", Amount: -2000, Name: "Dave"},  // Dave owes 2000
			},
			// Note: The exact settlements may vary, but should be minimal and correct
			want: nil, // We'll verify correctness instead of exact settlements
		},
		{
			name: "unbalanced total should return error",
			balances: []Balance{
				{MemberID: "1", Amount: 1000, Name: "Alice"},
				{MemberID: "2", Amount: -500, Name: "Bob"}, // Total is 500, not 0
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := CalculateOptimalSettlements(tt.balances)

			if tt.wantError {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)

			// For complex cases, verify correctness instead of exact settlements
			if tt.want == nil {
				// Verify that the settlements correctly balance all accounts
				balanceAfter := make(map[string]int64)
				for _, balance := range tt.balances {
					balanceAfter[balance.MemberID] = balance.Amount
				}

				for _, settlement := range got {
					// FromMemberID pays money (debt decreases, moves toward 0)
					balanceAfter[settlement.FromMemberID] += settlement.Amount
					// ToMemberID receives money (credit decreases, moves toward 0)
					balanceAfter[settlement.ToMemberID] -= settlement.Amount
				}

				// All balances should be zero after settlements
				for memberID, finalBalance := range balanceAfter {
					assert.Equal(t, int64(0), finalBalance, "Member %s should have zero balance after settlements", memberID)
				}
				return
			}

			assert.Equal(t, len(tt.want), len(got))

			// Check that all expected settlements are present (order may vary)
			for _, wantSettlement := range tt.want {
				found := false
				for _, gotSettlement := range got {
					if wantSettlement.FromMemberID == gotSettlement.FromMemberID &&
						wantSettlement.ToMemberID == gotSettlement.ToMemberID &&
						wantSettlement.Amount == gotSettlement.Amount {
						found = true
						break
					}
				}
				assert.True(t, found, "Expected settlement not found: %+v", wantSettlement)
			}
		})
	}
}

func TestCalculateMemberBalances(t *testing.T) {
	tests := []struct {
		name     string
		expenses []Expense
		members  []Member
		want     []Balance
	}{
		{
			name:     "no expenses",
			expenses: []Expense{},
			members: []Member{
				{ID: "1", Name: "Alice"},
				{ID: "2", Name: "Bob"},
			},
			want: []Balance{
				{MemberID: "1", Amount: 0, Name: "Alice"},
				{MemberID: "2", Amount: 0, Name: "Bob"},
			},
		},
		{
			name: "single expense split equally",
			expenses: []Expense{
				{
					ID:           "exp1",
					PayerID:      "1",
					Amount:       2000,
					SplitBetween: []string{"1", "2"},
				},
			},
			members: []Member{
				{ID: "1", Name: "Alice"},
				{ID: "2", Name: "Bob"},
			},
			want: []Balance{
				{MemberID: "1", Amount: 1000, Name: "Alice"}, // Paid 2000, owes 1000
				{MemberID: "2", Amount: -1000, Name: "Bob"},  // Paid 0, owes 1000
			},
		},
		{
			name: "multiple expenses complex scenario",
			expenses: []Expense{
				{
					ID:           "exp1",
					PayerID:      "1",
					Amount:       3000,
					SplitBetween: []string{"1", "2", "3"}, // 1000 each
				},
				{
					ID:           "exp2",
					PayerID:      "2",
					Amount:       1500,
					SplitBetween: []string{"1", "2"}, // 750 each
				},
			},
			members: []Member{
				{ID: "1", Name: "Alice"},
				{ID: "2", Name: "Bob"},
				{ID: "3", Name: "Carol"},
			},
			want: []Balance{
				{MemberID: "1", Amount: 1250, Name: "Alice"},  // Paid 3000, owes 1750 (1000+750)
				{MemberID: "2", Amount: -250, Name: "Bob"},    // Paid 1500, owes 1750 (1000+750)
				{MemberID: "3", Amount: -1000, Name: "Carol"}, // Paid 0, owes 1000
			},
		},
		{
			name: "odd amount with remainder distribution",
			expenses: []Expense{
				{
					ID:           "exp1",
					PayerID:      "1",
					Amount:       1001,                    // Cannot be split equally among 3
					SplitBetween: []string{"1", "2", "3"}, // 334, 334, 333
				},
			},
			members: []Member{
				{ID: "1", Name: "Alice"},
				{ID: "2", Name: "Bob"},
				{ID: "3", Name: "Carol"},
			},
			want: []Balance{
				{MemberID: "1", Amount: 667, Name: "Alice"},  // Paid 1001, owes 334
				{MemberID: "2", Amount: -334, Name: "Bob"},   // Paid 0, owes 334
				{MemberID: "3", Amount: -333, Name: "Carol"}, // Paid 0, owes 333
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateMemberBalances(tt.expenses, tt.members)

			assert.Equal(t, len(tt.want), len(got))

			// Convert to map for easier comparison (order doesn't matter)
			gotMap := make(map[string]Balance)
			for _, balance := range got {
				gotMap[balance.MemberID] = balance
			}

			for _, wantBalance := range tt.want {
				gotBalance, exists := gotMap[wantBalance.MemberID]
				assert.True(t, exists, "Member %s not found in result", wantBalance.MemberID)
				assert.Equal(t, wantBalance.Amount, gotBalance.Amount, "Amount mismatch for member %s", wantBalance.MemberID)
				assert.Equal(t, wantBalance.Name, gotBalance.Name, "Name mismatch for member %s", wantBalance.MemberID)
			}
		})
	}
}

func TestSettlementAlgorithmProperties(t *testing.T) {
	t.Run("algorithm produces minimal settlements", func(t *testing.T) {
		// Test case where greedy algorithm should produce optimal result
		balances := []Balance{
			{MemberID: "1", Amount: 5000, Name: "Alice"},
			{MemberID: "2", Amount: 3000, Name: "Bob"},
			{MemberID: "3", Amount: -4000, Name: "Carol"},
			{MemberID: "4", Amount: -4000, Name: "Dave"},
		}

		settlements, err := CalculateOptimalSettlements(balances)
		assert.NoError(t, err)

		// Should be able to settle with 3 transactions (n-1 where n=4)
		// This is optimal for this configuration
		assert.LessOrEqual(t, len(settlements), 3)

		// Verify all settlements result in zero balances
		balanceAfter := make(map[string]int64)
		for _, balance := range balances {
			balanceAfter[balance.MemberID] = balance.Amount
		}

		for _, settlement := range settlements {
			// FromMemberID pays money (debt decreases, moves toward 0)
			balanceAfter[settlement.FromMemberID] += settlement.Amount
			// ToMemberID receives money (credit decreases, moves toward 0)
			balanceAfter[settlement.ToMemberID] -= settlement.Amount
		}

		for memberID, finalAmount := range balanceAfter {
			assert.Equal(t, int64(0), finalAmount, "Member %s should have zero balance after settlements", memberID)
		}
	})
}
