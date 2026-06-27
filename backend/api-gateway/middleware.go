package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var rdb *redis.Client
var ctx = context.Background()

func InitRedis(addr string) {
	rdb = redis.NewClient(&redis.Options{
		Addr: addr,
	})
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
}

// RateLimitMiddleware authenticates and rate limits via Redis
func RateLimitMiddleware(serviceName string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized: Missing or invalid token", http.StatusUnauthorized)
			return
		}
		
		token := strings.TrimPrefix(authHeader, "Bearer ")
		
		// In a real app, validate token existence. For now, token = tenantID.
		tenantID := token
		
		// Simple sliding window or daily limit. We'll do a daily limit for simplicity.
		key := fmt.Sprintf("rate:%s:%s:%s", tenantID, serviceName, time.Now().Format("2006-01-02"))
		
		// Increment usage
		usage, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		
		// Set expiration on first increment
		if usage == 1 {
			rdb.Expire(ctx, key, 24*time.Hour)
		}
		
		// Check limits
		limit := int64(1000) // Default limit: 1000 requests per day per service
		if usage > limit {
			http.Error(w, "429 Too Many Requests: Quota Exceeded", http.StatusTooManyRequests)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}
