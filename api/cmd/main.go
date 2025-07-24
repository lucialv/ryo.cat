package main

import (
	"log"
	"os"
	"time"

	"github.com/lucialv/ryo.cat/cmd/api"
	"github.com/lucialv/ryo.cat/internal/auth"
	"github.com/lucialv/ryo.cat/pkg/env"
	store "github.com/lucialv/ryo.cat/pkg/store"
)

func main() {
	if os.Getenv("ENV") != "production" {
		env.Load()
	} 
	cfg := api.Config{
		Addr:        env.GetString("ADDR", ":8000"),
		ApiURL:      env.GetString("EXTERNAL_URL", "https://api.ryo.cat"),
		FrontendURL: env.GetString("FRONTEND_URL", "https://ryo.cat"),
		Env:         env.GetString("ENV", "development"),
		Auth: api.AuthConfig{
			Google: api.Google{
				ClientID: env.GetString("GOOGLE_CLIENT_ID", "example"),
				Aud:      env.GetString("GOOGLE_AUD", "example"),
				Iss:      env.GetString("GOOGLE_ISS", "example"),
			},
			Token: api.Token{
				Secret: env.GetString("JWT_SECRET", "example"),
				Exp:    9 * time.Hour,
			},
		},
	}
	store, err := store.NewUserStore(
		env.GetString("DB_URL", ""),
		[]byte(env.GetString("DB_TOKEN", "meow")),
	)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	jwtAuthenticator := auth.NewJWTAuthenticator(
		cfg.Auth.Token.Secret,
		cfg.Auth.Google.Aud,
		cfg.Auth.Google.Iss,
		cfg.Auth.Token.Exp,
	)

	server := api.NewAPIServer(cfg, store, jwtAuthenticator)
	server.Run()
}
