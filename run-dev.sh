#!/bin/bash

# Kill existing processes
pkill -f "spring-boot:run" || true
pkill -f "vite" || true

echo "Starting EcoKART development environment..."

# Start Spring Boot backend
echo "Starting Spring Boot backend on port 8080..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!

# Wait a moment then start frontend
cd ..
echo "Starting React frontend on port 5000..."
npx vite --host 0.0.0.0 --port 5000 &
FRONTEND_PID=$!

echo "Development servers started:"
echo "- Backend: http://localhost:8080"
echo "- Frontend: http://localhost:5000"

# Keep script running
wait