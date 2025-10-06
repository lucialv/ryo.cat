package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/lucialv/ryo.cat/pkg/store"
	"github.com/lucialv/ryo.cat/pkg/utils"
	u "github.com/lucialv/ryo.cat/pkg/utils"
)

type UpdateProfilePictureRequest struct {
	ProfilePictureURL *string `json:"profilePictureUrl"`
}

type UpdateUserNameRequest struct {
	UserName string `json:"username"`
}

type UserProfileResponse struct {
	ID                string  `json:"id"`
	UserName          string  `json:"username"`
	Name              string  `json:"name"`
	Email             string  `json:"email"`
	IsAdmin           bool    `json:"isAdmin"`
	ProfilePictureURL *string `json:"profilePictureUrl"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

func (s *APIServer) getUserProfileHandler(w http.ResponseWriter, r *http.Request) error {
	user := r.Context().Value(userCtx).(*store.User)

	response := UserProfileResponse{
		ID:                user.ID,
		UserName:          user.UserName,
		Name:              user.Name,
		Email:             user.Email,
		IsAdmin:           user.IsAdmin,
		ProfilePictureURL: user.ProfilePictureURL,
		CreatedAt:         user.CreatedAt,
		UpdatedAt:         user.UpdatedAt,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) getProfilePictureHandler(w http.ResponseWriter, r *http.Request) error {
	userId := chi.URLParam(r, "userId")
	if userId == "" {
		return fmt.Errorf("user ID is required")
	}

	user, err := s.Store.Users.GetByID(userId)
	if err != nil {
		return fmt.Errorf("failed to get user with id: %s, err: %s", userId, err)
	}

	response := struct {
		ProfilePictureURL *string `json:"profilePictureUrl"`
	}{
		ProfilePictureURL: user.ProfilePictureURL,
	}

	if user.ProfilePictureURL == nil {
		response.ProfilePictureURL = nil
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) updateProfilePictureHandler(w http.ResponseWriter, r *http.Request) error {
	user := r.Context().Value(userCtx).(*store.User)

	var req UpdateProfilePictureRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fmt.Errorf("failed to decode request body: %w", err)
	}

	if err := s.Store.Users.UpdateProfilePicture(user.ID, req.ProfilePictureURL); err != nil {
		return fmt.Errorf("failed to update profile picture: %w", err)
	}

	updatedUser, err := s.Store.Users.GetByID(user.ID)
	if err != nil {
		return fmt.Errorf("failed to get updated user: %w", err)
	}

	response := UserProfileResponse{
		ID:                updatedUser.ID,
		UserName:          updatedUser.UserName,
		Name:              updatedUser.Name,
		Email:             updatedUser.Email,
		IsAdmin:           updatedUser.IsAdmin,
		ProfilePictureURL: updatedUser.ProfilePictureURL,
		CreatedAt:         updatedUser.CreatedAt,
		UpdatedAt:         updatedUser.UpdatedAt,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) updateUserNameHandler(w http.ResponseWriter, r *http.Request) error {
	user := r.Context().Value(userCtx).(*store.User)

	var req UpdateUserNameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fmt.Errorf("failed to decode request body: %w", err)
	}

	sanitized, err := utils.SanitizeAndValidateUsername(req.UserName)
	if err != nil {
		return fmt.Errorf("invalid username: %w", err)
	}
	if sanitized == "" {
		return fmt.Errorf("username cannot be empty")
	}
	if sanitized == user.UserName {
		return fmt.Errorf("username is unchanged")
	}

	if err := s.Store.Users.UpdateUserName(user.ID, sanitized); err != nil {
		return fmt.Errorf("failed to update username: %w", err)
	}

	updatedUser, err := s.Store.Users.GetByID(user.ID)
	if err != nil {
		return fmt.Errorf("failed to get updated user: %w", err)
	}

	response := UserProfileResponse{
		ID:                updatedUser.ID,
		UserName:          updatedUser.UserName,
		Name:              updatedUser.Name,
		Email:             updatedUser.Email,
		IsAdmin:           updatedUser.IsAdmin,
		ProfilePictureURL: updatedUser.ProfilePictureURL,
		CreatedAt:         updatedUser.CreatedAt,
		UpdatedAt:         updatedUser.UpdatedAt,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) uploadProfilePictureHandler(w http.ResponseWriter, r *http.Request) error {
	user := r.Context().Value(userCtx).(*store.User)

	// 10MB limit :c
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		return fmt.Errorf("failed to parse multipart form: %w", err)
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		return fmt.Errorf("failed to get file from form: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read file data: %w", err)
	}

	contentType := http.DetectContentType(data)

	if !strings.HasPrefix(contentType, "image/") {
		return fmt.Errorf("file must be an image. Got: %s", contentType)
	}

	uuid, err := uuid.NewV4()
	if err != nil {
		return fmt.Errorf("failed to create a new uuid")
	}

	key := fmt.Sprintf("profile-pictures/%s%s", uuid, utils.ConvertFileType(contentType))

	if err := s.R2Storage.UploadFile(key, data, contentType); err != nil {
		return fmt.Errorf("failed to upload profile picture to R2: %w", err)
	}

	profilePictureURL := fmt.Sprintf("https://cdn.ryo.cat/%s", key)

	if err := s.Store.Users.UpdateProfilePicture(user.ID, &profilePictureURL); err != nil {
		return fmt.Errorf("failed to update profile picture in database: %w", err)
	}

	if user.ProfilePictureURL != nil {
		oldKey := extractKeyFromURL(*user.ProfilePictureURL)
		if oldKey != "" {
			if err := s.R2Storage.DeleteFile(oldKey); err != nil {
				fmt.Printf("failed to delete old profile picture %s: %v", oldKey, err)
			}
		}
	}

	response := struct {
		ProfilePictureURL string `json:"profilePictureUrl"`
		Message           string `json:"message"`
	}{
		ProfilePictureURL: profilePictureURL,
		Message:           "Profile picture updated successfully",
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) deleteProfilePictureHandler(w http.ResponseWriter, r *http.Request) error {
	user := r.Context().Value(userCtx).(*store.User)

	if user.ProfilePictureURL != nil {
		oldKey := extractKeyFromURL(*user.ProfilePictureURL)
		if oldKey != "" {
			if err := s.R2Storage.DeleteFile(oldKey); err != nil {
				fmt.Printf("failed to delete profile picture file %s: %v", oldKey, err)
			}
		}
	}

	if err := s.Store.Users.UpdateProfilePicture(user.ID, nil); err != nil {
		return fmt.Errorf("failed to delete profile picture: %w", err)
	}

	return u.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "Profile picture deleted successfully",
	})
}

func extractKeyFromURL(url string) string {
	parts := strings.Split(url, "/")
	if len(parts) >= 3 {
		keyParts := parts[len(parts)-2:]
		return strings.Join(keyParts, "/")
	}
	return ""
}

func (s *APIServer) usernameAvailabilityHandler(w http.ResponseWriter, r *http.Request) error {
	raw := r.URL.Query().Get("username")
	if raw == "" {
		return fmt.Errorf("username is required")
	}

	sanitized := utils.SanitizeUsername(raw)
	if sanitized == "" {
		return fmt.Errorf("invalid username")
	}

	if err := utils.ValidateUsername(sanitized); err != nil {
		return fmt.Errorf("invalid username: %s", err.Error())
	}

	exists, err := s.Store.Users.UsernameExists(sanitized)
	if err != nil {
		return fmt.Errorf("failed to check availability: %w", err)
	}

	return u.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"username":  sanitized,
		"available": !exists,
	})
}
