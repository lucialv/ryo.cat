package utils

var contentTypeExtensionMap = map[string]string{
	"application/pdf":    ".pdf",
	"image/jpeg":         ".jpeg",
	"image/jpg":          ".jpg",
	"image/png":          ".png",
	"image/gif":          ".gif",
	"image/bmp":          ".bmp",
	"image/tiff":         ".tiff",
	"image/webp":         ".webp",
	"image/heic":         ".heic",
	"text/plain":         ".txt",
	"text/csv":           ".csv",
	"application/msword": ".doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
	"application/vnd.ms-excel": ".xls",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         ".xlsx",
	"application/vnd.ms-powerpoint":                                             ".ppt",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
	"application/rtf":              ".rtf",
	"application/zip":              ".zip",
	"application/x-rar-compressed": ".rar",
	"application/json":             ".json",
	"application/xml":              ".xml",
	"text/xml":                     ".xml",
	"video/mp4":        ".mp4",
	"video/x-msvideo":  ".avi",
	"video/x-matroska": ".mkv",
	"video/webm":       ".webm",
	"video/quicktime":  ".mov",
	"video/mpeg":       ".mpeg",
	"video/3gpp":       ".3gp",
	"video/ogg":        ".ogv",
	"audio/mpeg":       ".mp3",
    "audio/wav":        ".wav",
    "audio/ogg":        ".ogg",
	"application/ogg":  ".ogg",
    "audio/flac":       ".flac",
    "audio/aac":        ".aac",
    "audio/webm":       ".weba",
    "audio/mp4":        ".m4a",
    "audio/x-ms-wma":   ".wma",
}

func getContentTypeFromExtension(extension string) (string, bool) {
	for contentType, ext := range contentTypeExtensionMap {
		if ext == extension {
			return contentType, true
		}
	}
	return "", false
}

func ConvertFileType(input string) string {
	if len(input) == 0 {
		return ""
	}

	if input[0] == '.' {
		if contentType, exists := getContentTypeFromExtension(input); exists {
			return contentType
		}
		return "application/octet-stream"
	}

	if extension, exists := contentTypeExtensionMap[input]; exists {
		return extension
	}
	return ".bin"
}