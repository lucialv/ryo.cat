package auth

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

type Authenticator interface {
	GenerateToken(jwtClaims JWTClaims) (string, error)
	ValidateToken(token string) (*jwt.Token, error)
	SetTokenCookie(w http.ResponseWriter, jwtToken string)
	ClearTokenCookie(w http.ResponseWriter)
}