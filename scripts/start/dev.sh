#!/bin/bash

# Change to the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

echo "Starting Harmonic Universe development environment..."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend will be available at: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Start both servers
npm run start
