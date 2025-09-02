package validator

import (
	"strings"
	"testing"
)

func TestValidateGroupName(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantErr  bool
		errField string
	}{
		{
			name:    "valid name",
			input:   "テストグループ",
			wantErr: false,
		},
		{
			name:     "empty name",
			input:    "",
			wantErr:  true,
			errField: "name",
		},
		{
			name:     "whitespace only name",
			input:    "   ",
			wantErr:  true,
			errField: "name",
		},
		{
			name:     "too long name",
			input:    strings.Repeat("あ", 101),
			wantErr:  true,
			errField: "name",
		},
		{
			name:     "dangerous characters",
			input:    "テスト<script>alert('xss')</script>",
			wantErr:  true,
			errField: "name",
		},
		{
			name:    "valid name with spaces",
			input:   "  有効な名前  ",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateGroupName(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateGroupName() error = %v, wantErr %v", err, tt.wantErr)
			}
			if err != nil && tt.errField != "" {
				if verr, ok := err.(ValidationError); ok {
					if verr.Field != tt.errField {
						t.Errorf("ValidateGroupName() error field = %v, want %v", verr.Field, tt.errField)
					}
				}
			}
		})
	}
}

func TestValidateDescription(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantErr  bool
		errField string
	}{
		{
			name:    "valid description",
			input:   "テストの説明です",
			wantErr: false,
		},
		{
			name:    "empty description",
			input:   "",
			wantErr: false, // 説明は任意
		},
		{
			name:     "too long description",
			input:    strings.Repeat("あ", 501),
			wantErr:  true,
			errField: "description",
		},
		{
			name:     "dangerous characters",
			input:    "説明<script>alert('xss')</script>",
			wantErr:  true,
			errField: "description",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDescription(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateDescription() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateCurrency(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantErr  bool
		errField string
	}{
		{
			name:    "valid JPY",
			input:   "JPY",
			wantErr: false,
		},
		{
			name:    "valid USD lowercase",
			input:   "usd",
			wantErr: false,
		},
		{
			name:     "empty currency",
			input:    "",
			wantErr:  true,
			errField: "currency",
		},
		{
			name:     "invalid currency",
			input:    "XXX",
			wantErr:  true,
			errField: "currency",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCurrency(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateCurrency() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateMemberNames(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		wantErr  bool
		errField string
	}{
		{
			name:    "valid member names",
			input:   []string{"Alice", "Bob", "Carol"},
			wantErr: false,
		},
		{
			name:     "empty list",
			input:    []string{},
			wantErr:  true,
			errField: "memberNames",
		},
		{
			name:     "empty member name",
			input:    []string{"Alice", "", "Carol"},
			wantErr:  true,
			errField: "memberNames",
		},
		{
			name:     "duplicate names",
			input:    []string{"Alice", "alice", "Bob"},
			wantErr:  true,
			errField: "memberNames",
		},
		{
			name:     "too many members",
			input:    make([]string, 51),
			wantErr:  true,
			errField: "memberNames",
		},
		{
			name:     "too long member name",
			input:    []string{strings.Repeat("あ", 51)},
			wantErr:  true,
			errField: "memberNames",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// too many membersテストのために名前を埋める
			if len(tt.input) == 51 && tt.input[0] == "" {
				for i := range tt.input {
					tt.input[i] = "Member" + string(rune('A'+i%26))
				}
			}

			err := ValidateMemberNames(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateMemberNames() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateExpenseAmount(t *testing.T) {
	tests := []struct {
		name     string
		input    int64
		wantErr  bool
		errField string
	}{
		{
			name:    "valid amount",
			input:   1000,
			wantErr: false,
		},
		{
			name:    "minimum amount",
			input:   1,
			wantErr: false,
		},
		{
			name:    "maximum amount",
			input:   MaxExpenseAmount,
			wantErr: false,
		},
		{
			name:     "zero amount",
			input:    0,
			wantErr:  true,
			errField: "amount",
		},
		{
			name:     "negative amount",
			input:    -100,
			wantErr:  true,
			errField: "amount",
		},
		{
			name:     "too large amount",
			input:    MaxExpenseAmount + 1,
			wantErr:  true,
			errField: "amount",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateExpenseAmount(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateExpenseAmount() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateExpenseDescription(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantErr  bool
		errField string
	}{
		{
			name:    "valid description",
			input:   "ランチ代",
			wantErr: false,
		},
		{
			name:     "empty description",
			input:    "",
			wantErr:  true,
			errField: "description",
		},
		{
			name:     "whitespace only description",
			input:    "   ",
			wantErr:  true,
			errField: "description",
		},
		{
			name:     "too long description",
			input:    strings.Repeat("あ", 201),
			wantErr:  true,
			errField: "description",
		},
		{
			name:     "dangerous characters",
			input:    "ランチ<script>alert('xss')</script>",
			wantErr:  true,
			errField: "description",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateExpenseDescription(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateExpenseDescription() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateUUID(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantErr  bool
		errField string
	}{
		{
			name:    "valid UUID",
			input:   "123e4567-e89b-12d3-a456-426614174000",
			wantErr: false,
		},
		{
			name:    "valid UUID v4",
			input:   "550e8400-e29b-41d4-a716-446655440000",
			wantErr: false,
		},
		{
			name:     "empty UUID",
			input:    "",
			wantErr:  true,
			errField: "id",
		},
		{
			name:     "invalid format",
			input:    "not-a-uuid",
			wantErr:  true,
			errField: "id",
		},
		{
			name:     "wrong format - missing dashes",
			input:    "123e4567e89b41d4a716446655440000",
			wantErr:  true,
			errField: "id",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateUUID(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateUUID() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateSplitMemberIds(t *testing.T) {
	validUUID1 := "123e4567-e89b-41d4-a456-426614174000"
	validUUID2 := "550e8400-e29b-41d4-a716-446655440000"
	invalidUUID := "not-a-uuid"

	tests := []struct {
		name     string
		input    []string
		wantErr  bool
		errField string
	}{
		{
			name:    "valid member IDs",
			input:   []string{validUUID1, validUUID2},
			wantErr: false,
		},
		{
			name:     "empty list",
			input:    []string{},
			wantErr:  true,
			errField: "splitMemberIds",
		},
		{
			name:     "invalid UUID",
			input:    []string{validUUID1, invalidUUID},
			wantErr:  true,
			errField: "splitMemberIds",
		},
		{
			name:     "duplicate IDs",
			input:    []string{validUUID1, validUUID1},
			wantErr:  true,
			errField: "splitMemberIds",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSplitMemberIds(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSplitMemberIds() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}