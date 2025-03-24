#!/bin/bash
# Script to verify the server is running correctly

# Get port from environment or use default
PORT=${PORT:-10000}
echo "Testing server on port $PORT..."

# Run basic health checks
echo "Checking health endpoint..."
HEALTH_CHECK=$(curl -s http://localhost:$PORT/health)
API_HEALTH_CHECK=$(curl -s http://localhost:$PORT/api/health)

# Check if "healthy" is in the response
if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "Health response: $HEALTH_CHECK"
fi

if echo "$API_HEALTH_CHECK" | grep -q "healthy"; then
    echo "✅ API Health check passed"
else
    echo "❌ API Health check failed"
    echo "API Health response: $API_HEALTH_CHECK"
fi

# Check if we can access the root endpoint
echo "Checking root endpoint..."
ROOT_RESPONSE=$(curl -s http://localhost:$PORT/)
if echo "$ROOT_RESPONSE" | grep -q "Harmonic Universe"; then
    echo "✅ Root endpoint accessible"
else
    echo "❌ Root endpoint not accessible"
    echo "Root response: $ROOT_RESPONSE"
fi

# Summary
if echo "$HEALTH_CHECK" | grep -q "healthy" && \
   echo "$API_HEALTH_CHECK" | grep -q "healthy" && \
   echo "$ROOT_RESPONSE" | grep -q "Harmonic Universe"; then
    echo "✅ All checks passed"
    exit 0
else
    echo "❌ Some checks failed"
    exit 1
fi
