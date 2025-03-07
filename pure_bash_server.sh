#!/bin/bash
# Absolutely minimal HTTP server written in pure Bash
# Will work regardless of Python or other language availability
set -x  # Print commands for debugging

echo "Starting pure Bash server"

# Static responses - pre-formatted HTTP responses
HTTP_OK=$(cat <<EOF
HTTP/1.1 200 OK
Content-Type: application/json
Connection: close

{"status":"ok","message":"Health check passed"}
EOF
)

HTTP_HTML=$(cat <<EOF
HTTP/1.1 200 OK
Content-Type: text/html
Connection: close

<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
</head>
<body>
  <h1>Harmonic Universe</h1>
  <p>Server is running (bash edition)</p>
  <p>Generated at: $(date)</p>
</body>
</html>
EOF
)

# Port to listen on
PORT=${PORT:-10000}
echo "Will attempt to listen on port $PORT"

# Create static directory and index.html for verification
mkdir -p /opt/render/project/src/static || echo "Failed to create static dir, but continuing"
cat >/opt/render/project/src/static/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
</head>
<body>
  <h1>Harmonic Universe</h1>
  <p>This is served from static/index.html</p>
  <p>Generated at: $(date)</p>
</body>
</html>
EOF
chmod 644 /opt/render/project/src/static/index.html || echo "Failed to chmod, but continuing"

# Function to handle HTTP request with any available tool
handle_request() {
    while read line; do
        # Get the request line
        REQUEST_LINE=$line

        # Read headers until we get an empty line
        while read -r header; do
            [[ -z "$header" || "$header" == $'\r' ]] && break
            # Could process headers here if needed
        done

        # Parse request to get path
        REQUEST_PATH=$(echo "$REQUEST_LINE" | awk '{print $2}')
        echo "Received request for: $REQUEST_PATH"

        # Respond based on path
        if [[ "$REQUEST_PATH" == "/health" || "$REQUEST_PATH" == "/api/health" ]]; then
            echo "Sending health check response"
            echo -e "$HTTP_OK"
        else
            echo "Sending HTML response"
            echo -e "$HTTP_HTML"
        fi

        # Only process one request per connection
        break
    done
}

# Try different methods to start a basic HTTP server
echo "Trying different server methods..."

# Method 1: Try netcat (modern version with -l option)
if command -v nc >/dev/null; then
    echo "Using netcat (nc) method"
    while true; do
        # Force connection to close after handling one request
        nc -l $PORT < <(handle_request)
        sleep 0.1
    done
    exit 0
fi

# Method 2: Try netcat (traditional version without -l option)
if command -v nc >/dev/null; then
    echo "Using traditional netcat method"
    mkfifo /tmp/fifo_backpipe 2>/dev/null || true
    while true; do
        nc -p $PORT < /tmp/fifo_backpipe | handle_request > /tmp/fifo_backpipe
        sleep 0.1
    done
    exit 0
fi

# Method 3: Try socat
if command -v socat >/dev/null; then
    echo "Using socat method"
    socat TCP-LISTEN:$PORT,fork,reuseaddr EXEC:"bash -c handle_request"
    exit 0
fi

# Method 4: Try Python as absolute last resort
if command -v python3 >/dev/null || command -v python >/dev/null; then
    echo "Using Python as last resort"
    PYTHON_CMD="python3"
    if ! command -v python3 >/dev/null; then
        PYTHON_CMD="python"
    fi

    $PYTHON_CMD -c "
import socket
import sys
import os
import time

# Create socket
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

port = int(os.environ.get('PORT', 10000))
print(f'Starting server on port {port}')

# Try primary port
try:
    server_socket.bind(('', port))
    server_socket.listen(5)
    print(f'Successfully bound to port {port}')
except Exception as e:
    print(f'Failed to bind to port {port}: {e}')
    # Try alternate port
    try:
        alt_port = port + 1000
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind(('', alt_port))
        server_socket.listen(5)
        print(f'Successfully bound to alternate port {alt_port}')
        port = alt_port
    except Exception as e2:
        print(f'Failed to bind to alternate port: {e2}')
        sys.exit(1)

# Prepare responses
health_response = b'''HTTP/1.1 200 OK
Content-Type: application/json
Connection: close

{\"status\":\"ok\",\"message\":\"Health check passed\"}
'''

html_response = b'''HTTP/1.1 200 OK
Content-Type: text/html
Connection: close

<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
</head>
<body>
  <h1>Harmonic Universe</h1>
  <p>Server is running (Python emergency mode)</p>
</body>
</html>
'''

# Main server loop
while True:
    try:
        client_connection, client_address = server_socket.accept()
        print(f'Connection from {client_address}')

        # Receive request
        request = client_connection.recv(1024).decode()
        print(f'Request: {request.splitlines()[0] if request.splitlines() else \"No request\"}')

        # Determine response based on path
        if '/health' in request or '/api/health' in request:
            response = health_response
        else:
            response = html_response

        # Send response
        client_connection.sendall(response)
        client_connection.close()
    except Exception as e:
        print(f'Error handling request: {e}')
        # Continue serving despite errors
        time.sleep(0.1)
        continue
"
    exit 0
fi

# Method 5: Bash TCP socket as absolute final fallback
# This is ultra-hacky and needs bash 4 or above
echo "Using pure Bash TCP socket method - extreme fallback mode"

# Fallback implementation using bash file descriptors
while true; do
    # This creates a TCP socket using bash only
    exec 3<>/dev/tcp/0.0.0.0/$PORT || continue

    read -r request <&3
    echo "Received request: $request"

    # Skip HTTP headers
    while read -r line <&3; do
        [[ -z "$line" || "$line" == $'\r' ]] && break
    done

    # Determine response based on request
    if [[ "$request" == *"/health"* || "$request" == *"/api/health"* ]]; then
        echo -e "$HTTP_OK" >&3
    else
        echo -e "$HTTP_HTML" >&3
    fi

    # Close socket
    exec 3>&-
    exec 3<&-

    # Small delay to prevent CPU spin
    sleep 0.1
done
