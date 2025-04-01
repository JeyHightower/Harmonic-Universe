#!/usr/bin/env python3
"""
Diagnostic tool for troubleshooting Render.com deployment issues.
"""
import os
import sys
import platform
import shutil
import tempfile
import json
import time
import gc
import logging
from datetime import datetime

# Try to import optional packages
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

def get_memory_info():
    """Get memory usage information."""
    result = {
        "gc_enabled": gc.isenabled(),
        "gc_objects": len(gc.get_objects()),
    }
    
    if HAS_PSUTIL:
        process = psutil.Process(os.getpid())
        mem_info = process.memory_info()
        
        result.update({
            "rss_mb": mem_info.rss / (1024 * 1024),
            "vms_mb": mem_info.vms / (1024 * 1024),
            "percent": process.memory_percent(),
            "system_total_mb": psutil.virtual_memory().total / (1024 * 1024),
            "system_available_mb": psutil.virtual_memory().available / (1024 * 1024),
            "system_percent": psutil.virtual_memory().percent,
        })
    
    return result

def check_file_access():
    """Test file creation and permission access."""
    result = {
        "cwd": os.getcwd(),
        "home_writable": os.access(os.path.expanduser("~"), os.W_OK),
        "temp_writable": os.access(tempfile.gettempdir(), os.W_OK),
    }
    
    # Check current directory
    try:
        test_file = "test_write_access.tmp"
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        result["cwd_writable"] = True
    except Exception as e:
        result["cwd_writable"] = False
        result["cwd_error"] = str(e)
    
    # Check static directory
    static_dir = os.path.join(os.getcwd(), "static")
    result["static_exists"] = os.path.exists(static_dir)
    
    if result["static_exists"]:
        result["static_is_dir"] = os.path.isdir(static_dir)
        result["static_readable"] = os.access(static_dir, os.R_OK)
        result["static_writable"] = os.access(static_dir, os.W_OK)
        result["static_executable"] = os.access(static_dir, os.X_OK)
        
        # List static directory contents
        try:
            result["static_contents"] = os.listdir(static_dir)
        except Exception as e:
            result["static_list_error"] = str(e)
        
        # Check for index.html specifically
        index_path = os.path.join(static_dir, "index.html")
        result["index_exists"] = os.path.exists(index_path)
        
        if result["index_exists"]:
            result["index_readable"] = os.access(index_path, os.R_OK)
            result["index_size"] = os.path.getsize(index_path)
            
            # Try to read the first few lines
            try:
                with open(index_path, "r") as f:
                    result["index_content"] = f.read(500)
            except Exception as e:
                result["index_read_error"] = str(e)
    
    return result

def get_environment():
    """Get information about the environment."""
    result = {
        "platform": platform.platform(),
        "python_version": sys.version,
        "python_path": sys.executable,
        "cwd": os.getcwd(),
        "user": os.getenv("USER"),
        "home": os.path.expanduser("~"),
        "disk_space": {},
        "env_vars": {
            var: os.environ[var]
            for var in os.environ
            if not var.startswith("SECRET") and not var.startswith("PASSWORD")
        }
    }
    
    # Check disk space
    total, used, free = shutil.disk_usage("/")
    result["disk_space"] = {
        "total_gb": total / (1024**3),
        "used_gb": used / (1024**3),
        "free_gb": free / (1024**3),
        "percent_used": used / total * 100
    }
    
    return result

def test_network():
    """Test network connectivity."""
    result = {}
    
    if HAS_REQUESTS:
        # Test internal API routes
        try:
            response = requests.get("http://localhost:10000/api/health", timeout=2)
            result["internal_health_api"] = {
                "status_code": response.status_code,
                "response": response.text[:500]
            }
        except Exception as e:
            result["internal_health_api_error"] = str(e)
        
        # Test external connectivity
        try:
            response = requests.get("https://www.google.com", timeout=5)
            result["google_reachable"] = response.status_code == 200
        except Exception as e:
            result["google_error"] = str(e)
        
        # Get public IP info
        try:
            response = requests.get("https://httpbin.org/ip", timeout=5)
            result["public_ip"] = response.json()
        except Exception as e:
            result["public_ip_error"] = str(e)
    else:
        result["requests_not_available"] = True
    
    return result

def main():
    """Main diagnostic function."""
    timestamp = datetime.now().isoformat()
    
    # Set up logging
    log_file = "diagnostic.log"
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )
    
    logging.info(f"Starting diagnostics at {timestamp}")
    
    diagnostic_data = {
        "timestamp": timestamp,
        "environment": get_environment(),
        "memory": get_memory_info(),
        "file_access": check_file_access(),
        "network": test_network()
    }
    
    # Write the results to a file
    output_file = "diagnostic_results.json"
    with open(output_file, "w") as f:
        json.dump(diagnostic_data, f, indent=2)
    
    # Print a summary to stdout
    print(f"Diagnostics complete. Results written to {output_file}")
    print("\nSummary:")
    print(f"- Python: {sys.version.split()[0]}")
    print(f"- Platform: {platform.system()} {platform.release()}")
    print(f"- Static directory: {'exists' if diagnostic_data['file_access'].get('static_exists', False) else 'missing'}")
    
    if HAS_PSUTIL:
        print(f"- Memory usage: {diagnostic_data['memory'].get('rss_mb', 0):.1f} MB")
    
    print(f"\nLog written to {log_file}")
    print(f"Full diagnostic data written to {output_file}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 