package storage

import (
	"bytes"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

type FileInfo struct {
	Key          string
	Size         int64
	ContentType  string
	LastModified time.Time
	ETag         string
	Metadata     map[string]*string
}

type R2Storage struct {
	client     *s3.S3
	bucketName string
}

type R2Config struct {
	AccountID       string
	AccessKeyID     string
	AccessKeySecret string
	BucketName      string
}

func NewR2Storage(config R2Config) (*R2Storage, error) {
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", config.AccountID)

	sess, err := session.NewSession(&aws.Config{
		Region:   aws.String("auto"),
		Endpoint: aws.String(endpoint),
		Credentials: credentials.NewStaticCredentials(
			config.AccessKeyID,
			config.AccessKeySecret,
			"",
		),
		S3ForcePathStyle: aws.Bool(true),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %w", err)
	}

	client := s3.New(sess)

	return &R2Storage{
		client:     client,
		bucketName: config.BucketName,
	}, nil
}

func (r *R2Storage) UploadFile(key string, data []byte, contentType string) error {
	_, err := r.client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("failed to upload file to R2: %w", err)
	}

	return nil
}

func (r *R2Storage) UploadFileWithMetadata(key string, data []byte, contentType string, metadata map[string]*string) error {
	_, err := r.client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
		Metadata:    metadata,
	})
	if err != nil {
		return fmt.Errorf("failed to upload file with metadata to R2: %w", err)
	}

	return nil
}

func (r *R2Storage) DownloadFile(key string) ([]byte, error) {
	result, err := r.client.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to download file from R2: %w", err)
	}
	defer result.Body.Close()

	data, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read file data: %w", err)
	}

	return data, nil
}

func (r *R2Storage) DeleteFile(key string) error {
	_, err := r.client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete file from R2: %w", err)
	}

	return nil
}

func (r *R2Storage) FileExists(key string) (bool, error) {
	_, err := r.client.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		if strings.Contains(err.Error(), "NotFound") {
			return false, nil
		}
		return false, fmt.Errorf("failed to check if file exists: %w", err)
	}

	return true, nil
}

func (r *R2Storage) ListFiles(prefix string) ([]string, error) {
	var keys []string

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(r.bucketName),
	}

	if prefix != "" {
		input.Prefix = aws.String(prefix)
	}

	err := r.client.ListObjectsV2Pages(input,
		func(page *s3.ListObjectsV2Output, lastPage bool) bool {
			for _, object := range page.Contents {
				keys = append(keys, *object.Key)
			}
			return !lastPage
		})

	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}

	return keys, nil
}

func (r *R2Storage) GetFileInfo(key string) (*FileInfo, error) {
	result, err := r.client.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	info := &FileInfo{
		Key:          key,
		Size:         *result.ContentLength,
		ContentType:  aws.StringValue(result.ContentType),
		LastModified: *result.LastModified,
		ETag:         strings.Trim(*result.ETag, "\""),
		Metadata:     result.Metadata,
	}

	return info, nil
}

func (r *R2Storage) GeneratePreSignedURL(key string, expiration int64) (string, error) {
	req, _ := r.client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	})

	url, err := req.Presign(time.Duration(expiration) * time.Second)
	if err != nil {
		return "", fmt.Errorf("failed to generate pre-signed URL: %w", err)
	}

	return url, nil
}

func (r *R2Storage) GeneratePreSignedPutURL(key string, contentType string, expiration int64) (string, error) {
	req, _ := r.client.PutObjectRequest(&s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	})

	url, err := req.Presign(time.Duration(expiration) * time.Second)
	if err != nil {
		return "", fmt.Errorf("failed to generate pre-signed PUT URL: %w", err)
	}

	return url, nil
}
