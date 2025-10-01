package main

import (
	"log"
	"os"
	"time"
	"fmt"

	"github.com/lucialv/ryo.cat/cmd/api"
	"github.com/lucialv/ryo.cat/internal/auth"
	"github.com/lucialv/ryo.cat/pkg/env"
	"github.com/lucialv/ryo.cat/pkg/storage"
	store "github.com/lucialv/ryo.cat/pkg/store"
)

func main() {
	if os.Getenv("ENV") != "production" {
		env.Load()
	}
	addr := env.GetString("ADDR", ":8000")
	if p := os.Getenv("PORT"); p != "" {
     	addr = fmt.Sprintf(":%s", p)
	}

	cfg := api.Config{
		Addr:        addr,
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
		R2: api.R2Config{
			AccountID:       env.GetString("ACCOUNT_ID", ""),
			AccessKeyID:     env.GetString("ACCESS_KEY_ID", ""),
			AccessKeySecret: env.GetString("ACCESS_KEY_SECRET", ""),
			BucketName:      env.GetString("BUCKET_NAME", ""),
		},
	}

	store, err := store.NewUserStore(
		env.GetString("DB_URL", ""),
		[]byte(env.GetString("DB_TOKEN", "meow")),
	)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	r2Storage, err := storage.NewR2Storage(storage.R2Config{
		AccountID:       cfg.R2.AccountID,
		AccessKeyID:     cfg.R2.AccessKeyID,
		AccessKeySecret: cfg.R2.AccessKeySecret,
		BucketName:      cfg.R2.BucketName,
	})
	if err != nil {
		log.Fatalf("failed to initialize R2 storage: %v", err)
	}

	jwtAuthenticator := auth.NewJWTAuthenticator(
		cfg.Auth.Token.Secret,
		cfg.Auth.Google.Aud,
		cfg.Auth.Google.Iss,
		cfg.Auth.Token.Exp,
	)

	server := api.NewAPIServer(cfg, store, r2Storage, jwtAuthenticator)
	server.Run()
}
