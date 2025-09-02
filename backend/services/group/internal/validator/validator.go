package validator

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

const (
	MaxGroupNameLength    = 100
	MaxDescriptionLength  = 500
	MaxMemberNameLength   = 50
	MaxExpenseDescription = 200
	MinExpenseAmount      = 1
	MaxExpenseAmount      = 999999999 // 9億円まで
	MaxMembersPerGroup    = 50
)

var (
	// 有効な通貨コード
	validCurrencies = map[string]bool{
		"JPY": true,
		"USD": true,
		"EUR": true,
		"GBP": true,
		"CNY": true,
		"KRW": true,
	}

	// 危険な文字をチェックする正規表現
	dangerousCharsRegex = regexp.MustCompile(`[<>\"'&]`)
)

// ValidationError は検証エラーを表す
type ValidationError struct {
	Field   string
	Message string
}

func (v ValidationError) Error() string {
	return v.Field + ": " + v.Message
}

// ValidateGroupName グループ名を検証
func ValidateGroupName(name string) error {
	name = strings.TrimSpace(name)
	
	if name == "" {
		return ValidationError{Field: "name", Message: "グループ名は必須です"}
	}
	
	if utf8.RuneCountInString(name) > MaxGroupNameLength {
		return ValidationError{Field: "name", Message: "グループ名は100文字以内で入力してください"}
	}
	
	if dangerousCharsRegex.MatchString(name) {
		return ValidationError{Field: "name", Message: "グループ名に使用できない文字が含まれています"}
	}
	
	return nil
}

// ValidateDescription 説明を検証
func ValidateDescription(description string) error {
	if description == "" {
		return nil // 説明は任意
	}
	
	description = strings.TrimSpace(description)
	
	if utf8.RuneCountInString(description) > MaxDescriptionLength {
		return ValidationError{Field: "description", Message: "説明は500文字以内で入力してください"}
	}
	
	if dangerousCharsRegex.MatchString(description) {
		return ValidationError{Field: "description", Message: "説明に使用できない文字が含まれています"}
	}
	
	return nil
}

// ValidateCurrency 通貨を検証
func ValidateCurrency(currency string) error {
	if currency == "" {
		return ValidationError{Field: "currency", Message: "通貨は必須です"}
	}
	
	currency = strings.ToUpper(strings.TrimSpace(currency))
	
	if !validCurrencies[currency] {
		return ValidationError{Field: "currency", Message: "サポートされていない通貨です"}
	}
	
	return nil
}

// ValidateMemberNames メンバー名一覧を検証
func ValidateMemberNames(memberNames []string) error {
	if len(memberNames) == 0 {
		return ValidationError{Field: "memberNames", Message: "少なくとも1人のメンバーが必要です"}
	}
	
	if len(memberNames) > MaxMembersPerGroup {
		return ValidationError{Field: "memberNames", Message: "メンバーは50人まで登録可能です"}
	}
	
	seenNames := make(map[string]bool)
	
	for i, name := range memberNames {
		name = strings.TrimSpace(name)
		
		if name == "" {
			return ValidationError{Field: "memberNames", Message: "空のメンバー名は許可されていません"}
		}
		
		if utf8.RuneCountInString(name) > MaxMemberNameLength {
			return ValidationError{Field: "memberNames", Message: "メンバー名は50文字以内で入力してください"}
		}
		
		if dangerousCharsRegex.MatchString(name) {
			return ValidationError{Field: "memberNames", Message: "メンバー名に使用できない文字が含まれています"}
		}
		
		// 重複チェック（大文字小文字を区別せず）
		lowerName := strings.ToLower(name)
		if seenNames[lowerName] {
			return ValidationError{Field: "memberNames", Message: "重複するメンバー名があります: " + name}
		}
		seenNames[lowerName] = true
		
		// インデックスを使った詳細なエラー報告
		_ = i // 必要に応じて使用
	}
	
	return nil
}

// ValidateMemberName 単一のメンバー名を検証
func ValidateMemberName(name string) error {
	name = strings.TrimSpace(name)
	
	if name == "" {
		return ValidationError{Field: "memberName", Message: "メンバー名は必須です"}
	}
	
	if utf8.RuneCountInString(name) > MaxMemberNameLength {
		return ValidationError{Field: "memberName", Message: "メンバー名は50文字以内で入力してください"}
	}
	
	if dangerousCharsRegex.MatchString(name) {
		return ValidationError{Field: "memberName", Message: "メンバー名に使用できない文字が含まれています"}
	}
	
	return nil
}

// ValidateExpenseAmount 支払い金額を検証
func ValidateExpenseAmount(amount int64) error {
	if amount < MinExpenseAmount {
		return ValidationError{Field: "amount", Message: "金額は1円以上で入力してください"}
	}
	
	if amount > MaxExpenseAmount {
		return ValidationError{Field: "amount", Message: "金額が大きすぎます（上限: 9億円）"}
	}
	
	return nil
}

// ValidateExpenseDescription 支払い説明を検証
func ValidateExpenseDescription(description string) error {
	description = strings.TrimSpace(description)
	
	if description == "" {
		return ValidationError{Field: "description", Message: "支払いの説明は必須です"}
	}
	
	if utf8.RuneCountInString(description) > MaxExpenseDescription {
		return ValidationError{Field: "description", Message: "支払いの説明は200文字以内で入力してください"}
	}
	
	if dangerousCharsRegex.MatchString(description) {
		return ValidationError{Field: "description", Message: "支払いの説明に使用できない文字が含まれています"}
	}
	
	return nil
}

// ValidateUUID UUIDの形式を検証
func ValidateUUID(id string) error {
	if id == "" {
		return ValidationError{Field: "id", Message: "IDは必須です"}
	}
	
	// UUID全般の正規表現（バージョンチェックを緩和）
	uuidRegex := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	if !uuidRegex.MatchString(strings.ToLower(id)) {
		return ValidationError{Field: "id", Message: "無効なID形式です"}
	}
	
	return nil
}

// ValidateSplitMemberIds 割り勘対象メンバーIDsを検証
func ValidateSplitMemberIds(memberIds []string) error {
	if len(memberIds) == 0 {
		return ValidationError{Field: "splitMemberIds", Message: "割り勘対象者は必須です"}
	}
	
	if len(memberIds) > MaxMembersPerGroup {
		return ValidationError{Field: "splitMemberIds", Message: "割り勘対象者が多すぎます"}
	}
	
	seenIds := make(map[string]bool)
	
	for _, id := range memberIds {
		if err := ValidateUUID(id); err != nil {
			return ValidationError{Field: "splitMemberIds", Message: "無効なメンバーIDが含まれています"}
		}
		
		// 重複チェック
		if seenIds[id] {
			return ValidationError{Field: "splitMemberIds", Message: "重複するメンバーIDがあります"}
		}
		seenIds[id] = true
	}
	
	return nil
}