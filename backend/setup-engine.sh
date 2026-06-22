#!/bin/bash
set -e

echo "Starting the Map Engine Compilation Pipeline for Syria..."

# Ensure we are in the backend directory
cd "$(dirname "$0")"

# 1. Check if syria data is fully downloaded (we run wget to resume if broken)
echo "Ensuring OpenStreetMap baseline data is downloaded..."
mkdir -p data
wget -c -O data/syria-latest.osm.pbf https://download.geofabrik.de/asia/syria-latest.osm.pbf

# 2. Merge Baseline OSM with Custom JOSM overrides mapping data
echo "Merger Engine: Injecting local drawn roads into public baseline..."
# We use Debian slim to install osmium-tool from standard repos
docker run --rm -v $(pwd):/work \
    debian:bookworm-slim /bin/sh -c \
    "apt-get update && apt-get install -y osmium-tool && osmium merge /work/data/syria-latest.osm.pbf /work/custom-data/fixes.osm -o /work/data/syria-merged.osm.pbf --overwrite"

# 3. Vector Tile Generation (Planetiler)
echo "Tile Engine: Building ultra-fast vector tiles..."
# Note: planetiler requires Java and needs a few minutes to crunch the pbf.
docker run --rm -v $(pwd)/data:/data \
    -e JAVA_TOOL_OPTIONS="-Xmx2g" \
    ghcr.io/onthegomap/planetiler:latest \
    --osm-path=/data/syria-merged.osm.pbf \
    --output=/data/syria.pmtiles \
    --download \
    --force

# 4. Routing Graph Generation (OSRM-car profile)
echo "Routing Engine: Calculating custom road geometries..."
# Extract road networks based on car profile
docker run --rm -v $(pwd)/data:/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/syria-merged.osm.pbf
# Partition graphs algorithms
docker run --rm -v $(pwd)/data:/data osrm/osrm-backend osrm-partition /data/syria-merged.osrm
# Customize weights
docker run --rm -v $(pwd)/data:/data osrm/osrm-backend osrm-customize /data/syria-merged.osrm

echo "==================================="
echo "COMPILATION SUCCESSFUL."
echo "Your private Syrian map datasets are complete!"
echo "Run 'docker-compose up -d' in the backend/ folder to turn on the Map APIs."
echo "==================================="
