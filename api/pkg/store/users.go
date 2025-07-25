package store

import (
	"database/sql"
	"time"
)

type User struct {
	ID                string    `json:"id"`
	Sub               string    `json:"sub"`
	Verified          bool      `json:"verified"`
	Name              string    `json:"name"`
	Email             string    `json:"email"`
	IsAdmin           bool      `json:"isAdmin"`
	ProfilePictureURL *string   `json:"profilePictureUrl,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
}

type UserStore struct {
	db *sql.DB
}

func NewUser(sub string, name string, email string, verified bool) *User {
	return &User{
		Sub:       sub,
		Verified:  verified,
		Name:      name,
		Email:     email,
		IsAdmin:   false,
		CreatedAt: time.Now().UTC(),
	}
}

func (s *UserStore) Create(user *User) error {
	const q = `
    INSERT INTO users (sub, verified, name, email, is_admin, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id;
    `
	return s.db.
		QueryRow(
			q,
			user.Sub,
			user.Verified,
			user.Name,
			user.Email,
			user.IsAdmin,
			user.CreatedAt,
		).
		Scan(&user.ID)
}

func (s *UserStore) GetBySub(sub string) (*User, error) {
	const q = `
    SELECT id, sub, verified, name, email, is_admin, profile_picture_url, created_at
      FROM users
     WHERE sub = ?
    `
	u := new(User)
	err := s.db.QueryRow(q, sub).Scan(
		&u.ID,
		&u.Sub,
		&u.Verified,
		&u.Name,
		&u.Email,
		&u.IsAdmin,
		&u.ProfilePictureURL,
		&u.CreatedAt,
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

func (s *UserStore) GetByID(userID string) (*User, error) {
	const q = `
		SELECT id, sub, verified, name, email, is_admin, profile_picture_url, created_at
		FROM users
		WHERE id = ?
	`
	u := new(User)
	err := s.db.QueryRow(q, userID).Scan(
		&u.ID,
		&u.Sub,
		&u.Verified,
		&u.Name,
		&u.Email,
		&u.IsAdmin,
		&u.ProfilePictureURL,
		&u.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
