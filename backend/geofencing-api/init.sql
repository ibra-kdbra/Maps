CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS pricing_zones (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(100) UNIQUE NOT NULL,
    base_fare_multiplier FLOAT NOT NULL DEFAULT 1.0,
    surge_multiplier FLOAT NOT NULL DEFAULT 1.0,
    surge_active BOOLEAN NOT NULL DEFAULT FALSE,
    geom GEOMETRY(Polygon, 4326) NOT NULL
);

-- Create a spatial index
CREATE INDEX IF NOT EXISTS pricing_zones_geom_idx ON pricing_zones USING GIST (geom);

-- Seed a mock "mezzeh-central" zone for testing
INSERT INTO pricing_zones (zone_id, base_fare_multiplier, surge_multiplier, surge_active, geom)
VALUES (
    'mezzeh-central',
    1.0,
    1.5,
    TRUE,
    ST_GeomFromText('POLYGON((36.2400 33.5000, 36.2600 33.5000, 36.2600 33.5200, 36.2400 33.5200, 36.2400 33.5000))', 4326)
) ON CONFLICT (zone_id) DO NOTHING;
