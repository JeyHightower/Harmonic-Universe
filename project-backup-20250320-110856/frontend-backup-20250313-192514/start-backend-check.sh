#!/bin/bash

echo "🔍 Checking backend health..."

# Try to reach the backend
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
  echo "✅ Backend is running!"
else
  echo "⚠️ Backend does not appear to be running."
  echo "   To start the backend, run: cd backend && python -m app"
  echo ""
  echo "🔧 For development, you can continue using the frontend with API mocks."
  echo "   Or use our start-dev.sh script to start both frontend and backend."
fi

