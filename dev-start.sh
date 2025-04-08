#!/bin/bash

# Start the backend server
cd backend && FLASK_APP=wsgi.py flask run --debug --port=5001 &
BACKEND_PID=$!

# Start the frontend server
cd ../frontend && npm start &
FRONTEND_PID=$!

# Setup trap to kill both processes on exit
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Keep script running
wait
