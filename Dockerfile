# Stage 1: Build the Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Inject the compiled frontend into Spring Boot's static resources
COPY --from=frontend-builder /app/frontend/out ./src/main/resources/static
RUN mvn clean package -DskipTests

# Stage 3: Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/target/cpi-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
