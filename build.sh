#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Copying frontend build to backend static resources..."
mkdir -p src/main/resources/static
# Clear existing static files to prevent stale assets
rm -rf src/main/resources/static/*
cp -r frontend/out/* src/main/resources/static/

echo "Building backend..."
./mvnw clean package -DskipTests
