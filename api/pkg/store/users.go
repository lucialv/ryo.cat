package store

import (
	"database/sql"
	"time"
)

type User struct {
	ID                string  `json:"id"`
	Sub               string  `json:"sub"`
	Verified          bool    `json:"verified"`
	UserName          string  `json:"username"`
	Name              string  `json:"name"`
	Email             string  `json:"email"`
	IsAdmin           bool    `json:"isAdmin"`
	ProfilePictureURL *string `json:"profilePictureUrl,omitempty"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

type UserStore struct {
	db *sql.DB
}

func NewUser(sub string, verified bool, username string, name string, email string) *User {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	return &User{
		Sub:       sub,
		Verified:  verified,
		UserName:  username,
		Name:      name,
		Email:     email,
		IsAdmin:   false,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func (s *UserStore) Create(user *User) error {
	const q = `
    INSERT INTO users (sub, verified, username, name, email, is_admin, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id;
    `
	return s.db.
		QueryRow(
			q,
			user.Sub,
			user.Verified,
			user.UserName,
			user.Name,
			user.Email,
			user.IsAdmin,
			user.CreatedAt,
			user.UpdatedAt,
		).
		Scan(&user.ID)
}

func (s *UserStore) GetBySub(sub string) (*User, error) {
	const q = `
    SELECT id, sub, verified, username, name, email, is_admin, profile_picture_url, created_at, updated_at
      FROM users
     WHERE sub = ?
    `
	u := new(User)
	err := s.db.QueryRow(q, sub).Scan(
		&u.ID,
		&u.Sub,
		&u.Verified,
		&u.UserName,
		&u.Name,
		&u.Email,
		&u.IsAdmin,
		&u.ProfilePictureURL,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserStore) UpdateProfilePicture(userID string, profilePictureURL *string) error {
	const q = `
		UPDATE users
		SET profile_picture_url = ?
		WHERE id = ?
	`
	_, err := s.db.Exec(q, profilePictureURL, userID)
	return err
}

func (s *UserStore) UpdateUserName(userID string, username string) error {
	const q = `
		UPDATE users
		SET username = ?
		WHERE id = ?
	`
	_, err := s.db.Exec(q, username, userID)
	return err
}

func (s *UserStore) GetByID(userID string) (*User, error) {
	const q = `
		SELECT id, sub, verified, username, name, email, is_admin, profile_picture_url, created_at, updated_at
		FROM users
		WHERE id = ?
	`
	u := new(User)
	err := s.db.QueryRow(q, userID).Scan(
		&u.ID,
		&u.Sub,
		&u.Verified,
		&u.UserName,
		&u.Name,
		&u.Email,
		&u.IsAdmin,
		&u.ProfilePictureURL,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserStore) UsernameExists(username string) (bool, error) {
	const q = `SELECT 1 FROM users WHERE username = ? LIMIT 1`
	var one int
	err := s.db.QueryRow(q, username).Scan(&one)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}
