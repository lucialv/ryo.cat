# build
FROM golang:1.24 AS builder
WORKDIR /app
COPY api/go.mod api/go.sum ./
RUN go mod download

COPY api/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /server ./cmd

# runtime
FROM gcr.io/distroless/base-debian12
COPY --from=builder /server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]