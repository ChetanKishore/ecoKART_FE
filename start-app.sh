#!/bin/bash

# Start Spring Boot backend in the background
echo "Starting Spring Boot backend..."
cd backend
nohup mvn spring-boot:run > ../spring-boot.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 15

# Start React frontend
echo "Starting React frontend..."
vite --host 0.0.0.0 --port 5000

# Cleanup function
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    pkill -f "spring-boot:run" 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for frontend to exit
wait