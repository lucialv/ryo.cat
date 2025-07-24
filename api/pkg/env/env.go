package env

import (
	"encoding/base64"
	"log"
	"os"
	"strings"
)

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func Load() {
	envFileName := ".env"
	envF, err := os.ReadFile(envFileName)
	check(err)
	envArr := strings.Split(string(envF), "\n")
	for _, envP := range envArr {
		if len(envP) > 0 && strings.Contains(envP, "=") {
			envP = strings.ReplaceAll(envP, "\"", "")
			envPArr := strings.SplitN(envP, "=", 2)
			key := envPArr[0]
			val := envPArr[1]
			if len(envPArr) == 2 && key != "#" {
				if strings.HasSuffix(key, "_FILE") {
					realKey := strings.TrimSuffix(key, "_FILE")
					data, err := os.ReadFile(val)
					if err != nil {
						log.Fatalf("Failed to read file %s: %v", val, err)
					}
					os.Setenv(realKey, base64.StdEncoding.EncodeToString(data))
				} else {
					os.Setenv(key, val)
				}
			}
		}
	}
}

func GetString(name, fallback string) string {
	env, ok := os.LookupEnv(name)
	if !ok {
		return fallback
	}
	return env
}

func GetGoogleCredJSON() []byte {
	b64 := os.Getenv("GOOGLE_CREDENTIALS")
	googleCredsJSON, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		check(err)
	}
	return googleCredsJSON
}
