#!/bin/bash
set -e

echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Copying Frontend to Backend..."
rm -rf src/main/resources/static/*
mkdir -p src/main/resources/static
cp -r frontend/out/* src/main/resources/static/

echo "Building Backend..."
mvn clean package -DskipTests

echo "Build complete. Run with: java -jar target/cpi-backend-0.0.1-SNAPSHOT.jar"
