#!/bin/bash

# Kill any existing processes
pkill -f "spring-boot:run"
pkill -f "vite"

# Start Spring Boot backend in background
cd backend
nohup mvn spring-boot:run > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Starting Spring Boot backend..."
sleep 30

# Start Vite frontend
cd ../
echo "Starting Vite frontend..."
npx vite --host 0.0.0.0 --port 3000

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT