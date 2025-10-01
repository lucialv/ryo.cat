package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/lucialv/ryo.cat/pkg/store"
	"github.com/lucialv/ryo.cat/pkg/utils"
	u "github.com/lucialv/ryo.cat/pkg/utils"
)

type UpdateProfilePictureRequest struct {
	ProfilePictureURL *string `json:"profilePictureUrl"`
}

type UserProfileResponse struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	Email             string  `json:"email"`
	IsAdmin           bool    `json:"isAdmin"`
	ProfilePictureURL *string `json:"profilePictureUrl"`
	CreatedAt         string  `json:"createdAt"`
}

func (s *APIServer) getUserProfileHandler(w http.ResponseWriter, r *http.Request) error {
	user := r.Context().Value(userCtx).(*store.User)

	response := UserProfileResponse{
		ID:                user.ID,
		Name:              user.Name,
		Email:             user.Email,
		IsAdmin:           user.IsAdmin,
		ProfilePictureURL: user.ProfilePictureURL,
		CreatedAt:         user.CreatedAt.Format(time.RFC3339),
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
		Name:              updatedUser.Name,
		Email:             updatedUser.Email,
		IsAdmin:           updatedUser.IsAdmin,
		ProfilePictureURL: updatedUser.ProfilePictureURL,
		CreatedAt:         updatedUser.CreatedAt.Format(time.RFC3339),
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
