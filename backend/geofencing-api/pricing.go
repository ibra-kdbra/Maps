package main

// Zone represents the pricing metadata tied to a spatial polygon.
type Zone struct {
	ZoneID             string  `json:"zone_id"`
	BaseFareMultiplier float64 `json:"base_fare_multiplier"`
	SurgeMultiplier    float64 `json:"surge_multiplier"`
	SurgeActive        bool    `json:"surge_active"`
}
