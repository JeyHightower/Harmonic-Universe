import os
import subprocess
import sys

# Force remove any SQLAlchemy installations
print("Removing SQLAlchemy...")
try:
    subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "-y", "SQLAlchemy"])
    subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "-y", "sqlalchemy"])
except:
    print("SQLAlchemy might not be installed or couldn't be removed")

# Install the correct version
print("Installing SQLAlchemy 1.4.41...")
subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-cache-dir", "sqlalchemy==1.4.41"])

print("Dependency cleanup complete")
