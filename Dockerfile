# --- Maplewood Course Planning: Production Dockerfile ---
# Multi-stage build: Java 25 + Maven + Node 20 + SQLite

# --- Stage 1: Build frontend ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build backend ---
FROM maven:3.9.7-eclipse-temurin-25 AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml ./
COPY backend/ ./
RUN mvn -B package -DskipTests

# --- Stage 3: Production runtime ---
FROM eclipse-temurin:25-jdk-jammy AS runtime

# Install SQLite3 CLI (for debugging, optional)
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy SQLite database
COPY maplewood_school.sqlite ./

# Copy backend JAR
COPY --from=backend-build /app/backend/target/*.jar ./app.jar

# Copy frontend static build
COPY --from=frontend-build /app/frontend/dist ./frontend

# Expose backend and frontend ports
EXPOSE 8080 5173

# Start Spring Boot backend and serve frontend (Vite preview)
# In production, you may want to use nginx or serve as static files from Spring Boot
CMD java -jar app.jar & npx serve -s ./frontend -l 5173 && wait
