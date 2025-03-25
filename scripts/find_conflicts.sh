#!/bin/bash

# Harmonic Universe - Conflict Detection Script
# This script searches for conflicts in the codebase

set -e # Exit on error

echo "====== Starting Conflict Detection Process ======"
echo "$(date): Conflict detection initiated and moving to root directory"

cd ../

# Create a temporary directory for reports
REPORT_DIR="./conflict_reports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"
echo "Created report directory: $REPORT_DIR"

# Function to check for direct file duplicates
check_file_duplicates() {
  echo "==== Checking for direct file duplicates ===="

  # Create a temporary file for MD5 hashes
  HASH_FILE="$REPORT_DIR/file_hashes.txt"
  DUPLICATE_REPORT="$REPORT_DIR/duplicate_files.txt"

  echo "Calculating file hashes..." | tee -a "$DUPLICATE_REPORT"

  # Find all code files and calculate their MD5 hashes
  find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/venv/*" \
    -not -path "*/backups/*" -not -path "*/build/*" -not -path "*/dist/*" \
    -not -path "*/conflict_reports/*" \
    \( -name "*.py" -o -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.html" -o -name "*.css" -o -name "*.sh" \) \
    -exec md5sum {} \; | sort > "$HASH_FILE"

  echo "Finding duplicate files..." | tee -a "$DUPLICATE_REPORT"

  # Look for files with identical hashes
  prev_hash=""
  prev_file=""
  duplicate_count=0

  while read -r line; do
    hash=$(echo "$line" | awk '{print $1}')
    file=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ //')

    if [ "$hash" = "$prev_hash" ]; then
      if [ -z "$prev_dup_hash" ] || [ "$prev_dup_hash" != "$hash" ]; then
        echo -e "\nDuplicate set found (MD5: $hash):" >> "$DUPLICATE_REPORT"
        echo "  $prev_file" >> "$DUPLICATE_REPORT"
        prev_dup_hash="$hash"
        duplicate_count=$((duplicate_count + 1))
      fi
      echo "  $file" >> "$DUPLICATE_REPORT"
    fi

    prev_hash="$hash"
    prev_file="$file"
  done < "$HASH_FILE"

  echo -e "\nFound $duplicate_count sets of duplicate files" | tee -a "$DUPLICATE_REPORT"
  echo "Detailed report: $DUPLICATE_REPORT"
}

# Function to check for similar JavaScript files
check_js_similarity() {
  echo "==== Checking for similar JavaScript files ===="

  JS_SIMILARITY_REPORT="$REPORT_DIR/js_similarity.txt"
  echo "Checking JavaScript file similarity..." | tee -a "$JS_SIMILARITY_REPORT"

  # Get a list of all JS files
  JS_FILES_LIST="$REPORT_DIR/js_files.txt"
  find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/venv/*" \
    -not -path "*/backups/*" -not -path "*/build/*" -not -path "*/dist/*" \
    -not -path "*/conflict_reports/*" \
    \( -name "*.js" -o -name "*.jsx" \) > "$JS_FILES_LIST"

  # Compare each file against others using diff
  total_files=$(wc -l < "$JS_FILES_LIST")
  similar_count=0

  echo "Analyzing $total_files JavaScript files..." | tee -a "$JS_SIMILARITY_REPORT"

  while read -r file1; do
    while read -r file2; do
      # Skip comparing a file with itself
      if [ "$file1" = "$file2" ]; then
        continue
      fi

      # Get file sizes
      size1=$(wc -l < "$file1")
      size2=$(wc -l < "$file2")

      # Skip if files are very different in size (more than 50% difference)
      max_size=$((size1 > size2 ? size1 : size2))
      min_size=$((size1 < size2 ? size1 : size2))

      if [ $min_size -eq 0 ] || [ $(( max_size * 100 / min_size )) -gt 150 ]; then
        continue
      fi

      # Compare files
      diff_lines=$(diff -U 0 "$file1" "$file2" | grep -v "^@@" | grep -v "^---" | grep -v "^+++" | wc -l)

      # If files are at least 70% similar
      similarity_threshold=$(( min_size * 30 / 100 ))
      if [ "$diff_lines" -le "$similarity_threshold" ]; then
        similar_count=$((similar_count + 1))
        echo -e "\nPotentially similar files ($diff_lines diff lines, sizes: $size1, $size2):" >> "$JS_SIMILARITY_REPORT"
        echo "  $file1" >> "$JS_SIMILARITY_REPORT"
        echo "  $file2" >> "$JS_SIMILARITY_REPORT"
      fi
    done < "$JS_FILES_LIST"
  done < "$JS_FILES_LIST"

  echo -e "\nFound $similar_count potentially similar JavaScript file pairs" | tee -a "$JS_SIMILARITY_REPORT"
  echo "Detailed report: $JS_SIMILARITY_REPORT"
}

# Function to check for conflicting Python imports
check_python_imports() {
  echo "==== Checking for conflicting Python imports ===="

  PYTHON_IMPORT_REPORT="$REPORT_DIR/python_imports.txt"
  echo "Analyzing Python imports..." | tee -a "$PYTHON_IMPORT_REPORT"

  # Find all Python files
  PYTHON_FILES="$REPORT_DIR/python_files.txt"
  find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/venv/*" \
    -not -path "*/backups/*" -not -path "*/build/*" -not -path "*/dist/*" \
    -not -path "*/conflict_reports/*" \
    -name "*.py" > "$PYTHON_FILES"

  # Extract imports from each file
  IMPORTS_FILE="$REPORT_DIR/python_imports_list.txt"
  while read -r file; do
    echo "Analyzing imports in $file" | tee -a "$PYTHON_IMPORT_REPORT"

    # Extract all import statements
    grep -E "^(import|from) " "$file" | sort | uniq >> "$IMPORTS_FILE"

    # Look for potential circular imports
    module_name=$(basename "$file" .py)
    if grep -q "from $module_name import" "$file" || grep -q "import $module_name" "$file"; then
      echo "⚠️ Potential self-import in $file" | tee -a "$PYTHON_IMPORT_REPORT"
    fi
  done < "$PYTHON_FILES"

  # Check for duplicate modules with different paths
  echo -e "\nChecking for duplicate module imports..." | tee -a "$PYTHON_IMPORT_REPORT"
  grep -E "^from " "$IMPORTS_FILE" | sed 's/from \([^ ]*\).*/\1/' | sort | uniq -c | sort -nr | \
    while read -r count module; do
      if [ "$count" -gt 1 ]; then
        echo "Module '$module' is imported from $count different files" | tee -a "$PYTHON_IMPORT_REPORT"
      fi
    done
}

# Function to check for conflicting route definitions
check_route_conflicts() {
  echo "==== Checking for conflicting route definitions ===="

  ROUTE_CONFLICT_REPORT="$REPORT_DIR/route_conflicts.txt"
  echo "Analyzing Flask route definitions..." | tee -a "$ROUTE_CONFLICT_REPORT"

  # Look for all route definitions
  ROUTES_FILE="$REPORT_DIR/routes_list.txt"

  find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/venv/*" \
    -not -path "*/backups/*" -not -path "*/build/*" -not -path "*/dist/*" \
    -not -path "*/conflict_reports/*" \
    -name "*.py" -exec grep -l "@.*route" {} \; | \
    while read -r file; do
      echo "Extracting routes from $file" | tee -a "$ROUTE_CONFLICT_REPORT"

      # Extract route definitions with line numbers
      grep -n "@.*route" "$file" | \
        sed -E "s/^([0-9]+):.*@.*route\(['\"]([^'\"]*)['\"].*$/\1:\2:$file/" >> "$ROUTES_FILE"
    done

  # Sort routes and find duplicates
  if [ -f "$ROUTES_FILE" ]; then
    echo -e "\nChecking for duplicate route paths..." | tee -a "$ROUTE_CONFLICT_REPORT"

    # Extract unique routes
    cat "$ROUTES_FILE" | sed 's/^[0-9]*:\(.*\):.*$/\1/' | sort | uniq -c | sort -nr | \
      while read -r count route; do
        if [ "$count" -gt 1 ]; then
          echo -e "\nDuplicate route path: '$route' defined $count times:" | tee -a "$ROUTE_CONFLICT_REPORT"
          grep ":$route:" "$ROUTES_FILE" | \
            while read -r entry; do
              line=$(echo "$entry" | cut -d: -f1)
              file=$(echo "$entry" | cut -d: -f3-)
              echo "  Line $line in $file" | tee -a "$ROUTE_CONFLICT_REPORT"
            done
        fi
      done
  else
    echo "No route definitions found" | tee -a "$ROUTE_CONFLICT_REPORT"
  fi
}

# Function to check for conflicting static file references
check_static_conflicts() {
  echo "==== Checking for conflicting static file references ===="

  STATIC_CONFLICT_REPORT="$REPORT_DIR/static_conflicts.txt"
  echo "Analyzing static file references..." | tee -a "$STATIC_CONFLICT_REPORT"

  # Look for all static_folder definitions
  find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/venv/*" \
    -not -path "*/backups/*" -not -path "*/build/*" -not -path "*/dist/*" \
    -not -path "*/conflict_reports/*" \
    -name "*.py" -exec grep -l "static_folder" {} \; | \
    while read -r file; do
      echo "Static folder defined in $file:" | tee -a "$STATIC_CONFLICT_REPORT"
      grep -n "static_folder" "$file" | tee -a "$STATIC_CONFLICT_REPORT"
    done

  # Look for all Flask send_from_directory calls
  echo -e "\nChecking send_from_directory calls..." | tee -a "$STATIC_CONFLICT_REPORT"
  find . -type f -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/venv/*" \
    -not -path "*/backups/*" -not -path "*/build/*" -not -path "*/dist/*" \
    -not -path "*/conflict_reports/*" \
    -name "*.py" -exec grep -l "send_from_directory" {} \; | \
    while read -r file; do
      echo "send_from_directory used in $file:" | tee -a "$STATIC_CONFLICT_REPORT"
      grep -n "send_from_directory" "$file" | tee -a "$STATIC_CONFLICT_REPORT"
    done
}

# Run all conflict checks
check_file_duplicates
check_js_similarity
check_python_imports
check_route_conflicts
check_static_conflicts

echo -e "\n====== Conflict Detection Complete! ======"
echo "All conflict reports saved to: $REPORT_DIR"
echo "$(date): Conflict detection process completed"
