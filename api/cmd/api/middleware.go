package api

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/lucialv/ryo.cat/pkg/store"
	u "github.com/lucialv/ryo.cat/pkg/utils"

	"github.com/golang-jwt/jwt/v5"
)

func (s *APIServer) AuthTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		jwtCookie, err := r.Cookie("ryo_session")
		if err != nil {
			log.Printf("Authorization cookie not found or invalid: %v", err)
			u.WriteJSON(w, http.StatusUnauthorized, fmt.Errorf("authorization header is missing"))
			return
		}
		jwtToken, err := s.Authenticator.ValidateToken(jwtCookie.Value)
		if err != nil {
			log.Printf("Invalid JWT token: %v", err)
			u.WriteJSON(w, http.StatusUnauthorized, fmt.Errorf("token invalid"))
			return
		}

		claims, _ := jwtToken.Claims.(jwt.MapClaims)

		userSub := claims["sub"].(string)

		ctx := r.Context()

		user, err := s.Store.Users.GetBySub(userSub)
		if err != nil {
			log.Printf("User not found for sub: %s", userSub)
			u.WriteJSON(w, http.StatusUnauthorized, fmt.Errorf("token invalid"))
			return
		}
		ctx = context.WithValue(ctx, userCtx, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *APIServer) OptionalAuthTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		jwtCookie, err := r.Cookie("ryo_session")
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		jwtToken, err := s.Authenticator.ValidateToken(jwtCookie.Value)
		if err != nil {
			log.Printf("Invalid JWT token in optional auth: %v", err)
			next.ServeHTTP(w, r)
			return
		}

		claims, ok := jwtToken.Claims.(jwt.MapClaims)
		if !ok {
			next.ServeHTTP(w, r)
			return
		}

		userSub, ok := claims["sub"].(string)
		if !ok {
			next.ServeHTTP(w, r)
			return
		}

		ctx := r.Context()
		user, err := s.Store.Users.GetBySub(userSub)
		if err != nil {
			log.Printf("User not found for sub in optional auth: %s", userSub)
			next.ServeHTTP(w, r)
			return
		}

		ctx = context.WithValue(ctx, userCtx, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *APIServer) adminOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value(userCtx).(*store.User)
		if !user.IsAdmin {
			u.WriteJSON(w, http.StatusForbidden, ApiError{Error: "admin access required"})
			return
		}
		next.ServeHTTP(w, r)
	})
}
