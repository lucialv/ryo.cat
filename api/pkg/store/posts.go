package store

import (
	"database/sql"
	"time"
)

type Post struct {
	ID          string      `json:"id"`
	UserID      string      `json:"userId"`
	Body        string      `json:"body"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
	User        *User       `json:"user,omitempty"`
	Media       []PostMedia `json:"media,omitempty"`
	LikeCount   int         `json:"likeCount"`
	IsLikedByMe bool        `json:"isLikedByMe"`
}

type PostMedia struct {
	ID        string    `json:"id"`
	PostID    string    `json:"postId"`
	MediaURL  string    `json:"mediaUrl"`
	MediaType string    `json:"mediaType"`
	FileKey   string    `json:"fileKey"`
	FileSize  int64     `json:"fileSize"`
	MimeType  string    `json:"mimeType"`
	CreatedAt time.Time `json:"createdAt"`
}

type PostStore struct {
	db *sql.DB
}

func (s *PostStore) CreatePost(post *Post) error {
	const q = `
		INSERT INTO posts (user_id, body, created_at, updated_at)
		VALUES (?, ?, ?, ?)
		RETURNING id;
	`
	return s.db.QueryRow(
		q,
		post.UserID,
		post.Body,
		post.CreatedAt,
		post.UpdatedAt,
	).Scan(&post.ID)
}

func (s *PostStore) AddMediaToPost(postID string, media []PostMedia) error {
	if len(media) == 0 {
		return nil
	}

	const q = `
		INSERT INTO post_media (post_id, media_url, media_type, file_key, file_size, mime_type, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		RETURNING id;
	`

	for i, m := range media {
		err := s.db.QueryRow(
			q,
			postID,
			m.MediaURL,
			m.MediaType,
			m.FileKey,
			m.FileSize,
			m.MimeType,
			m.CreatedAt,
		).Scan(&media[i].ID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *PostStore) GetPostByID(postID string) (*Post, error) {
	return s.getPostByIDWithUserContext(postID, "")
}

func (s *PostStore) GetPostByIDWithUserContext(postID, currentUserID string) (*Post, error) {
	return s.getPostByIDWithUserContext(postID, currentUserID)
}

func (s *PostStore) getPostByIDWithUserContext(postID, currentUserID string) (*Post, error) {
	post, err := s.getPostByIDWithLikes(postID, currentUserID)
	if err != nil {
		return s.getPostByIDBasic(postID)
	}
	return post, nil
}

func (s *PostStore) getPostByIDWithLikes(postID, currentUserID string) (*Post, error) {
	const postQuery = `
		SELECT p.id, p.user_id, p.body, p.created_at, p.updated_at,
		       u.id, u.username, u.name, u.email, u.is_admin, u.profile_picture_url,
		       COALESCE(like_counts.count, 0) as like_count,
		       CASE WHEN user_likes.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked_by_me
		FROM posts p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN (
			SELECT post_id, COUNT(*) as count
			FROM post_likes
			GROUP BY post_id
		) like_counts ON p.id = like_counts.post_id
		LEFT JOIN post_likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = ?
		WHERE p.id = ?
	`

	post := &Post{}
	user := &User{}

	err := s.db.QueryRow(postQuery, currentUserID, postID).Scan(
		&post.ID,
		&post.UserID,
		&post.Body,
		&post.CreatedAt,
		&post.UpdatedAt,
		&user.ID,
		&user.UserName,
		&user.Name,
		&user.Email,
		&user.IsAdmin,
		&user.ProfilePictureURL,
		&post.LikeCount,
		&post.IsLikedByMe,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	post.User = user

	media, err := s.getMediaForPost(postID)
	if err != nil {
		return nil, err
	}
	post.Media = media

	return post, nil
}

func (s *PostStore) getPostByIDBasic(postID string) (*Post, error) {
	const postQuery = `
		SELECT p.id, p.user_id, p.body, p.created_at, p.updated_at,
		       u.id, u.username, u.name, u.email, u.is_admin, u.profile_picture_url
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = ?
	`

	post := &Post{}
	user := &User{}

	err := s.db.QueryRow(postQuery, postID).Scan(
		&post.ID,
		&post.UserID,
		&post.Body,
		&post.CreatedAt,
		&post.UpdatedAt,
		&user.ID,
		&user.UserName,
		&user.Name,
		&user.Email,
		&user.IsAdmin,
		&user.ProfilePictureURL,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	post.User = user
	post.LikeCount = 0
	post.IsLikedByMe = false

	media, err := s.getMediaForPost(postID)
	if err != nil {
		return nil, err
	}
	post.Media = media

	return post, nil
}

func (s *PostStore) GetAllPosts(limit, offset int) ([]Post, error) {
	return s.getAllPostsWithUserContext(limit, offset, "")
}

func (s *PostStore) GetAllPostsWithUserContext(limit, offset int, currentUserID string) ([]Post, error) {
	return s.getAllPostsWithUserContext(limit, offset, currentUserID)
}

func (s *PostStore) getAllPostsWithUserContext(limit, offset int, currentUserID string) ([]Post, error) {
	posts, err := s.getAllPostsWithLikes(limit, offset, currentUserID)
	if err != nil {
		return s.getAllPostsBasic(limit, offset)
	}
	return posts, nil
}

func (s *PostStore) getAllPostsWithLikes(limit, offset int, currentUserID string) ([]Post, error) {
	const q = `
		SELECT p.id, p.user_id, p.body, p.created_at, p.updated_at,
		       u.id, u.username, u.name, u.email, u.is_admin, u.profile_picture_url,
		       COALESCE(like_counts.count, 0) as like_count,
		       CASE WHEN user_likes.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked_by_me
		FROM posts p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN (
			SELECT post_id, COUNT(*) as count
			FROM post_likes
			GROUP BY post_id
		) like_counts ON p.id = like_counts.post_id
		LEFT JOIN post_likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = ?
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(q, currentUserID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		post := Post{}
		user := User{}

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Body,
			&post.CreatedAt,
			&post.UpdatedAt,
			&user.ID,
			&user.UserName,
			&user.Name,
			&user.Email,
			&user.IsAdmin,
			&user.ProfilePictureURL,
			&post.LikeCount,
			&post.IsLikedByMe,
		)
		if err != nil {
			return nil, err
		}

		post.User = &user

		media, err := s.getMediaForPost(post.ID)
		if err != nil {
			return nil, err
		}
		post.Media = media

		posts = append(posts, post)
	}

	return posts, nil
}

func (s *PostStore) getAllPostsBasic(limit, offset int) ([]Post, error) {
	const q = `
		SELECT p.id, p.user_id, p.body, p.created_at, p.updated_at,
		       u.id, u.username, u.name, u.email, u.is_admin, u.profile_picture_url
		FROM posts p
		JOIN users u ON p.user_id = u.id
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		post := Post{}
		user := User{}

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Body,
			&post.CreatedAt,
			&post.UpdatedAt,
			&user.ID,
			&user.UserName,
			&user.Name,
			&user.Email,
			&user.IsAdmin,
			&user.ProfilePictureURL,
		)
		if err != nil {
			return nil, err
		}

		post.User = &user
		post.LikeCount = 0
		post.IsLikedByMe = false

		media, err := s.getMediaForPost(post.ID)
		if err != nil {
			return nil, err
		}
		post.Media = media

		posts = append(posts, post)
	}

	return posts, nil
}

func (s *PostStore) GetPostsByUserID(userID string, limit, offset int) ([]Post, error) {
	return s.getPostsByUserIDWithUserContext(userID, limit, offset, "")
}

func (s *PostStore) GetPostsByUserIDWithUserContext(userID string, limit, offset int, currentUserID string) ([]Post, error) {
	return s.getPostsByUserIDWithUserContext(userID, limit, offset, currentUserID)
}

func (s *PostStore) getPostsByUserIDWithUserContext(userID string, limit, offset int, currentUserID string) ([]Post, error) {
	posts, err := s.getPostsByUserIDWithLikes(userID, limit, offset, currentUserID)
	if err != nil {
		return s.getPostsByUserIDBasic(userID, limit, offset)
	}
	return posts, nil
}

func (s *PostStore) getPostsByUserIDWithLikes(userID string, limit, offset int, currentUserID string) ([]Post, error) {
	const q = `
		SELECT p.id, p.user_id, p.body, p.created_at, p.updated_at,
		       u.id, u.username, u.name, u.email, u.is_admin, u.profile_picture_url,
		       COALESCE(like_counts.count, 0) as like_count,
		       CASE WHEN user_likes.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked_by_me
		FROM posts p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN (
			SELECT post_id, COUNT(*) as count
			FROM post_likes
			GROUP BY post_id
		) like_counts ON p.id = like_counts.post_id
		LEFT JOIN post_likes user_likes ON p.id = user_likes.post_id AND user_likes.user_id = ?
		WHERE p.user_id = ?
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(q, currentUserID, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		post := Post{}
		user := User{}

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Body,
			&post.CreatedAt,
			&post.UpdatedAt,
			&user.ID,
			&user.UserName,
			&user.Name,
			&user.Email,
			&user.IsAdmin,
			&user.ProfilePictureURL,
			&post.LikeCount,
			&post.IsLikedByMe,
		)
		if err != nil {
			return nil, err
		}

		post.User = &user

		media, err := s.getMediaForPost(post.ID)
		if err != nil {
			return nil, err
		}
		post.Media = media

		posts = append(posts, post)
	}

	return posts, nil
}

func (s *PostStore) getPostsByUserIDBasic(userID string, limit, offset int) ([]Post, error) {
	const q = `
		SELECT p.id, p.user_id, p.body, p.created_at, p.updated_at,
		       u.id, u.username, u.name, u.email, u.is_admin, u.profile_picture_url
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.user_id = ?
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(q, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		post := Post{}
		user := User{}

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Body,
			&post.CreatedAt,
			&post.UpdatedAt,
			&user.ID,
			&user.UserName,
			&user.Name,
			&user.Email,
			&user.IsAdmin,
			&user.ProfilePictureURL,
		)
		if err != nil {
			return nil, err
		}

		post.User = &user
		post.LikeCount = 0
		post.IsLikedByMe = false

		media, err := s.getMediaForPost(post.ID)
		if err != nil {
			return nil, err
		}
		post.Media = media

		posts = append(posts, post)
	}

	return posts, nil
}

func (s *PostStore) DeletePost(postID string) error {
	const q = `DELETE FROM posts WHERE id = ?`
	_, err := s.db.Exec(q, postID)
	return err
}

func (s *PostStore) getMediaForPost(postID string) ([]PostMedia, error) {
	const q = `
		SELECT id, post_id, media_url, media_type, file_key, file_size, mime_type, created_at
		FROM post_media
		WHERE post_id = ?
		ORDER BY created_at ASC
	`

	rows, err := s.db.Query(q, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var media []PostMedia
	for rows.Next() {
		m := PostMedia{}
		err := rows.Scan(
			&m.ID,
			&m.PostID,
			&m.MediaURL,
			&m.MediaType,
			&m.FileKey,
			&m.FileSize,
			&m.MimeType,
			&m.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		media = append(media, m)
	}

	return media, nil
}

func (s *PostStore) GetPostMediaByID(mediaID string) (*PostMedia, error) {
	const q = `
		SELECT id, post_id, media_url, media_type, file_key, file_size, mime_type, created_at
		FROM post_media
		WHERE id = ?
	`

	media := &PostMedia{}
	err := s.db.QueryRow(q, mediaID).Scan(
		&media.ID,
		&media.PostID,
		&media.MediaURL,
		&media.MediaType,
		&media.FileKey,
		&media.FileSize,
		&media.MimeType,
		&media.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return media, nil
}

func NewPost(userID, body string) *Post {
	now := time.Now().UTC()
	return &Post{
		UserID:    userID,
		Body:      body,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func NewPostMedia(postID, mediaURL, mediaType, fileKey, mimeType string, fileSize int64) *PostMedia {
	return &PostMedia{
		PostID:    postID,
		MediaURL:  mediaURL,
		MediaType: mediaType,
		FileKey:   fileKey,
		FileSize:  fileSize,
		MimeType:  mimeType,
		CreatedAt: time.Now().UTC(),
	}
}

func (s *PostStore) ToggleLike(postID, userID string) (bool, error) {
	const checkQuery = `SELECT COUNT(*) FROM post_likes WHERE post_id = ? AND user_id = ?`
	var count int
	err := s.db.QueryRow(checkQuery, postID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	if count > 0 {
		const deleteQuery = `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`
		_, err := s.db.Exec(deleteQuery, postID, userID)
		return false, err
	} else {
		const insertQuery = `INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`
		_, err := s.db.Exec(insertQuery, postID, userID, time.Now().UTC())
		return true, err
	}
}

func (s *PostStore) GetLikeCount(postID string) (int, error) {
	const query = `SELECT COUNT(*) FROM post_likes WHERE post_id = ?`
	var count int
	err := s.db.QueryRow(query, postID).Scan(&count)
	return count, err
}

func (s *PostStore) IsLikedByUser(postID, userID string) (bool, error) {
	const query = `SELECT COUNT(*) FROM post_likes WHERE post_id = ? AND user_id = ?`
	var count int
	err := s.db.QueryRow(query, postID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
