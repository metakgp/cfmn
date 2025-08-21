#!/bin/bash

# Simple Docker build and push script
set -e

# Configuration
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-exempl4r}"
IMAGE_NAME="cfmn-backend"
TAG="latest"

# Check if GOOGLE_CLIENT_ID is set
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "Error: GOOGLE_CLIENT_ID environment variable is not set"
    echo "Please set it with: export GOOGLE_CLIENT_ID=your_client_id"
    exit 1
fi

echo "Building and pushing $DOCKERHUB_USERNAME/$IMAGE_NAME:$TAG..."

# Login to Docker Hub (interactive if no password set)
if [ -n "$DOCKERHUB_PASSWORD" ]; then
    echo "$DOCKERHUB_PASSWORD" | docker login --username "$DOCKERHUB_USERNAME" --password-stdin
else
    docker login --username "$DOCKERHUB_USERNAME"
fi

# Build and push
docker buildx build \
    --push \
    --tag "$DOCKERHUB_USERNAME/$IMAGE_NAME:$TAG" \
    --build-arg "VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" \
    .

echo "Done! Image pushed to $DOCKERHUB_USERNAME/$IMAGE_NAME:$TAG"