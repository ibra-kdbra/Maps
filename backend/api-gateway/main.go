package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

func newProxy(target string) *httputil.ReverseProxy {
	url, _ := url.Parse(target)
	return httputil.NewSingleHostReverseProxy(url)
}

func stripPrefixProxy(prefix, target string) http.Handler {
	url, _ := url.Parse(target)
	proxy := httputil.NewSingleHostReverseProxy(url)
	return http.StripPrefix(prefix, proxy)
}

func main() {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}
	InitRedis(redisAddr)

	tilesProxy := stripPrefixProxy("/tiles", "http://tileserver:8080")
	// OSRM usually listens on /route/v1/driving/ (the profile name is 'driving' for car)
	carProxy := stripPrefixProxy("/route/v1/car", "http://osrm-car:5000/route/v1/driving")
	motoProxy := stripPrefixProxy("/route/v1/motorcycle", "http://osrm-motorcycle:5000/route/v1/driving")
	// Geofence API listens on /api/v1/zone
	geoProxy := stripPrefixProxy("/geofence", "http://geofencing-api:8082")

	mux := http.NewServeMux()

	// Map routes
	mux.Handle("/tiles/", RateLimitMiddleware("tiles", tilesProxy))
	mux.Handle("/route/v1/car/", RateLimitMiddleware("routing", carProxy))
	mux.Handle("/route/v1/motorcycle/", RateLimitMiddleware("routing", motoProxy))
	mux.Handle("/geofence/", RateLimitMiddleware("geofencing", geoProxy))

	// Start Server
	log.Println("API Gateway running on 0.0.0.0:8000")
	log.Fatal(http.ListenAndServe("0.0.0.0:8000", mux))
}
