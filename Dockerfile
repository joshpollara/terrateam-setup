# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /build

# Copy go mod files
COPY cmd/terrateam-setup/go.mod cmd/terrateam-setup/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY cmd/terrateam-setup/ ./

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o terrateam-setup .

# Runtime stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /build/terrateam-setup .

# Create directory for .env output
RUN mkdir -p /output

# Set the binary as executable
RUN chmod +x terrateam-setup

# Expose default port for OAuth callback
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/app/terrateam-setup"]

# Default help command
CMD ["--help"]
