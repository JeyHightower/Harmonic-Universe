#!/usr/bin/env python3
import os
import sys
import requests
import platform
import socket
import json

def check_static_files():
    """Check if static files exist and have content"""
    static_dir = "static"
    if not os.path.exists(static_dir):
        print(f"❌ Static directory missing: {static_dir}")
        os.makedirs(static_dir, exist_ok=True)
        print(f"✅ Created static directory: {static_dir}")
    else:
        print(f"✅ Static directory exists: {static_dir}")

    files = os.listdir(static_dir)
    print(f"Found {len(files)} files in static directory")

    # Check index.html
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        size = os.path.getsize(index_path)
        if size > 0:
            print(f"✅ index.html exists ({size} bytes)")
        else:
            print(f"❌ index.html exists but is empty")
            create_emergency_index()
    else:
        print(f"❌ index.html is missing")
        create_emergency_index()

def create_emergency_index():
    """Create an emergency index.html file"""
    static_dir = "static"
    os.makedirs(static_dir, exist_ok=True)

    with open(os.path.join(static_dir, "index.html"), "w") as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Harmonic Universe - Emergency Page</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #e74c3c; }
        p { color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe - Emergency Page</h1>
        <p>This is an emergency page created by the diagnostic script.</p>
        <p>If you're seeing this page, it means the original index.html was missing or empty.</p>
    </div>
</body>
</html>""")
    print("✅ Created emergency index.html")

def check_environment():
    """Check environment variables"""
    required_vars = ["PORT"]
    optional_vars = ["FLASK_ENV", "SECRET_KEY", "DATABASE_URL"]

    print("\n=== Environment Variables ===")
    for var in required_vars:
        if var in os.environ:
            print(f"✅ {var} is set to: {os.environ[var]}")
        else:
            print(f"❌ {var} is not set (required)")
            if var == "PORT":
                os.environ["PORT"] = "10000"
                print(f"  Set default {var}=10000")

    for var in optional_vars:
        if var in os.environ:
            value = os.environ[var]
            if var == "SECRET_KEY" or var == "DATABASE_URL":
                # Mask sensitive values
                value = value[:5] + "..." if value else "None"
            print(f"✅ {var} is set to: {value}")
        else:
            print(f"⚠️ {var} is not set (optional)")

def check_connectivity():
    """Check if the app can connect to itself"""
    print("\n=== Connectivity Tests ===")
    port = os.environ.get("PORT", "10000")

    # Check if port is already in use
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', int(port)))
    if result == 0:
        print(f"✅ Port {port} is in use (application may be running)")
    else:
        print(f"ℹ️ Port {port} is available")
    sock.close()

    # Try to connect to health endpoint
    try:
        response = requests.get(f"http://127.0.0.1:{port}/api/health", timeout=1)
        print(f"✅ Connected to health endpoint: status {response.status_code}")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(f"  Response: {response.text[:100]}...")
    except requests.RequestException as e:
        print(f"ℹ️ Could not connect to health endpoint: {str(e)}")

def run_diagnostics():
    """Run all diagnostic checks"""
    print("=== Harmonic Universe Diagnostics ===")
    print(f"Python version: {platform.python_version()}")
    print(f"OS: {platform.system()} {platform.release()}")

    check_static_files()
    check_environment()
    check_connectivity()

    print("\n=== Diagnostics Complete ===")
    print("To fix deployment issues:")
    print("1. Make sure build.sh is executable: chmod +x build.sh")
    print("2. Check Render logs for specific error messages")
    print("3. Ensure your app is listening on the PORT environment variable")
    print("4. Verify static files exist and have content")

if __name__ == "__main__":
    run_diagnostics()
