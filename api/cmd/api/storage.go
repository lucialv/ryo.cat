package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	u "github.com/lucialv/ryo.cat/pkg/utils"
)

type FileUploadRequest struct {
	Filename    string            `json:"filename"`
	ContentType string            `json:"content_type"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

type FileUploadResponse struct {
	Key string `json:"key"`
	URL string `json:"url,omitempty"`
}

type PreSignedURLRequest struct {
	Key         string `json:"key"`
	ContentType string `json:"content_type,omitempty"`
	Expiration  int64  `json:"expiration,omitempty"`
}

type PreSignedURLResponse struct {
	URL        string `json:"url"`
	Key        string `json:"key"`
	Expiration int64  `json:"expiration"`
}

type FileInfoResponse struct {
	Key          string            `json:"key"`
	Size         int64             `json:"size"`
	ContentType  string            `json:"content_type"`
	LastModified time.Time         `json:"last_modified"`
	ETag         string            `json:"etag"`
	Metadata     map[string]string `json:"metadata,omitempty"`
}

type ListFilesResponse struct {
	Files  []string `json:"files"`
	Prefix string   `json:"prefix,omitempty"`
}

func (s *APIServer) uploadFileHandler(w http.ResponseWriter, r *http.Request) error {
	// only 10MB files >//<
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		return fmt.Errorf("failed to parse multipart form: %w", err)
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		return fmt.Errorf("failed to get file from form: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read file data: %w", err)
	}

	key := fmt.Sprintf("uploads/%d_%s", time.Now().Unix(), header.Filename)

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}

	err = s.R2Storage.UploadFile(key, data, contentType)
	if err != nil {
		return fmt.Errorf("failed to upload file to R2: %w", err)
	}

	response := FileUploadResponse{
		Key: key,
	}

	return u.WriteJSON(w, http.StatusCreated, response)
}

func (s *APIServer) downloadFileHandler(w http.ResponseWriter, r *http.Request) error {
	key := chi.URLParam(r, "key")
	if key == "" {
		return fmt.Errorf("file key is required")
	}

	key = strings.ReplaceAll(key, "%2F", "/")

	data, err := s.R2Storage.DownloadFile(key)
	if err != nil {
		if strings.Contains(err.Error(), "NoSuchKey") {
			return fmt.Errorf("file not found")
		}
		return fmt.Errorf("failed to download file: %w", err)
	}

	info, err := s.R2Storage.GetFileInfo(key)
	if err == nil && info.ContentType != "" {
		w.Header().Set("Content-Type", info.ContentType)
	}

	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	w.WriteHeader(http.StatusOK)
	w.Write(data)

	return nil
}

func (s *APIServer) deleteFileHandler(w http.ResponseWriter, r *http.Request) error {
	key := chi.URLParam(r, "key")
	if key == "" {
		return fmt.Errorf("file key is required")
	}

	key = strings.ReplaceAll(key, "%2F", "/")

	err := s.R2Storage.DeleteFile(key)
	if err != nil {
		if strings.Contains(err.Error(), "NoSuchKey") {
			return fmt.Errorf("file not found")
		}
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return u.WriteJSON(w, http.StatusOK, map[string]string{"message": "file deleted successfully"})
}

func (s *APIServer) getFileInfoHandler(w http.ResponseWriter, r *http.Request) error {
	key := chi.URLParam(r, "key")
	if key == "" {
		return fmt.Errorf("file key is required")
	}

	key = strings.ReplaceAll(key, "%2F", "/")

	info, err := s.R2Storage.GetFileInfo(key)
	if err != nil {
		if strings.Contains(err.Error(), "NotFound") {
			return fmt.Errorf("file not found")
		}
		return fmt.Errorf("failed to get file info: %w", err)
	}

	metadata := make(map[string]string)
	for k, v := range info.Metadata {
		if v != nil {
			metadata[k] = *v
		}
	}

	response := FileInfoResponse{
		Key:          info.Key,
		Size:         info.Size,
		ContentType:  info.ContentType,
		LastModified: info.LastModified,
		ETag:         info.ETag,
		Metadata:     metadata,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) listFilesHandler(w http.ResponseWriter, r *http.Request) error {
	prefix := r.URL.Query().Get("prefix")

	files, err := s.R2Storage.ListFiles(prefix)
	if err != nil {
		return fmt.Errorf("failed to list files: %w", err)
	}

	response := ListFilesResponse{
		Files:  files,
		Prefix: prefix,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) generatePreSignedURLHandler(w http.ResponseWriter, r *http.Request) error {
	var req PreSignedURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fmt.Errorf("failed to decode request body: %w", err)
	}

	if req.Key == "" {
		return fmt.Errorf("file key is required")
	}

	if req.Expiration == 0 {
		req.Expiration = 3600
	}

	url, err := s.R2Storage.GeneratePreSignedURL(req.Key, req.Expiration)
	if err != nil {
		return fmt.Errorf("failed to generate pre-signed URL: %w", err)
	}

	response := PreSignedURLResponse{
		URL:        url,
		Key:        req.Key,
		Expiration: req.Expiration,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) generatePreSignedUploadURLHandler(w http.ResponseWriter, r *http.Request) error {
	var req PreSignedURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return fmt.Errorf("failed to decode request body: %w", err)
	}

	if req.Key == "" {
		return fmt.Errorf("file key is required")
	}

	if req.ContentType == "" {
		req.ContentType = "application/octet-stream"
	}

	if req.Expiration == 0 {
		req.Expiration = 3600
	}

	url, err := s.R2Storage.GeneratePreSignedPutURL(req.Key, req.ContentType, req.Expiration)
	if err != nil {
		return fmt.Errorf("failed to generate pre-signed upload URL: %w", err)
	}

	response := PreSignedURLResponse{
		URL:        url,
		Key:        req.Key,
		Expiration: req.Expiration,
	}

	return u.WriteJSON(w, http.StatusOK, response)
}

func (s *APIServer) fileExistsHandler(w http.ResponseWriter, r *http.Request) error {
	key := chi.URLParam(r, "key")
	if key == "" {
		return fmt.Errorf("file key is required")
	}

	key = strings.ReplaceAll(key, "%2F", "/")

	exists, err := s.R2Storage.FileExists(key)
	if err != nil {
		return fmt.Errorf("failed to check if file exists: %w", err)
	}

	return u.WriteJSON(w, http.StatusOK, map[string]bool{"exists": exists})
}
