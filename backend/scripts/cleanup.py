import os
import shutil
import glob

# Define directories and files to clean
CLEANUP_PATHS = [
    '../.pytest_cache',
    '../logs',
    '../test.db',
    '../*.pyc',
    '../__pycache__'
]

# Function to remove files and directories
def cleanup():
    for path in CLEANUP_PATHS:
        # Remove directories
        if os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
            print(f"Removed directory: {path}")
        # Remove files
        elif os.path.isfile(path):
            os.remove(path)
            print(f"Removed file: {path}")
        # Remove files matching pattern
        else:
            for file in glob.glob(path):
                os.remove(file)
                print(f"Removed file: {file}")

if __name__ == "__main__":
    cleanup()
