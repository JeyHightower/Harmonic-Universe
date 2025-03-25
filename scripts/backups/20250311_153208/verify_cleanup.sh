#!/bin/bash

# Harmonic Universe - Cleanup Verification Script
# This script verifies that the codebase cleanup was successful

set -e # Exit on error

echo "====== Starting Cleanup Verification Process ======"
echo "$(date): Verification initiated"

# Function to check if a file exists
check_file() {
  local file="$1"
  local required="$2"

  if [ -f "$file" ]; then
    echo "✅ $file exists"
    return 0
  else
    if [ "$required" = "required" ]; then
      echo "❌ MISSING REQUIRED FILE: $file"
      return 1
    else
      echo "⚠️ $file does not exist (optional)"
      return 0
    fi
  fi
}

# Function to check if a directory exists
check_dir() {
  local dir="$1"
  local required="$2"

  if [ -d "$dir" ]; then
    echo "✅ Directory $dir exists"
    return 0
  else
    if [ "$required" = "required" ]; then
      echo "❌ MISSING REQUIRED DIRECTORY: $dir"
      return 1
    else
      echo "⚠️ Directory $dir does not exist (optional)"
      return 0
    fi
  fi
}

# Function to check for duplicates
check_for_duplicates() {
  local pattern="$1"
  local description="$2"

  echo "Checking for duplicate $description..."
  duplicates=$(find . -name "$pattern" -type f | sort)
  duplicate_count=$(echo "$duplicates" | wc -l | tr -d ' ')

  if [ "$duplicate_count" -gt 1 ]; then
    echo "⚠️ Found multiple $description files ($duplicate_count):"
    echo "$duplicates"
  else
    echo "✅ No duplicate $description files found"
  fi
}

echo "==== Verifying Directory Structure ===="

check_dir "./scripts" "required"
check_dir "./scripts/utils" "required"
check_dir "./static" "required"
check_dir "./static/js" "required"
check_dir "./static/css" "required"
check_dir "./static/assets" "required"
check_dir "./static/react-fixes" "required"
check_dir "./frontend" "required"
check_dir "./frontend/src" "required"
check_dir "./frontend/public" "required"
check_dir "./app" "required"

echo -e "\n==== Verifying Essential Scripts ===="

check_file "./scripts/build.sh" "required"
check_file "./scripts/start.sh" "required"
check_file "./scripts/render_build.sh" "required"
check_file "./scripts/start-gunicorn.sh" "required"
check_file "./scripts/run_local.sh" "required"
check_file "./scripts/utils/common.sh" "required"

echo -e "\n==== Verifying Static Files ===="

check_file "./static/index.html" "required"
check_file "./static/js/index.js" "required"
check_file "./static/js/Layout.js" "optional"
check_file "./static/js/Dashboard.js" "optional"
check_file "./static/js/Home.js" "optional"

echo -e "\n==== Verifying Frontend Files ===="

check_file "./frontend/public/index.html" "required"
check_file "./frontend/src/index.js" "required"
check_file "./frontend/src/App.jsx" "required"

echo -e "\n==== Verifying Python Files ===="

check_file "./app/__init__.py" "required"
check_file "./app/routes.py" "required"
check_file "./app.py" "required"
check_file "./wsgi.py" "required"

echo -e "\n==== Checking for Duplicate Files ===="

check_for_duplicates "build.sh" "build script"
check_for_duplicates "start.sh" "start script"
check_for_duplicates "render_build.sh" "render build script"
check_for_duplicates "wsgi.py" "WSGI file"
check_for_duplicates "index.html" "index.html"

echo -e "\n==== Checking Symlinks ===="

echo "Checking React fix symlinks..."
broken_links=0
for link in $(find ./static -type l); do
  target=$(readlink "$link")
  if [ ! -e "$target" ]; then
    echo "❌ Broken symlink: $link -> $target"
    broken_links=$((broken_links + 1))
  else
    echo "✅ Valid symlink: $link -> $target"
  fi
done

if [ "$broken_links" -eq 0 ]; then
  echo "✅ All symlinks are valid"
else
  echo "⚠️ Found $broken_links broken symlinks"
fi

echo -e "\n==== Checking Static Paths in Flask App ===="

# Check app.py for correct static path
if [ -f "./app.py" ]; then
  if grep -q "static_folder=os.path.join(os.path.dirname(__file__), 'static')" "./app.py"; then
    echo "✅ app.py has correct static folder path"
  else
    echo "⚠️ app.py might have incorrect static folder path"
  fi
fi

# Check app/__init__.py for correct static path
if [ -f "./app/__init__.py" ]; then
  if grep -q "static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))" "./app/__init__.py"; then
    echo "✅ app/__init__.py has correct static folder path"
  else
    echo "⚠️ app/__init__.py might have incorrect static folder path"
  fi
fi

echo -e "\n====== Verification Complete! ======"
echo "$(date): Verification process completed"

# Count any issues found
warnings=$(grep -c "⚠️" <<< "$(cat $0)")
errors=$(grep -c "❌" <<< "$(cat $0)")

echo "Found $warnings warnings and $errors errors"

if [ "$errors" -gt 0 ]; then
  echo "❌ Verification failed with $errors errors. Please check the output above."
  exit 1
else
  if [ "$warnings" -gt 0 ]; then
    echo "⚠️ Verification completed with $warnings warnings. Review the output above."
  else
    echo "✅ Verification completed successfully with no issues!"
  fi
  exit 0
fi
