package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/lucialv/ryo.cat/pkg/store"
	u "github.com/lucialv/ryo.cat/pkg/utils"
)

type CreatePostRequest struct {
	Body      string               `json:"body"`
	MediaKeys []string             `json:"mediaKeys,omitempty"`
	Media     []CreateMediaRequest `json:"media,omitempty"`
}

type CreateMediaRequest struct {
	FileKey   string `json:"fileKey"`
	MediaType string `json:"mediaType"`
	MimeType  string `json:"mimeType"`
	FileSize  int64  `json:"fileSize"`
}

type PostResponse struct {
	ID        string              `json:"id"`
	UserID    string              `json:"userId"`
	Body      string              `json:"body"`
	CreatedAt time.Time           `json:"createdAt"`
	UpdatedAt time.Time           `json:"updatedAt"`
	User      *UserResponse       `json:"user"`
	Media     []PostMediaResponse `json:"media"`
}

type UserResponse struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Email             string `json:"email"`
	IsAdmin           bool   `json:"isAdmin"`
	ProfilePictureURL string `json:"profilePictureUrl,omitempty"`
}

type PostMediaResponse struct {
	ID        string    `json:"id"`
	MediaURL  string    `json:"mediaUrl"`
	MediaType string    `json:"mediaType"`
	MimeType  string    `json:"mimeType"`
	FileSize  int64     `json:"fileSize"`
	CreatedAt time.Time `json:"createdAt"`
}

type PostsListResponse struct {
	Posts   []PostResponse `json:"posts"`
	Page    int            `json:"page"`
	Limit   int            `json:"limit"`
	HasMore bool           `json:"hasMore"`
}

func (s *APIServer) createPostHandler(w http.ResponseWriter, r *http.Request) error {
	var req CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fmt.Errorf("failed to decode request body: %w", err)
	}

	if strings.TrimSpace(req.Body) == "" {
		return fmt.Errorf("post body cannot be empty")
	}

	user := r.Context().Value(userCtx).(*store.User)

	post := store.NewPost(user.ID, req.Body)
	if err := s.Store.Posts.CreatePost(post); err != nil {
		return fmt.Errorf("failed to create post: %w", err)
	}

	var media []store.PostMedia
	if len(req.Media) > 0 {
		for _, m := range req.Media {
			if m.MediaType != "image" && m.MediaType != "video" {
				return fmt.Errorf("invalid media type: %s. Must be 'image' or 'video'", m.MediaType)
			}

			exists, err := s.R2Storage.FileExists(m.FileKey)
			if err != nil {
				return fmt.Errorf("failed to check if media file exists: %w", err)
			}
			if !exists {
				return fmt.Errorf("media file not found: %s", m.FileKey)
			}

			mediaURL, err := s.R2Storage.GeneratePreSignedURL(m.FileKey, 24*3600)
			if err != nil {
				return fmt.Errorf("failed to generate media URL: %w", err)
			}

			postMedia := store.NewPostMedia(
				post.ID,
				mediaURL,
				m.MediaType,
				m.FileKey,
				m.MimeType,
				m.FileSize,
			)
			media = append(media, *postMedia)
		}

		if err := s.Store.Posts.AddMediaToPost(post.ID, media); err != nil {
			return fmt.Errorf("failed to add media to post: %w", err)
		}
	}

	createdPost, err := s.Store.Posts.GetPostByID(post.ID)
	if err != nil {
		return fmt.Errorf("failed to retrieve created post: %w", err)
	}

	response := convertPostToResponse(createdPost)
	return u.WriteJSON(w, http.StatusCreated, response)
}

func (s *APIServer) getPostHandler(w http.ResponseWriter, r *http.Request) error {
	postID := chi.URLParam(r, "postId")
	if postID == "" {
		return fmt.Errorf("post ID is required")
	}

	post, err := s.Store.Posts.GetPostByID(postID)
	if err != nil {
		return fmt.Errorf("failed to get post: %w", err)
	}

	if post == nil {
		return fmt.Errorf("post not found")
	}

	response := convertPostToResponse(post)
	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) listPostsHandler(w http.ResponseWriter, r *http.Request) error {
	limitStr := r.URL.Query().Get("limit")
	pageStr := r.URL.Query().Get("page")

	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	page := 1
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	offset := (page - 1) * limit

	posts, err := s.Store.Posts.GetAllPosts(limit+1, offset)
	if err != nil {
		return fmt.Errorf("failed to get posts: %w", err)
	}

	hasMore := len(posts) > limit
	if hasMore {
		posts = posts[:limit]
	}

	var responses []PostResponse
	for _, post := range posts {
		responses = append(responses, convertPostToResponse(&post))
	}

	response := PostsListResponse{
		Posts:   responses,
		Page:    page,
		Limit:   limit,
		HasMore: hasMore,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) getUserPostsHandler(w http.ResponseWriter, r *http.Request) error {
	userID := chi.URLParam(r, "userId")
	if userID == "" {
		return fmt.Errorf("user ID is required")
	}

	limitStr := r.URL.Query().Get("limit")
	pageStr := r.URL.Query().Get("page")

	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	page := 1
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	offset := (page - 1) * limit

	posts, err := s.Store.Posts.GetPostsByUserID(userID, limit+1, offset)
	if err != nil {
		return fmt.Errorf("failed to get user posts: %w", err)
	}

	hasMore := len(posts) > limit
	if hasMore {
		posts = posts[:limit]
	}

	var responses []PostResponse
	for _, post := range posts {
		responses = append(responses, convertPostToResponse(&post))
	}

	response := PostsListResponse{
		Posts:   responses,
		Page:    page,
		Limit:   limit,
		HasMore: hasMore,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) deletePostHandler(w http.ResponseWriter, r *http.Request) error {
	postID := chi.URLParam(r, "postId")
	if postID == "" {
		return fmt.Errorf("post ID is required")
	}

	user := r.Context().Value(userCtx).(*store.User)

	post, err := s.Store.Posts.GetPostByID(postID)
	if err != nil {
		return fmt.Errorf("failed to get post: %w", err)
	}

	if post == nil {
		return fmt.Errorf("post not found")
	}

	if !user.IsAdmin && post.UserID != user.ID {
		return fmt.Errorf("you can only delete your own posts")
	}

	for _, media := range post.Media {
		if err := s.R2Storage.DeleteFile(media.FileKey); err != nil {
			fmt.Printf("failed to delete media file %s: %v", media.FileKey, err)
		}
	}

	if err := s.Store.Posts.DeletePost(postID); err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	return u.WriteJSON(w, http.StatusOK, map[string]string{"message": "post deleted successfully"})
}

func (s *APIServer) uploadPostMediaHandler(w http.ResponseWriter, r *http.Request) error {
	// 50MB limit :c
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		return fmt.Errorf("failed to parse multipart form: %w", err)
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		return fmt.Errorf("failed to get file from form: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read file data: %w", err)
	}

	contentType := http.DetectContentType(data)

	var mediaType string
	if strings.HasPrefix(contentType, "image/") {
		mediaType = "image"
	} else if strings.HasPrefix(contentType, "video/") {
		mediaType = "video"
	} else {
		return fmt.Errorf("unsupported file type: %s. Only images and videos are allowed", contentType)
	}

	key := fmt.Sprintf("posts/media/%d_%s", time.Now().Unix(), header.Filename)

	if err := s.R2Storage.UploadFile(key, data, contentType); err != nil {
		return fmt.Errorf("failed to upload media to R2: %w", err)
	}

	response := CreateMediaRequest{
		FileKey:   key,
		MediaType: mediaType,
		MimeType:  contentType,
		FileSize:  int64(len(data)),
	}

	return u.WriteJSON(w, http.StatusCreated, response)
}

func (s *APIServer) downloadPostMediaHandler(w http.ResponseWriter, r *http.Request) error {
	mediaID := chi.URLParam(r, "mediaId")
	if mediaID == "" {
		return fmt.Errorf("media ID is required")
	}

	media, err := s.Store.Posts.GetPostMediaByID(mediaID)
	if err != nil {
		return fmt.Errorf("failed to get media info: %w", err)
	}

	if media == nil {
		return fmt.Errorf("media not found")
	}

	data, err := s.R2Storage.DownloadFile(media.FileKey)
	if err != nil {
		return fmt.Errorf("failed to download media file: %w", err)
	}

	filename := fmt.Sprintf("ryo-media-%s", mediaID)
	if media.MediaType == "video" {
		filename += ".mp4"
	} else {
		switch media.MimeType {
		case "image/png":
			filename += ".png"
		case "image/gif":
			filename += ".gif"
		case "image/webp":
			filename += ".webp"
		default:
			filename += ".jpg"
		}
	}

	w.Header().Set("Content-Type", media.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(data)))
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	_, err = w.Write(data)
	return err
}

func convertPostToResponse(post *store.Post) PostResponse {
	response := PostResponse{
		ID:        post.ID,
		UserID:    post.UserID,
		Body:      post.Body,
		CreatedAt: post.CreatedAt,
		UpdatedAt: post.UpdatedAt,
	}

	if post.User != nil {
		profilePictureURL := ""
		if post.User.ProfilePictureURL != nil {
			profilePictureURL = *post.User.ProfilePictureURL
		}

		response.User = &UserResponse{
			ID:                post.User.ID,
			Name:              post.User.Name,
			Email:             post.User.Email,
			IsAdmin:           post.User.IsAdmin,
			ProfilePictureURL: profilePictureURL,
		}
	}

	for _, media := range post.Media {
		response.Media = append(response.Media, PostMediaResponse{
			ID:        media.ID,
			MediaURL:  media.MediaURL,
			MediaType: media.MediaType,
			MimeType:  media.MimeType,
			FileSize:  media.FileSize,
			CreatedAt: media.CreatedAt,
		})
	}

	return response
}
