# Build Stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o geofencing-api .

# Run Stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/geofencing-api .

EXPOSE 8082
CMD ["./geofencing-api"]
