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

	r.Get("/login", makeHTTPHandleFunc(s.loginHandler))
	r.Post("/logout", makeHTTPHandleFunc(s.logoutHandler))
	r.Route("/posts", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(s.OptionalAuthTokenMiddleware)
			r.Get("/", makeHTTPHandleFunc(s.listPostsHandler))
			r.Get("/{postId}", makeHTTPHandleFunc(s.getPostHandler))
			r.Get("/user/{userId}", makeHTTPHandleFunc(s.getUserPostsHandler))
		})

		r.Get("/media/{mediaId}/download", makeHTTPHandleFunc(s.downloadPostMediaHandler))

		r.Group(func(r chi.Router) {
			r.Use(s.AuthTokenMiddleware)
			r.Post("/{postId}/like", makeHTTPHandleFunc(s.toggleLikeHandler))
		})

		r.Group(func(r chi.Router) {
			r.Use(s.AuthTokenMiddleware)
			r.Use(s.adminOnlyMiddleware)
			r.Post("/", makeHTTPHandleFunc(s.createPostHandler))
			r.Delete("/{postId}", makeHTTPHandleFunc(s.deletePostHandler))
			r.Post("/media/upload", makeHTTPHandleFunc(s.uploadPostMediaHandler))
		})
	})

	r.Group(func(r chi.Router) {
		r.Use(s.AuthTokenMiddleware)

		r.Route("/files", func(r chi.Router) {
			r.Post("/upload", makeHTTPHandleFunc(s.uploadFileHandler))
			r.Get("/list", makeHTTPHandleFunc(s.listFilesHandler))
			r.Post("/presigned-url/download", makeHTTPHandleFunc(s.generatePreSignedURLHandler))
			r.Post("/presigned-url/upload", makeHTTPHandleFunc(s.generatePreSignedUploadURLHandler))
			r.Route("/{key:.*}", func(r chi.Router) {
				r.Get("/", makeHTTPHandleFunc(s.downloadFileHandler))
				r.Delete("/", makeHTTPHandleFunc(s.deleteFileHandler))
				r.Get("/info", makeHTTPHandleFunc(s.getFileInfoHandler))
				r.Get("/exists", makeHTTPHandleFunc(s.fileExistsHandler))
			})
		})

		r.Route("/profile", func(r chi.Router) {
			r.Get("/", makeHTTPHandleFunc(s.getUserProfileHandler))
			r.Put("/picture", makeHTTPHandleFunc(s.updateProfilePictureHandler))
			r.Post("/picture/upload", makeHTTPHandleFunc(s.uploadProfilePictureHandler))
			r.Delete("/picture", makeHTTPHandleFunc(s.deleteProfilePictureHandler))
		})
	})

	return r
}
