# Stage 1: Build the Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app

# Cache Maven dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and inject frontend static files
COPY src ./src
COPY --from=frontend-builder /app/frontend/out ./src/main/resources/static

# Build the JAR
RUN mvn clean package -DskipTests -B

# Stage 3: Lightweight production runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/target/cpi-backend-0.0.1-SNAPSHOT.jar app.jar

# Railway sets PORT dynamically
EXPOSE ${PORT:-8080}

ENTRYPOINT ["java", "-jar", "app.jar"]
