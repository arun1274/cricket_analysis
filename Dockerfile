# Build stage
FROM maven:3.9.6-eclipse-temurin-17-jammy AS build
WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Copy project files
COPY . .

# Make the build script executable and run it
RUN chmod +x build.sh
RUN ./build.sh

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
