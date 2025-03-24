#!/bin/bash

# ================================================================
# Codebase Reorganization Script for Harmonic Universe
# ================================================================
# This script reorganizes the entire codebase (frontend, backend, root)
# - Handles nested directories
# - Detects and resolves duplicate files
# - Removes empty files and directories
# - Creates a single source of truth
# - Updates imports after reorganization
# ================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                  HARMONIC UNIVERSE REORGANIZER                   ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ================================================================
# Configuration
# ================================================================

# Move to root directory
cd .. 

# Project root (current directory)
PROJECT_ROOT=$(pwd)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${PROJECT_ROOT}/backup_${TIMESTAMP}"
LOG_FILE="${PROJECT_ROOT}/reorganize_${TIMESTAMP}.log"

# New directory structure
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"

# Frontend subdirectories
FRONTEND_SRC="${FRONTEND_DIR}/src"
FRONTEND_COMPONENTS="${FRONTEND_SRC}/components"
FRONTEND_CONTAINERS="${FRONTEND_SRC}/containers"
FRONTEND_HOOKS="${FRONTEND_SRC}/hooks"
FRONTEND_UTILS="${FRONTEND_SRC}/utils"
FRONTEND_STYLES="${FRONTEND_SRC}/styles"
FRONTEND_ASSETS="${FRONTEND_SRC}/assets"
FRONTEND_TESTS="${FRONTEND_DIR}/tests"
FRONTEND_CONFIG="${FRONTEND_DIR}/config"

# Backend subdirectories
BACKEND_SRC="${BACKEND_DIR}/src"
BACKEND_ROUTES="${BACKEND_SRC}/routes"
BACKEND_CONTROLLERS="${BACKEND_SRC}/controllers"
BACKEND_MODELS="${BACKEND_SRC}/models"
BACKEND_UTILS="${BACKEND_SRC}/utils"
BACKEND_MIDDLEWARE="${BACKEND_SRC}/middleware"
BACKEND_TESTS="${BACKEND_DIR}/tests"
BACKEND_CONFIG="${BACKEND_DIR}/config"

# Temp directories
TEMP_DIR="${PROJECT_ROOT}/temp_reorganization"
DUPLICATE_DIR="${TEMP_DIR}/duplicates"
EMPTY_FILES_DIR="${TEMP_DIR}/empty_files"

# File types
FRONTEND_FILES=("*.jsx" "*.js" "*.tsx" "*.ts" "*.css" "*.scss" "*.html" "*.json" "*.svg" "*.png" "*.jpg" "*.jpeg" "*.gif")
BACKEND_FILES=("*.js" "*.ts" "*.py" "*.json" "*.yaml" "*.yml")

# ================================================================
# Functions
# ================================================================

# Log message to console and file
log() {
    local level=$1
    local message=$2
    local color=$NC

    case $level in
        "INFO") color=$GREEN ;;
        "WARNING") color=$YELLOW ;;
        "ERROR") color=$RED ;;
        "DEBUG") color=$CYAN ;;
    esac

    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [${level}] ${message}${NC}" | tee -a "$LOG_FILE"
}

# Ask for confirmation
confirm() {
    local message=$1

    echo -e "${YELLOW}${message} (y/n)${NC}"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Create backup of the entire codebase
create_backup() {
    log "INFO" "Creating backup of the entire codebase to ${BACKUP_DIR}"

    if [ -d "$BACKUP_DIR" ]; then
        log "WARNING" "Backup directory already exists!"
        if ! confirm "Do you want to overwrite the existing backup?"; then
            log "ERROR" "Backup creation canceled by user. Exiting."
            exit 1
        fi
        rm -rf "$BACKUP_DIR"
    fi

    mkdir -p "$BACKUP_DIR"

    # Copy the entire project except the backup directory
    rsync -a --exclude="backup_*" --exclude="node_modules" --exclude=".git" \
          --exclude="dist" --exclude="build" --exclude="*.log" \
          "$PROJECT_ROOT/" "$BACKUP_DIR/"

    log "INFO" "Backup created successfully."
}

# Initialize directory structure
initialize_directories() {
    log "INFO" "Initializing directory structure..."

    # Create temp directory
    mkdir -p "$TEMP_DIR" "$DUPLICATE_DIR" "$EMPTY_FILES_DIR"

    # Create frontend structure
    mkdir -p "$FRONTEND_COMPONENTS" "$FRONTEND_CONTAINERS" "$FRONTEND_HOOKS" \
             "$FRONTEND_UTILS" "$FRONTEND_STYLES" "$FRONTEND_ASSETS" \
             "$FRONTEND_TESTS" "$FRONTEND_CONFIG"

    # Create backend structure
    mkdir -p "$BACKEND_ROUTES" "$BACKEND_CONTROLLERS" "$BACKEND_MODELS" \
             "$BACKEND_UTILS" "$BACKEND_MIDDLEWARE" "$BACKEND_TESTS" \
             "$BACKEND_CONFIG"

    log "INFO" "Directory structure initialized."
}

# Find duplicate files
find_duplicates() {
    log "INFO" "Finding duplicate files..."

    # Create a temporary file to store file hashes
    local hash_file="${TEMP_DIR}/file_hashes.txt"
    > "$hash_file"

    # Find all files and compute their MD5 hash
    find "$PROJECT_ROOT" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/\.*" \
        -not -path "*/backup_*/*" \
        -not -path "*/temp_reorganization/*" \
        -not -path "*/dist/*" \
        -not -path "*/build/*" \
        | while read -r file; do
            if [ -s "$file" ]; then  # Check if file is not empty
                hash=$(md5sum "$file" | awk '{print $1}')
                echo "$hash $file" >> "$hash_file"
            fi
        done

    # Find duplicate hashes
    local duplicates_file="${TEMP_DIR}/duplicates.txt"
    > "$duplicates_file"

    cat "$hash_file" | sort | awk '{print $1}' | uniq -d | while read -r hash; do
        grep "$hash" "$hash_file" >> "$duplicates_file"
    done

    # Count duplicates
    local duplicate_count=$(cat "$duplicates_file" | wc -l)

    if [ "$duplicate_count" -gt 0 ]; then
        log "INFO" "Found $duplicate_count duplicate files."

        # Group duplicates by hash
        local current_hash=""
        local first_file=""

        cat "$duplicates_file" | sort | while read -r line; do
            hash=$(echo "$line" | awk '{print $1}')
            file=$(echo "$line" | cut -d' ' -f2-)

            if [ "$hash" != "$current_hash" ]; then
                current_hash="$hash"
                first_file="$file"
                echo -e "\n--- Duplicate group (hash: $hash) ---" >> "${TEMP_DIR}/duplicate_groups.txt"
                echo "Keep: $file" >> "${TEMP_DIR}/duplicate_groups.txt"
            else
                echo "Duplicate: $file" >> "${TEMP_DIR}/duplicate_groups.txt"
                # Copy duplicate to duplicate dir for reference
                mkdir -p "$(dirname "${DUPLICATE_DIR}/${file#$PROJECT_ROOT/}")"
                cp "$file" "${DUPLICATE_DIR}/${file#$PROJECT_ROOT/}"
            fi
        done
    else
        log "INFO" "No duplicate files found."
    fi
}

# Find empty files and directories
find_empty() {
    log "INFO" "Finding empty files and directories..."

    # Find empty files
    find "$PROJECT_ROOT" -type f -empty \
        -not -path "*/node_modules/*" \
        -not -path "*/\.*" \
        -not -path "*/backup_*/*" \
        -not -path "*/temp_reorganization/*" \
        > "${TEMP_DIR}/empty_files.txt"

    local empty_files_count=$(cat "${TEMP_DIR}/empty_files.txt" | wc -l)

    if [ "$empty_files_count" -gt 0 ]; then
        log "INFO" "Found $empty_files_count empty files."

        # Copy empty files to the empty files directory for reference
        cat "${TEMP_DIR}/empty_files.txt" | while read -r file; do
            mkdir -p "$(dirname "${EMPTY_FILES_DIR}/${file#$PROJECT_ROOT/}")"
            cp "$file" "${EMPTY_FILES_DIR}/${file#$PROJECT_ROOT/}"
        done
    else
        log "INFO" "No empty files found."
    fi

    # Find empty directories
    find "$PROJECT_ROOT" -type d -empty \
        -not -path "*/node_modules/*" \
        -not -path "*/\.*" \
        -not -path "*/backup_*/*" \
        -not -path "*/temp_reorganization/*" \
        > "${TEMP_DIR}/empty_dirs.txt"

    local empty_dirs_count=$(cat "${TEMP_DIR}/empty_dirs.txt" | wc -l)

    if [ "$empty_dirs_count" -gt 0 ]; then
        log "INFO" "Found $empty_dirs_count empty directories."
    else
        log "INFO" "No empty directories found."
    fi
}

# Categorize files into frontend and backend
categorize_files() {
    log "INFO" "Categorizing files..."

    # Files that are definitely frontend
    find "$PROJECT_ROOT" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/\.*" \
        -not -path "*/backup_*/*" \
        -not -path "*/temp_reorganization/*" \
        -not -path "*/backend/*" \
        \( -name "*.jsx" -o -name "*.tsx" -o -name "*.css" -o -name "*.scss" -o -name "*.html" \) \
        > "${TEMP_DIR}/frontend_files.txt"

    # Files that are definitely backend
    find "$PROJECT_ROOT" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/\.*" \
        -not -path "*/backup_*/*" \
        -not -path "*/temp_reorganization/*" \
        -not -path "*/frontend/*" \
        \( -name "*.py" -o -name "*.rb" -o -name "*.php" \) \
        > "${TEMP_DIR}/backend_files.txt"

    # JavaScript files - need to determine if frontend or backend
    find "$PROJECT_ROOT" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/\.*" \
        -not -path "*/backup_*/*" \
        -not -path "*/temp_reorganization/*" \
        \( -name "*.js" -o -name "*.ts" -o -name "*.json" \) \
        > "${TEMP_DIR}/js_files.txt"

    # Try to determine if JS files are frontend or backend
    cat "${TEMP_DIR}/js_files.txt" | while read -r file; do
        # Check file content for frontend indicators
        if grep -q "React\|Component\|render\|useState\|useEffect\|ReactDOM\|import.*from 'react'\|import.*from \"react\"" "$file" 2>/dev/null; then
            echo "$file" >> "${TEMP_DIR}/frontend_files.txt"
        # Check for backend indicators
        elif grep -q "express\|http.createServer\|app.listen\|require('express')\|require(\"express\")\|import.*from 'express'\|import.*from \"express\"\|module.exports\|export.*function" "$file" 2>/dev/null; then
            echo "$file" >> "${TEMP_DIR}/backend_files.txt"
        # Check path indicators
        elif [[ "$file" == *"/frontend/"* ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_files.txt"
        elif [[ "$file" == *"/backend/"* ]]; then
            echo "$file" >> "${TEMP_DIR}/backend_files.txt"
        # If still not sure, check more indicators
        elif [[ "$file" == *"/components/"* ]] || [[ "$file" == *"/containers/"* ]] || [[ "$file" == *"/pages/"* ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_files.txt"
        elif [[ "$file" == *"/routes/"* ]] || [[ "$file" == *"/controllers/"* ]] || [[ "$file" == *"/models/"* ]]; then
            echo "$file" >> "${TEMP_DIR}/backend_files.txt"
        else
            # For package.json and other config files, check their content
            if [[ "$file" == *"package.json" ]]; then
                if grep -q "\"react\":\|\"react-dom\":" "$file" 2>/dev/null; then
                    echo "$file" >> "${TEMP_DIR}/frontend_files.txt"
                elif grep -q "\"express\":\|\"mongoose\":\|\"sequelize\":" "$file" 2>/dev/null; then
                    echo "$file" >> "${TEMP_DIR}/backend_files.txt"
                else
                    # Can't determine, mark for manual review
                    echo "$file" >> "${TEMP_DIR}/undetermined_files.txt"
                fi
            else
                # Can't determine, mark for manual review
                echo "$file" >> "${TEMP_DIR}/undetermined_files.txt"
            fi
        fi
    done

    # Count files in each category
    local frontend_count=$(cat "${TEMP_DIR}/frontend_files.txt" 2>/dev/null | wc -l || echo 0)
    local backend_count=$(cat "${TEMP_DIR}/backend_files.txt" 2>/dev/null | wc -l || echo 0)
    local undetermined_count=$(cat "${TEMP_DIR}/undetermined_files.txt" 2>/dev/null | wc -l || echo 0)

    log "INFO" "Categorized $frontend_count files as frontend."
    log "INFO" "Categorized $backend_count files as backend."
    log "INFO" "Found $undetermined_count files that couldn't be automatically categorized."
}

# Subcategorize frontend files
subcategorize_frontend() {
    log "INFO" "Subcategorizing frontend files..."

    mkdir -p "${TEMP_DIR}/frontend_categories"

    # Initialize category files
    > "${TEMP_DIR}/frontend_categories/components.txt"
    > "${TEMP_DIR}/frontend_categories/containers.txt"
    > "${TEMP_DIR}/frontend_categories/hooks.txt"
    > "${TEMP_DIR}/frontend_categories/utils.txt"
    > "${TEMP_DIR}/frontend_categories/styles.txt"
    > "${TEMP_DIR}/frontend_categories/assets.txt"
    > "${TEMP_DIR}/frontend_categories/tests.txt"
    > "${TEMP_DIR}/frontend_categories/config.txt"
    > "${TEMP_DIR}/frontend_categories/other.txt"

    # Process each frontend file
    cat "${TEMP_DIR}/frontend_files.txt" | while read -r file; do
        # Skip empty files
        if [ ! -s "$file" ]; then
            continue
        fi

        # Get filename and extension
        filename=$(basename "$file")
        extension="${filename##*.}"

        # Categorize based on path and content
        if [[ "$file" == *"/components/"* ]] || grep -q "extends React.Component\|function.*(\).*{\|const.*=.*(\).*=>" "$file" 2>/dev/null; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/components.txt"
        elif [[ "$file" == *"/containers/"* ]] || [[ "$file" == *"/pages/"* ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/containers.txt"
        elif [[ "$file" == *"/hooks/"* ]] || grep -q "^const use[A-Z]" "$file" 2>/dev/null; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/hooks.txt"
        elif [[ "$file" == *"/utils/"* ]] || [[ "$file" == *"/helpers/"* ]] || [[ "$file" == *"/lib/"* ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/utils.txt"
        elif [[ "$extension" == "css" ]] || [[ "$extension" == "scss" ]] || [[ "$extension" == "sass" ]] || [[ "$extension" == "less" ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/styles.txt"
        elif [[ "$extension" == "svg" ]] || [[ "$extension" == "png" ]] || [[ "$extension" == "jpg" ]] || [[ "$extension" == "jpeg" ]] || [[ "$extension" == "gif" ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/assets.txt"
        elif [[ "$file" == *"/tests/"* ]] || [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/tests.txt"
        elif [[ "$file" == *"/config/"* ]] || [[ "$filename" == *"config"* ]] || [[ "$filename" == "package.json" ]] || [[ "$filename" == "webpack"* ]] || [[ "$filename" == "babel"* ]] || [[ "$filename" == "vite"* ]]; then
            echo "$file" >> "${TEMP_DIR}/frontend_categories/config.txt"
        else
            echo "$file" >> "${TEMP_DIR}/frontend_categories/other.txt"
        fi
    done

    # Count files in each category
    for category in components containers hooks utils styles assets tests config other; do
        local count=$(cat "${TEMP_DIR}/frontend_categories/${category}.txt" 2>/dev/null | wc -l || echo 0)
        log "INFO" "Frontend - $category: $count files"
    done
}

# Subcategorize backend files
subcategorize_backend() {
    log "INFO" "Subcategorizing backend files..."

    mkdir -p "${TEMP_DIR}/backend_categories"

    # Initialize category files
    > "${TEMP_DIR}/backend_categories/routes.txt"
    > "${TEMP_DIR}/backend_categories/controllers.txt"
    > "${TEMP_DIR}/backend_categories/models.txt"
    > "${TEMP_DIR}/backend_categories/utils.txt"
    > "${TEMP_DIR}/backend_categories/middleware.txt"
    > "${TEMP_DIR}/backend_categories/tests.txt"
    > "${TEMP_DIR}/backend_categories/config.txt"
    > "${TEMP_DIR}/backend_categories/other.txt"

    # Process each backend file
    cat "${TEMP_DIR}/backend_files.txt" | while read -r file; do
        # Skip empty files
        if [ ! -s "$file" ]; then
            continue
        fi

        # Get filename
        filename=$(basename "$file")

        # Categorize based on path and content
        if [[ "$file" == *"/routes/"* ]] || [[ "$filename" == *"route"* ]] || grep -q "router.get\|router.post\|router.put\|router.delete\|app.get\|app.post\|app.put\|app.delete" "$file" 2>/dev/null; then
            echo "$file" >> "${TEMP_DIR}/backend_categories/routes.txt"
        elif [[ "$file" == *"/controllers/"* ]] || [[ "$filename" == *"controller"* ]]; then
            echo "$file" >> "${TEMP_DIR}/backend_categories/controllers.txt"
        elif [[ "$file" == *"/models/"* ]] || [[ "$filename" == *"model"* ]] || grep -q "mongoose.model\|sequelize.define\|Schema\|class.*extends Model" "$file" 2>/dev/null; then
            echo "$file" >> "${TEMP_DIR}/backend_categories/models.txt"
        elif [[ "$file" == *"/utils/"* ]] || [[ "$file" == *"/helpers/"* ]] || [[ "$file" == *"/lib/"* ]]; then
            echo "$file" >> "${TEMP_DIR}/backend_categories/utils.txt"
        elif [[ "$file" == *"/middleware/"* ]] || [[ "$filename" == *"middleware"* ]]; then
            echo "$file" >> "${TEMP_DIR}/backend_categories/middleware.txt"
        elif [[ "$file" == *"/tests/"* ]] || [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]]; then
            echo "$file" >> "${TEMP_DIR}/backend_categories/tests.txt"
        elif [[ "$file" == *"/config/"* ]] || [[ "$filename" == *"config"* ]] || [[ "$filename" == "package.json" ]] || [[ "$filename" == ".env"* ]]; then
            echo "$file" >> "${TEMP_DIR}/backend_categories/config.txt"
        else
            echo "$file" >> "${TEMP_DIR}/backend_categories/other.txt"
        fi
    done

    # Count files in each category
    for category in routes controllers models utils middleware tests config other; do
        local count=$(cat "${TEMP_DIR}/backend_categories/${category}.txt" 2>/dev/null | wc -l || echo 0)
        log "INFO" "Backend - $category: $count files"
    done
}

# Move files to their new locations
reorganize_files() {
    log "INFO" "Reorganizing files to their new locations..."

    # Function to move a file and track it
    move_file() {
        local source=$1
        local dest_dir=$2
        local dest_file="${dest_dir}/$(basename "$source")"

        # Create destination directory if it doesn't exist
        mkdir -p "$dest_dir"

        # If destination file already exists, check if they are identical
        if [ -f "$dest_file" ]; then
            local source_hash=$(md5sum "$source" | awk '{print $1}')
            local dest_hash=$(md5sum "$dest_file" | awk '{print $1}')

            if [ "$source_hash" == "$dest_hash" ]; then
                log "DEBUG" "Skipping identical file: $source -> $dest_file"
                return
            else
                # If not identical, add a suffix to the filename
                local base_name=$(basename "$source" | cut -d. -f1)
                local extension="${source##*.}"
                local counter=1
                while [ -f "${dest_dir}/${base_name}_${counter}.${extension}" ]; do
                    counter=$((counter + 1))
                done
                dest_file="${dest_dir}/${base_name}_${counter}.${extension}"
            fi
        fi

        # Copy the file to its new location
        cp "$source" "$dest_file"

        # Track the file move for import updating
        echo "$source -> $dest_file" >> "${TEMP_DIR}/moved_files.txt"

        log "DEBUG" "Moved: $source -> $dest_file"
    }

    # Move frontend files
    log "INFO" "Moving frontend files..."

    # Components
    cat "${TEMP_DIR}/frontend_categories/components.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_COMPONENTS"
    done

    # Containers/Pages
    cat "${TEMP_DIR}/frontend_categories/containers.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_CONTAINERS"
    done

    # Hooks
    cat "${TEMP_DIR}/frontend_categories/hooks.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_HOOKS"
    done

    # Utils
    cat "${TEMP_DIR}/frontend_categories/utils.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_UTILS"
    done

    # Styles
    cat "${TEMP_DIR}/frontend_categories/styles.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_STYLES"
    done

    # Assets
    cat "${TEMP_DIR}/frontend_categories/assets.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_ASSETS"
    done

    # Tests
    cat "${TEMP_DIR}/frontend_categories/tests.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_TESTS"
    done

    # Config
    cat "${TEMP_DIR}/frontend_categories/config.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_CONFIG"
    done

    # Other frontend files
    cat "${TEMP_DIR}/frontend_categories/other.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$FRONTEND_SRC"
    done

    # Move backend files
    log "INFO" "Moving backend files..."

    # Routes
    cat "${TEMP_DIR}/backend_categories/routes.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_ROUTES"
    done

    # Controllers
    cat "${TEMP_DIR}/backend_categories/controllers.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_CONTROLLERS"
    done

    # Models
    cat "${TEMP_DIR}/backend_categories/models.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_MODELS"
    done

    # Utils
    cat "${TEMP_DIR}/backend_categories/utils.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_UTILS"
    done

    # Middleware
    cat "${TEMP_DIR}/backend_categories/middleware.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_MIDDLEWARE"
    done

    # Tests
    cat "${TEMP_DIR}/backend_categories/tests.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_TESTS"
    done

    # Config
    cat "${TEMP_DIR}/backend_categories/config.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_CONFIG"
    done

    # Other backend files
    cat "${TEMP_DIR}/backend_categories/other.txt" 2>/dev/null | while read -r file; do
        move_file "$file" "$BACKEND_SRC"
    done

    # Handle undetermined files
    log "INFO" "Handling undetermined files..."

    if [ -f "${TEMP_DIR}/undetermined_files.txt" ]; then
        # Create a directory for undetermined files
        mkdir -p "${PROJECT_ROOT}/undetermined"

        cat "${TEMP_DIR}/undetermined_files.txt" | while read -r file; do
            local relative_path="${file#$PROJECT_ROOT/}"
            local dest_dir="${PROJECT_ROOT}/undetermined/$(dirname "$relative_path")"

            mkdir -p "$dest_dir"
            cp "$file" "${dest_dir}/$(basename "$file")"

            log "WARNING" "Moved undetermined file to: undetermined/${relative_path}"
        done
    fi

    log "INFO" "File reorganization completed."
}

# Update import statements
update_imports() {
    log "INFO" "Updating import statements..."

    # Create a mapping of old paths to new paths for faster lookup
    local mapping_file="${TEMP_DIR}/path_mapping.txt"

    # Create a simple path mapping database
    cat "${TEMP_DIR}/moved_files.txt" | while read -r line; do
        local old_path=$(echo "$line" | cut -d' ' -f1)
        local new_path=$(echo "$line" | cut -d' ' -f3)

        old_path="${old_path#$PROJECT_ROOT/}"
        new_path="${new_path#$PROJECT_ROOT/}"

        echo "$old_path -> $new_path" >> "$mapping_file"
    done

    # Find all JS/TS/JSX/TSX files in the new structure
    find "$FRONTEND_DIR" "$BACKEND_DIR" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
        log "DEBUG" "Updating imports in: $file"

        # Create a temporary file
        local temp_file="${TEMP_DIR}/temp_import_file.js"
        cp "$file" "$temp_file"

        # Find all import/require statements
        grep -n "import.*from\|require(" "$file" 2>/dev/null | while read -r import_line; do
            local line_num=$(echo "$import_line" | cut -d':' -f1)
            local import_stmt=$(echo "$import_line" | cut -d':' -f2-)

            # Extract the path from the import statement
            local import_path=""
            if [[ "$import_stmt" == *"from "* ]]; then
                import_path=$(echo "$import_stmt" | sed -n "s/.*from ['\"](.*)['\"]\(;*\)/\1/p")
            elif [[ "$import_stmt" == *"require("* ]]; then
                import_path=$(echo "$import_stmt" | sed -n "s/.*require(['\"](.*)['\"]).*/\1/p")
            fi

            # Skip if not a relative path or no path found
            if [[ "$import_path" != "./"* && "$import_path" != "../"* ]] || [ -z "$import_path" ]; then
                continue
            fi

            # Resolve the absolute path of the import
            local import_abs_path=$(realpath --relative-to="$PROJECT_ROOT" "$(dirname "$file")/$import_path")

            # Try to find the new path
            local new_path=$(grep "^$import_abs_path ->" "$mapping_file" | cut -d' ' -f3)

            if [ -n "$new_path" ]; then
                # Calculate the relative path from the current file to the new location
                local file_dir=$(dirname "$file")
                local relative_new_path=$(realpath --relative-to="$file_dir" "$PROJECT_ROOT/$new_path")

                # Remove file extension from the relative path if present
                relative_new_path="${relative_new_path%.js}"
                relative_new_path="${relative_new_path%.jsx}"
                relative_new_path="${relative_new_path%.ts}"
                relative_new_path="${relative_new_path%.tsx}"

                # Ensure the path starts with ./ or ../
                if [[ "$relative_new_path" != "./"* && "$relative_new_path" != "../"* ]]; then
                    relative_new_path="./$relative_new_path"
                fi

                # Replace the old import path with the new one
                if [[ "$import_stmt" == *"from "* ]]; then
                    sed -i "${line_num}s|from ['\"]\(.*\)['\"]|from '$relative_new_path'|" "$temp_file"
                elif [[ "$import_stmt" == *"require("* ]]; then
                    sed -i "${line_num}s|require(['\"]\(.*\)['\"])|require('$relative_new_path')|" "$temp_file"
                fi

                log "DEBUG" "Updated import: $import_path -> $relative_new_path in $file"
            fi
        done

        # Replace the original file with the updated one
        mv "$temp_file" "$file"
    done

    log "INFO" "Import statements updated."
}

# Clean up the codebase
cleanup() {
    log "INFO" "Cleaning up the codebase..."

    # Remove empty directories from the new structure
    find "$FRONTEND_DIR" "$BACKEND_DIR" -type d -empty -delete

    # Optionally, remove the original files (uncomment to enable)
    # log "WARNING" "Removing original files. Make sure your backup is intact."
    # cat "${TEMP_DIR}/moved_files.txt" | while read -r line; do
    #     local old_path=$(echo "$line" | cut -d' ' -f1)
    #     rm -f "$old_path"
    # done

    log "INFO" "Cleanup completed."
}

# Create a migration report
create_report() {
    log "INFO" "Creating migration report..."

    local report_file="${PROJECT_ROOT}/reorganization_report_${TIMESTAMP}.md"

    cat > "$report_file" << EOF
# Codebase Reorganization Report

## Summary

- **Date:** $(date)
- **Backup Location:** \`${BACKUP_DIR}\`
- **Log File:** \`${LOG_FILE}\`

## Statistics

EOF

    # Add frontend statistics
    echo "### Frontend Files" >> "$report_file"
    echo "" >> "$report_file"
    echo "| Category | Count |" >> "$report_file"
    echo "|----------|-------|" >> "$report_file"

    for category in components containers hooks utils styles assets tests config other; do
        local count=$(cat "${TEMP_DIR}/frontend_categories/${category}.txt" 2>/dev/null | wc -l || echo 0)
        echo "| ${category^} | $count |" >> "$report_file"
    done

    # Add backend statistics
    echo "" >> "$report_file"
    echo "### Backend Files" >> "$report_file"
    echo "" >> "$report_file"
    echo "| Category | Count |" >> "$report_file"
    echo "|----------|-------|" >> "$report_file"

    for category in routes controllers models utils middleware tests config other; do
        local count=$(cat "${TEMP_DIR}/backend_categories/${category}.txt" 2>/dev/null | wc -l || echo 0)
        echo "| ${category^} | $count |" >> "$report_file"
    done

    # Add duplicate files information
    echo "" >> "$report_file"
    echo "### Duplicate Files" >> "$report_file"
    echo "" >> "$report_file"

    local duplicate_count=$(cat "${TEMP_DIR}/duplicates.txt" 2>/dev/null | wc -l || echo 0)

    if [ "$duplicate_count" -gt 0 ]; then
        echo "Found $duplicate_count duplicate files. Duplicates were consolidated into a single source of truth." >> "$report_file"
        echo "" >> "$report_file"
        echo "Duplicate files are saved for reference in: \`${DUPLICATE_DIR}\`" >> "$report_file"
    else
        echo "No duplicate files were found." >> "$report_file"
    fi

    # Add empty files information
    echo "" >> "$report_file"
    echo "### Empty Files and Directories" >> "$report_file"
    echo "" >> "$report_file"

    local empty_files_count=$(cat "${TEMP_DIR}/empty_files.txt" 2>/dev/null | wc -l || echo 0)
    local empty_dirs_count=$(cat "${TEMP_DIR}/empty_dirs.txt" 2>/dev/null | wc -l || echo 0)

    echo "- Empty files found: $empty_files_count" >> "$report_file"
    echo "- Empty directories found: $empty_dirs_count" >> "$report_file"
    echo "" >> "$report_file"
    echo "Empty files are saved for reference in: \`${EMPTY_FILES_DIR}\`" >> "$report_file"

    # Add next steps
    echo "" >> "$report_file"
    echo "## Next Steps" >> "$report_file"
    echo "" >> "$report_file"
    echo "1. Review the reorganized structure in \`${FRONTEND_DIR}\` and \`${BACKEND_DIR}\`." >> "$report_file"
    echo "2. Test the application to ensure it works with the new structure." >> "$report_file"
    echo "3. Check for any import issues that may not have been automatically fixed." >> "$report_file"
    echo "4. Review the undetermined files in \`${PROJECT_ROOT}/undetermined\` and move them to appropriate locations." >> "$report_file"
    echo "5. Once satisfied, you can safely remove the backup directory \`${BACKUP_DIR}\`." >> "$report_file"

    log "INFO" "Migration report created: $report_file"
}

# Main execution
main() {
    log "INFO" "Starting codebase reorganization..."

    # Confirm before proceeding
    if ! confirm "This script will reorganize your entire codebase. A backup will be created, but this is a significant operation. Do you want to proceed?"; then
        log "INFO" "Reorganization canceled by user."
        exit 0
    fi

    # Create backup first
    create_backup

    # Initialize directory structure
    initialize_directories

    # Find duplicates and empty files
    find_duplicates
    find_empty

    # Categorize files
    categorize_files
    subcategorize_frontend
    subcategorize_backend

    # Show summary and confirm before moving files
    log "INFO" "File categorization complete. Ready to move files to their new locations."
    if ! confirm "Do you want to proceed with reorganizing files?"; then
        log "INFO" "File reorganization canceled by user."
        exit 0
    fi

    # Move files to their new locations
    reorganize_files

    # Update import statements
    log "INFO" "Ready to update import statements in code files."
    if ! confirm "Do you want to proceed with updating import statements?"; then
        log "INFO" "Import updating canceled by user."
        exit 0
    fi

    update_imports

    # Clean up
    log "INFO" "Ready to clean up empty directories."
    if ! confirm "Do you want to proceed with cleanup?"; then
        log "INFO" "Cleanup canceled by user."
        exit 0
    fi

    cleanup

    # Create report
    create_report

    log "INFO" "Codebase reorganization completed successfully!"
    log "INFO" "Please see the reorganization report for details: reorganization_report_${TIMESTAMP}.md"
}

# Run the main function
main

exit 0
