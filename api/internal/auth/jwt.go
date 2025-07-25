package auth

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/lucialv/ryo.cat/pkg/env"

	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	ID         string `json:"id"`
	Sub        string `json:"sub"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	IsAdmin    bool   `json:"isAdmin"`
	ProfileImg string `json:"profileImg"`
}

type JWTAuthenticator struct {
	secret string
	exp    time.Duration
	aud    string
	iss    string
}

func NewJWTAuthenticator(secret, aud, iss string, exp time.Duration) *JWTAuthenticator {
	return &JWTAuthenticator{secret, exp, aud, iss}
}

func (a *JWTAuthenticator) GenerateToken(jwtClaims JWTClaims) (string, error) {
	secret := []byte(env.GetString("JWT_SECRET", ""))
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":          jwtClaims.Sub,
		"name":        jwtClaims.Name,
		"email":       jwtClaims.Email,
		"profile_img": jwtClaims.ProfileImg,
		"sub":         jwtClaims.Sub,
		"aud":         a.aud,
		"iss":         a.iss,
		"exp":         time.Now().Add(a.exp).Unix(),
		"iat":         time.Now().Unix(),
	})
	signedToken, err := token.SignedString(secret)
	if err != nil {
		log.Println(err)
		return "", err
	}
	return signedToken, nil
}

func (a *JWTAuthenticator) ValidateToken(token string) (*jwt.Token, error) {
	return jwt.Parse(token, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
		}

		return []byte(a.secret), nil
	},
		jwt.WithExpirationRequired(),
		jwt.WithAudience(a.aud),
		jwt.WithIssuer(a.iss),
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
	)
}

func (a *JWTAuthenticator) SetTokenCookie(w http.ResponseWriter, jwtToken string) {
	isProduction := env.GetString("ENV", "development") == "production"

	domain := ""
	if isProduction {
		domain = "ryo.cat"
	}

	cookie := &http.Cookie{
		Name:     "ryo_session",
		Value:    jwtToken,
		Expires:  time.Now().Add(a.exp),
		Domain:   domain,
		Path:     "/",
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

func (a *JWTAuthenticator) ClearTokenCookie(w http.ResponseWriter) {
	isProduction := env.GetString("ENV", "development") == "production"

	domain := ""
	if isProduction {
		domain = "ryo.cat"
	}

	cookie := &http.Cookie{
		Name:     "ryo_session",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		MaxAge:   -1,
		Domain:   domain,
		Path:     "/",
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}
