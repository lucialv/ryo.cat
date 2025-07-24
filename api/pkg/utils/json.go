package utils

import (
	"encoding/json"
	"log"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, status int, v any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(v)
}

func UnmarshalBody(r *http.Request, v any) error {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		return err
	}
	j, _ := json.MarshalIndent(v, "", "\t")
	log.Printf("String body:\n%+v\n", string(j))
	return nil
}

func PrintJSON(data any, message string) {
	j, _ := json.MarshalIndent(data, "", "\t")
	log.Printf("\n%s %s\n\n", message, string(j))
}
