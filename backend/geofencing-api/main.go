package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	_ "github.com/lib/pq"
)

var db *sql.DB

func main() {
	var err error
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL environment variable is required")
	}

	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to open db: %v", err)
	}
	defer db.Close()

	http.HandleFunc("/api/v1/zone", handleZoneQuery)

	log.Println("Geofencing API listening on :8082")
	if err := http.ListenAndServe(":8082", nil); err != nil {
		log.Fatal(err)
	}
}

func handleZoneQuery(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")

	if latStr == "" || lngStr == "" {
		http.Error(w, `{"error": "lat and lng parameters are required"}`, http.StatusBadRequest)
		return
	}

	lat, err1 := strconv.ParseFloat(latStr, 64)
	lng, err2 := strconv.ParseFloat(lngStr, 64)

	if err1 != nil || err2 != nil {
		http.Error(w, `{"error": "Invalid coordinates"}`, http.StatusBadRequest)
		return
	}

	zone, err := findZone(lat, lng)
	if err != nil {
		if err == sql.ErrNoRows {
			// Not inside any surge zone, return default
			defaultZone := Zone{
				ZoneID:             "default",
				BaseFareMultiplier: 1.0,
				SurgeMultiplier:    1.0,
				SurgeActive:        false,
			}
			json.NewEncoder(w).Encode(defaultZone)
			return
		}
		log.Printf("DB error: %v", err)
		http.Error(w, `{"error": "Internal server error"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(zone)
}

func findZone(lat, lng float64) (Zone, error) {
	var z Zone
	// ST_Contains checks if the polygon contains the point.
	// ST_SetSRID(ST_MakePoint(lng, lat), 4326) creates the point geometry.
	query := `
		SELECT zone_id, base_fare_multiplier, surge_multiplier, surge_active
		FROM pricing_zones
		WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
		LIMIT 1;
	`
	err := db.QueryRow(query, lng, lat).Scan(
		&z.ZoneID,
		&z.BaseFareMultiplier,
		&z.SurgeMultiplier,
		&z.SurgeActive,
	)
	return z, err
}
