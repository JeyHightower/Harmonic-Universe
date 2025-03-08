import os
import sys

# Create and verify static directories
static_dirs = [
    '/opt/render/project/src/static',
    '/app/static'
]

for static_dir in static_dirs:
    try:
        os.makedirs(static_dir, exist_ok=True)
        print(f"Created or verified directory: {static_dir}")

        # Check if index.html exists, create if not
        index_path = os.path.join(static_dir, 'index.html')
        if not os.path.exists(index_path):
            with open(index_path, 'w') as f:
                f.write("<html><body><h1>Hello from Render</h1></body></html>")
            print(f"Created index.html at {index_path}")
            os.chmod(index_path, 0o666)

        # Create health endpoint files
        health_path = os.path.join(static_dir, 'health')
        if not os.path.exists(health_path):
            with open(health_path, 'w') as f:
                f.write('{"status":"healthy","message":"Health check passed"}')
            print(f"Created health file at {health_path}")
            os.chmod(health_path, 0o666)

        # Create API health endpoint files
        api_dir = os.path.join(static_dir, 'api')
        os.makedirs(api_dir, exist_ok=True)
        api_health_path = os.path.join(api_dir, 'health')
        if not os.path.exists(api_health_path):
            with open(api_health_path, 'w') as f:
                f.write('{"status":"healthy","message":"Health check passed"}')
            print(f"Created API health file at {api_health_path}")
            os.chmod(api_health_path, 0o666)

    except Exception as e:
        print(f"Error setting up {static_dir}: {e}", file=sys.stderr)

# Create symbolic link between directories if needed
if os.path.exists('/opt/render/project/src/static') and not os.path.exists('/app/static'):
    try:
        os.makedirs('/app', exist_ok=True)
        os.symlink('/opt/render/project/src/static', '/app/static')
        print("Created symbolic link from /opt/render/project/src/static to /app/static")
    except Exception as e:
        print(f"Error creating symlink: {e}", file=sys.stderr)
