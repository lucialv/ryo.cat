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
		GetByID(userID string) (*User, error)
		UsernameExists(username string) (bool, error)
		UpdateUserName(userID, userName string) error
		UpdateProfilePicture(userID string, profilePictureURL *string) error
	}
	Posts interface {
		CreatePost(*Post) error
		AddMediaToPost(postID string, media []PostMedia) error
		GetPostByID(postID string) (*Post, error)
		GetPostByIDWithUserContext(postID, currentUserID string) (*Post, error)
		GetAllPosts(limit, offset int) ([]Post, error)
		GetAllPostsWithUserContext(limit, offset int, currentUserID string) ([]Post, error)
		GetPostsByUserID(userID string, limit, offset int) ([]Post, error)
		GetPostsByUserIDWithUserContext(userID string, limit, offset int, currentUserID string) ([]Post, error)
		DeletePost(postID string) error
		GetPostMediaByID(mediaID string) (*PostMedia, error)
		ToggleLike(postID, userID string) (bool, error)
		GetLikeCount(postID string) (int, error)
		IsLikedByUser(postID, userID string) (bool, error)
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
		Posts: &PostStore{
			db: db,
		},
	}

	return store, nil
}
