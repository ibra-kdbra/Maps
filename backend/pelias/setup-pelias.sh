#!/usr/bin/env bash
set -e

# Change directory to script location to ensure relative paths work
cd "$(dirname "$0")"

echo "=== [1/4] Starting Elasticsearch ==="
docker-compose up -d elasticsearch

echo "Waiting for Elasticsearch to be ready..."
MAX_ATTEMPTS=60
attempt=1
ready=0

while [ $attempt -le $MAX_ATTEMPTS ]; do
  if curl -s "http://localhost:9200/_cluster/health" | grep -q -E '"status":"(green|yellow)"'; then
    ready=1
    break
  fi
  echo "Attempt $attempt/$MAX_ATTEMPTS: Elasticsearch not ready yet. Retrying in 2s..."
  sleep 2
  attempt=$((attempt+1))
done

if [ $ready -ne 1 ]; then
  echo "Error: Elasticsearch failed to become ready in time."
  exit 1
fi

echo "Elasticsearch is ready and healthy!"

echo "=== [2/4] Initializing Elasticsearch Schema ==="
docker-compose run --rm schema ./bin/create_index

echo "=== [3/4] Importing OpenStreetMap Data ==="
docker-compose run --rm openstreetmap

echo "=== [4/4] Starting Pelias API service ==="
docker-compose up -d api

echo "=== Setup complete! Pelias geocoder API is running at http://localhost:4000 ==="
