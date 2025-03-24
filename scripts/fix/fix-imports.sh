#!/bin/bash

# ================================================================
# Fix Imports Script for Reorganized Codebase
# ================================================================
# This script helps fix import issues after reorganization
# Run this if you find import errors in your reorganized codebase
# ================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                  HARMONIC UNIVERSE IMPORT FIXER                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Project root directory
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"
LOG_FILE="${PROJECT_ROOT}/fix_imports.log"

# Log message to console and file
log() {
    local level=$1
    local message=$2
    local color=$NC

    case $level in
        "INFO") color=$GREEN ;;
        "WARNING") color=$YELLOW ;;
        "ERROR") color=$RED ;;
    esac

    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [${level}] ${message}${NC}" | tee -a "$LOG_FILE"
}

# Function to find missing imports
find_missing_imports() {
    log "INFO" "Scanning for missing imports..."

    # Find all JS/JSX/TS/TSX files
    find "${FRONTEND_DIR}" "${BACKEND_DIR}" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
        local filename=$(basename "$file")
        # Try running node to check for import errors
        node --check "$file" 2>/dev/null || {
            log "WARNING" "Potential import issue in: $file"
            echo "$file" >> "${PROJECT_ROOT}/files_with_import_issues.txt"
        }
    done

    local issue_count=$(cat "${PROJECT_ROOT}/files_with_import_issues.txt" 2>/dev/null | wc -l || echo 0)

    if [ "$issue_count" -gt 0 ]; then
        log "INFO" "Found $issue_count files with potential import issues."
        log "INFO" "List saved to: ${PROJECT_ROOT}/files_with_import_issues.txt"
    else
        log "INFO" "No files with import issues found!"
    fi
}

# Function to suggest import fixes
suggest_import_fixes() {
    log "INFO" "Suggesting import fixes..."

    if [ ! -f "${PROJECT_ROOT}/files_with_import_issues.txt" ]; then
        log "ERROR" "No import issues file found. Run find_missing_imports first."
        return 1
    fi

    # Create suggestions file
    > "${PROJECT_ROOT}/import_fix_suggestions.txt"

    cat "${PROJECT_ROOT}/files_with_import_issues.txt" | while read -r file; do
        echo "File: $file" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"
        echo "--------------------------------------------------" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"

        # Extract imports
        grep -n "import.*from\|require(" "$file" 2>/dev/null | while read -r import_line; do
            local line_num=$(echo "$import_line" | cut -d':' -f1)
            local import_stmt=$(echo "$import_line" | cut -d':' -f2-)

            # Extract the path from the import statement
            local import_path=""
            if [[ "$import_stmt" == *"from "* ]]; then
                import_path=$(echo "$import_stmt" | sed -n "s/.*from ['\"]\\(.*\\)['\"]\(;*\)/\\1/p")
            elif [[ "$import_stmt" == *"require("* ]]; then
                import_path=$(echo "$import_stmt" | sed -n "s/.*require(['\"]\\(.*\\)['\"]).*/\\1/p")
            fi

            # Skip if not a relative path
            if [[ "$import_path" != "./"* && "$import_path" != "../"* ]]; then
                continue
            fi

            # Try to find the file
            local import_dir=$(dirname "$file")
            local potential_file="${import_dir}/${import_path}.js"

            if [ ! -f "$potential_file" ]; then
                potential_file="${import_dir}/${import_path}.jsx"
            fi

            if [ ! -f "$potential_file" ]; then
                potential_file="${import_dir}/${import_path}.ts"
            fi

            if [ ! -f "$potential_file" ]; then
                potential_file="${import_dir}/${import_path}.tsx"
            fi

            if [ ! -f "$potential_file" ]; then
                echo "Line $line_num: $import_stmt" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"
                echo "  Import path not found: $import_path" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"

                # Suggest alternatives by searching for the base filename
                local base_filename=$(basename "$import_path")
                local found_files=$(find "${FRONTEND_DIR}" "${BACKEND_DIR}" -name "${base_filename}*" | head -n 5)

                if [ -n "$found_files" ]; then
                    echo "  Possible alternatives:" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"
                    echo "$found_files" | while read -r alt_file; do
                        local rel_path=$(realpath --relative-to="$import_dir" "$alt_file")
                        # Remove file extension from suggested path
                        rel_path="${rel_path%.js}"
                        rel_path="${rel_path%.jsx}"
                        rel_path="${rel_path%.ts}"
                        rel_path="${rel_path%.tsx}"

                        # Make sure it starts with ./ or ../
                        if [[ "$rel_path" != "./"* && "$rel_path" != "../"* ]]; then
                            rel_path="./$rel_path"
                        fi

                        echo "    - $rel_path" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"
                    done
                else
                    echo "  No alternatives found." >> "${PROJECT_ROOT}/import_fix_suggestions.txt"
                fi

                echo "" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"
            fi
        done

        echo "" >> "${PROJECT_ROOT}/import_fix_suggestions.txt"
    done

    log "INFO" "Import fix suggestions saved to: ${PROJECT_ROOT}/import_fix_suggestions.txt"
}

# Main execution
main() {
    echo "This script helps fix import issues after reorganization."
    echo "Options:"
    echo "  1. Find files with potential import issues"
    echo "  2. Generate import fix suggestions"
    echo "  3. Run both steps"
    echo "  4. Exit"
    echo ""
    echo -n "Enter your choice (1-4): "
    read -r choice

    case $choice in
        1)
            find_missing_imports
            ;;
        2)
            suggest_import_fixes
            ;;
        3)
            find_missing_imports
            suggest_import_fixes
            ;;
        4)
            echo "Exiting."
            exit 0
            ;;
        *)
            echo "Invalid choice. Exiting."
            exit 1
            ;;
    esac

    log "INFO" "Operation completed!"
}

# Run the main function
main

exit 0
