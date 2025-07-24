package store

import (
	"database/sql"
	"fmt"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

type Storage struct {
	Users interface {
		Create(*User) error
		GetBySub(sub string) (*User, error)
	}
}

func NewUserStore(dbUrl string, token []byte) (*Storage, error) {
	authToken := string(token)
	url := fmt.Sprintf("%s?authToken=%s", dbUrl, authToken)

	db, err := sql.Open("libsql", url)
	if err != nil {
		fmt.Printf("failed to open db %s: %s", url, err)
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}

	store := &Storage{
		Users: &UserStore{
			db: db,
		},
	}

	return store, nil
}
