package api

import (
	"log"
	"net/http"

	u "github.com/lucialv/ryo.cat/pkg/utils"

	"github.com/go-chi/chi/v5"
)

type apiFunc func(http.ResponseWriter, *http.Request) error

type ApiError struct {
	Error string
}

func makeHTTPHandleFunc(f apiFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := f(w, r); err != nil {
			log.Printf("Error occurred: %v", err)
			u.WriteJSON(w, http.StatusBadRequest, ApiError{Error: err.Error()})
		}
	}
}

func (s *APIServer) Routes() *chi.Mux {
	r := chi.NewRouter()

	// Public routes (no authentication required)
	r.Get("/login", makeHTTPHandleFunc(s.loginHandler))

	// Protected routes (authentication required)
	r.Group(func(r chi.Router) {
		r.Use(s.AuthTokenMiddleware)

	})

	return r
}
