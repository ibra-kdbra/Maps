# Build Stage
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY main.go .
RUN go build -o ingestion-api main.go

# Run Stage
FROM debian:bookworm-slim

# Install Osmium Tool, Bash, and Docker CLI (to restart the OSRM container)
# We need docker.io or curl to install docker cli. Let's just install docker.io
RUN apt-get update && apt-get install -y osmium-tool bash docker.io && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/ingestion-api .

# Expose port
EXPOSE 8081

# Ensure the binary has execution rights
RUN chmod +x ingestion-api

CMD ["./ingestion-api"]
