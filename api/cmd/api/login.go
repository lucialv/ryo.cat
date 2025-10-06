package api

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/lucialv/ryo.cat/internal/auth"
	"github.com/lucialv/ryo.cat/pkg/env"
	store "github.com/lucialv/ryo.cat/pkg/store"
	u "github.com/lucialv/ryo.cat/pkg/utils"

	"cloud.google.com/go/auth/credentials/idtoken"
)

func verifyIDToken(ctx context.Context, token, clientID string) (*idtoken.Payload, error) {
	payload, err := idtoken.Validate(ctx, token, clientID)
	if err != nil {
		log.Printf("ID token validation failed for user: %s", clientID)
		return nil, fmt.Errorf("idtoken.Validate: %v", err)
	}
	return payload, nil
}

func (s *APIServer) loginHandler(w http.ResponseWriter, r *http.Request) error {
	params := r.URL.Query()

	idTokens, exists := params["id_token"]
	if !exists || len(idTokens) == 0 {
		return fmt.Errorf("id_token parameter is required")
	}

	idToken := idTokens[0]
	if idToken == "" {
		return fmt.Errorf("id_token cannot be empty")
	}

	log.Println("ID token", idToken)
	clientID := env.GetString("GOOGLE_CLIENT_ID", "")
	googlePayload, err := verifyIDToken(context.Background(), idToken, clientID)
	if err != nil {
		return err
	}

	// Safely extract claims with proper type checking
	emailVerified, ok := googlePayload.Claims["email_verified"].(bool)
	if !ok {
		return fmt.Errorf("email_verified claim is missing or invalid")
	}

	log.Printf("ID token validation successful for user: %s", googlePayload.Claims["email"])

	if emailVerified {
		status := http.StatusOK

		// Safely extract required claims
		sub, ok := googlePayload.Claims["sub"].(string)
		if !ok {
			return fmt.Errorf("sub claim is missing or invalid")
		}

		name, ok := googlePayload.Claims["name"].(string)
		if !ok {
			return fmt.Errorf("name claim is missing or invalid")
		}

		email, ok := googlePayload.Claims["email"].(string)
		if !ok {
			return fmt.Errorf("email claim is missing or invalid")
		}

		profileImg, ok := googlePayload.Claims["picture"].(string)
		if !ok {
			profileImg = "" // Optional field, use empty string as default
		}

		user, err := s.Store.Users.GetBySub(sub)
		if err != nil {
			log.Printf("Error fetching user by sub: %v", err)
			return err
		}

		username, err := u.SanitizeAndValidateUsername(name)
		if err != nil || username == "" {
			suffix := sub
			if len(suffix) > 8 {
				suffix = suffix[:8]
			}
			username = fmt.Sprintf("user-%s", suffix)
		}

		if user == nil {
			log.Printf("User not found, creating new user")
			user = store.NewUser(
				sub,
				emailVerified,
				username,
				name,
				email,
			)
			if err := s.Store.Users.Create(user); err != nil {
				log.Printf("Error creating user in database: %v", err)
				return err
			}
			log.Printf("New user created: %s (%s)", user.UserName, user.ID)
		} else {
			log.Printf("User found: %s (%s)", user.UserName, user.ID)
		}

		jwtClaims := auth.JWTClaims{
			ID:         user.ID,
			Sub:        sub,
			UserName:   username,
			Name:       name,
			Email:      email,
			IsAdmin:    user.IsAdmin,
			ProfileImg: profileImg,
		}

		jwtToken, err := s.Authenticator.GenerateToken(jwtClaims)
		if err != nil {
			log.Printf("Error generating JWT token for user: %s", user.ID)
			return u.WriteJSON(w, http.StatusInternalServerError, fmt.Errorf("failed to create token: %s", err.Error()))
		}
		s.Authenticator.SetTokenCookie(w, jwtToken)
		log.Printf("JWT token generated for user: %s (%s)", user.Name, user.ID)
		return u.WriteJSON(w, status, jwtClaims)
	}

	log.Printf("Unauthorized access attempt for user with sub: %s", googlePayload.Claims["sub"])
	return u.WriteJSON(w, http.StatusUnauthorized, nil)
}

func (s *APIServer) logoutHandler(w http.ResponseWriter, r *http.Request) error {
	s.Authenticator.ClearTokenCookie(w)
	log.Printf("User logged out successfully")

	return u.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "Logged out successfully",
	})
}
