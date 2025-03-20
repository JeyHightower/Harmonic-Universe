#!/bin/bash

echo "🚀 Starting backend and frontend..."

# Check if backend is already running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
  echo "✅ Backend already running"
  BACKEND_RUNNING=true
else
  echo "🚀 Starting backend in the background..."
  cd backend
  # Start backend with proper error handling
  python -m app &
  BACKEND_PID=$!
  cd ..

  # Give backend a moment to start
  echo "⏳ Waiting for backend to start..."
  sleep 3

  # Check if backend started successfully
  if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend started successfully!"
  else
    echo "⚠️ Backend may not have started properly, but continuing anyway."
    echo "   Frontend will fall back to mock data for API endpoints."
  fi
fi

# Start frontend with the improved configuration
echo "🚀 Starting frontend..."
cd frontend
npm run dev

# When frontend stops, kill the backend if we started it
if [ -n "$BACKEND_PID" ]; then
  echo "🛑 Stopping backend (PID: $BACKEND_PID)..."
  kill $BACKEND_PID 2>/dev/null || true
fi
