#!/bin/bash

# Script to debug port binding issues on Render.com

echo "***** RENDER PORT DEBUGGING *****"
echo "Current directory: $(pwd)"
echo "Checking environment variables..."
echo "PORT: $PORT"
echo "RENDER: $RENDER"
echo "PYTHONPATH: $PYTHONPATH"

echo "Checking for listening ports..."
# This requires ss or netstat to be installed
if command -v ss &> /dev/null; then
    ss -tuln
elif command -v netstat &> /dev/null; then
    netstat -tuln
else
    echo "Neither ss nor netstat available for port checking"
fi

echo "Checking process list..."
ps -ef

echo "Starting gunicorn with explicit port binding..."
export RENDER=true
export PORT=${PORT:-10000}
echo "Using PORT: $PORT"

# Start with debug logging
PYTHONPATH=/opt/render/project/src gunicorn backend.app.main:app \
    --bind 0.0.0.0:$PORT \
    --log-level debug \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
