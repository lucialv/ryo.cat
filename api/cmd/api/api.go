package api

import (
	"log"
	"net/http"
	"time"

	"github.com/lucialv/ryo.cat/pkg/env"
	store "github.com/lucialv/ryo.cat/pkg/store"
	"github.com/lucialv/ryo.cat/internal/auth"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"
)

type APIServer struct {
	Config        Config
	Store         *store.Storage
	Authenticator auth.Authenticator
}

type Config struct {
	Addr        string
	Env         string
	ApiURL      string
	FrontendURL string
	Auth        AuthConfig
}

type AuthConfig struct {
	Google Google
	Token  Token
}

type Google struct {
	ClientID string
	Aud      string
	Iss      string
}

type Token struct {
	Secret string
	Exp    time.Duration
}

func NewAPIServer(config Config, store *store.Storage, authenticator auth.Authenticator) *APIServer {
	return &APIServer{
		Config:        config,
		Store:         store,
		Authenticator: authenticator,
	}
}

func (s *APIServer) Run() {
	router := chi.NewRouter()

	router.Use(
		render.SetContentType(render.ContentTypeJSON),
		middleware.Logger,
		middleware.Compress(5),
		middleware.RealIP,
		cors.Handler(cors.Options{
			AllowedOrigins:   []string{env.GetString("CORS_ALLOWED_ORIGIN", "http://localhost:5173")},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			AllowCredentials: true,
			MaxAge:           300,
		}),
	)

	router.Use(middleware.Timeout(60 * time.Second))

	router.Route("/api", func(r chi.Router) {
		r.Mount("/v1", s.Routes())
	})

	walkFunc := func(method string, route string, handler http.Handler, middleware ...func(http.Handler) http.Handler) error {

		log.Printf("Registered route: %s %s", method, route)
		return nil
	}
	if err := chi.Walk(router, walkFunc); err != nil {
		log.Printf("Chi router couldn't walk through this function: %v", err)
	}
	log.Printf("API running on port %s", s.Config.Addr)
	err := http.ListenAndServe(s.Config.Addr, router)
	if err != nil {
		log.Printf("Failed to start server: %v", err)
	}
}
