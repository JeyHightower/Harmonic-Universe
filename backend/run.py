import os
import sys
import socket
from contextlib import closing

# Add the project root to the Python path
# This allows absolute imports like 'backend.app.core.pwd_context'
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)

# Function to check if a port is in use
def is_port_in_use(port):
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        return s.connect_ex(('localhost', port)) == 0

# Function to find an available port
def find_available_port(start_port, max_attempts=10):
    port = start_port
    for _ in range(max_attempts):
        if not is_port_in_use(port):
            return port
        port += 1
    return None

# Now imports will work correctly
from backend.app import create_app

# Create app instance with appropriate configuration
is_testing = os.environ.get('TEST_PORT') is not None
app = create_app(test_config={
    'TESTING': True,
    'DEBUG': True
} if is_testing else None)

if __name__ == '__main__':
    # Determine the appropriate port
    if is_testing:
        # In test mode, use TEST_PORT directly
        port = int(os.environ.get('TEST_PORT'))
    else:
        # In development/production, find an available port
        start_port = int(os.environ.get('PORT', 10000))
        port = find_available_port(start_port)
        if port is None:
            print(f"Error: Could not find an available port after {start_port+10}. Please free up a port or specify a different port.")
            sys.exit(1)
        if port != start_port:
            print(f"Port {start_port} is in use. Using alternative port {port}.")

    # Run the app on the selected port
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
