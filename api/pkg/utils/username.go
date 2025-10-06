package utils

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

const (
	UsernameMinLength = 3
	UsernameMaxLength = 15
)

var (
	reDisallowed = regexp.MustCompile(`[^a-z0-9._-]+`)

	reservedUsernames = map[string]struct{}{
		"admin":   {},
		"root":    {},
		"support": {},
		"system":  {},
		"api":     {},
		"null":    {},
		"me":      {},
	}
)

func SanitizeUsername(raw string) string {
	if raw == "" {
		return ""
	}

	s := strings.ToLower(raw)
	s = reDisallowed.ReplaceAllString(s, "")
	s = strings.Trim(s, "._-")

	if len(s) > UsernameMaxLength {
		s = s[:UsernameMaxLength]
	}

	return s
}

func ValidateUsername(username string) error {
	if username == "" {
		return errors.New("username cannot be empty")
	}

	if len(username) < UsernameMinLength {
		return fmt.Errorf("username must be at least %d characters", UsernameMinLength)
	}
	if len(username) > UsernameMaxLength {
		return fmt.Errorf("username must be at most %d characters", UsernameMaxLength)
	}

	if strings.HasPrefix(username, ".") ||
		strings.HasPrefix(username, "_") ||
		strings.HasPrefix(username, "-") ||
		strings.HasSuffix(username, ".") ||
		strings.HasSuffix(username, "_") ||
		strings.HasSuffix(username, "-") {
		return errors.New("username cannot start or end with a separator (., _, -)")
	}

	for _, r := range username {
		if (r >= 'a' && r <= 'z') ||
			(r >= '0' && r <= '9') ||
			r == '.' || r == '_' || r == '-' {
			continue
		}
		return fmt.Errorf("invalid character '%c' in username", r)
	}

	if _, found := reservedUsernames[username]; found {
		return errors.New("username is reserved")
	}

	return nil
}

func SanitizeAndValidateUsername(raw string) (string, error) {
	s := SanitizeUsername(raw)
	if err := ValidateUsername(s); err != nil {
		return "", err
	}
	return s, nil
}
