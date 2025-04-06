#!/bin/bash

set -e

# Colors for pretty output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
PURPLE="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -d "frontend" ]] || [[ ! -d "backend" ]]; then
  log_error "This script must be run from the Harmonic Universe root directory."
  exit 1
fi

# Create a timestamp for backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}"

# Function to create backups
create_backups() {
  log_info "Creating backups before reorganization..."
  mkdir -p "${BACKUP_DIR}/frontend"
  mkdir -p "${BACKUP_DIR}/backend"
  
  # Copy frontend and backend directories to backup
  cp -r frontend/* "${BACKUP_DIR}/frontend/"
  cp -r backend/* "${BACKUP_DIR}/backend/"
  
  log_success "Backups created at ${BACKUP_DIR}"
}

# Frontend optimization
optimize_frontend() {
  log_info "Optimizing frontend structure..."
  
  # Create temporary directory for reorganized structure
  mkdir -p ./temp/frontend
  
  # Core directories structure
  mkdir -p ./temp/frontend/src/{components,store,styles,utils,pages,features,hooks,contexts,routes,assets,config,constants,services}
  mkdir -p ./temp/frontend/src/components/{auth,common,layout,modals,music,navigation,universe,theme}
  mkdir -p ./temp/frontend/src/store/{slices,thunks,selectors}
  mkdir -p ./temp/frontend/public
  mkdir -p ./temp/frontend/tests
  
  # Copy configuration files
  cp frontend/package.json ./temp/frontend/
  cp frontend/vite.config.js ./temp/frontend/
  cp frontend/index.html ./temp/frontend/
  cp frontend/.env* ./temp/frontend/ 2>/dev/null || true
  cp frontend/babel.config.js ./temp/frontend/ 2>/dev/null || true
  cp frontend/.npmrc ./temp/frontend/ 2>/dev/null || true
  cp frontend/eslint.config.js ./temp/frontend/ 2>/dev/null || true
  
  # Core source files
  if [ -f "frontend/src/App.jsx" ]; then
    cp frontend/src/App.jsx ./temp/frontend/src/
  fi
  
  if [ -f "frontend/src/main.jsx" ]; then
    cp frontend/src/main.jsx ./temp/frontend/src/
  elif [ -f "frontend/src/index.js" ]; then
    cp frontend/src/index.js ./temp/frontend/src/
  fi
  
  # Copy components with conflict resolution
  log_info "Processing components..."
  
  # Find all component files
  find frontend/src -name "*.jsx" -o -name "*.js" | grep -v "node_modules" | while read -r file; do
    # Skip already processed main files
    if [[ "$file" == *"/App.jsx"* ]] || [[ "$file" == *"/main.jsx"* ]] || [[ "$file" == *"/index.js"* ]]; then
      continue
    fi
    
    filename=$(basename "$file")
    component_type=""
    
    # Determine component type based on file path or content
    if [[ "$file" == *"/auth/"* ]] || [[ "$filename" == *"Login"* ]] || [[ "$filename" == *"Register"* ]] || [[ "$filename" == *"Signup"* ]]; then
      component_type="auth"
    elif [[ "$file" == *"/music/"* ]] || [[ "$filename" == *"Music"* ]] || [[ "$filename" == *"Audio"* ]]; then
      component_type="music"
    elif [[ "$file" == *"/navigation/"* ]] || [[ "$filename" == *"Nav"* ]] || [[ "$filename" == *"Menu"* ]]; then
      component_type="navigation"
    elif [[ "$file" == *"/universe/"* ]] || [[ "$filename" == *"Universe"* ]]; then
      component_type="universe"
    elif [[ "$file" == *"/modal"* ]] || [[ "$filename" == *"Modal"* ]]; then
      component_type="modals"
    elif [[ "$file" == *"/layout/"* ]] || [[ "$filename" == *"Layout"* ]] || [[ "$filename" == *"Header"* ]] || [[ "$filename" == *"Footer"* ]]; then
      component_type="layout"
    else
      component_type="common"
    fi
    
    target_dir="./temp/frontend/src/components/${component_type}"
    mkdir -p "$target_dir"
    
    # Check for duplicate files
    if [ -f "${target_dir}/${filename}" ]; then
      log_warning "Duplicate component found: ${filename}"
      # Compare file sizes and keep the larger one (assumes more content is better)
      original_size=$(wc -c < "$file")
      existing_size=$(wc -c < "${target_dir}/${filename}")
      
      if (( original_size > existing_size )); then
        log_info "Replacing with newer version of ${filename}"
        cp "$file" "${target_dir}/${filename}"
      fi
    else
      cp "$file" "${target_dir}/${filename}"
    fi
  done
  
  # Process store files
  log_info "Processing Redux store files..."
  
  # Copy store configuration
  if [ -f "frontend/src/store/store.js" ]; then
    cp frontend/src/store/store.js ./temp/frontend/src/store/
  fi
  
  if [ -f "frontend/src/store/index.js" ]; then
    cp frontend/src/store/index.js ./temp/frontend/src/store/
  fi
  
  # Copy slices, thunks, and selectors
  if [ -d "frontend/src/store/slices" ]; then
    cp -r frontend/src/store/slices/* ./temp/frontend/src/store/slices/ 2>/dev/null || true
  fi
  
  find frontend/src -name "*Slice.js" | while read -r file; do
    cp "$file" ./temp/frontend/src/store/slices/
  done
  
  if [ -d "frontend/src/store/thunks" ]; then
    cp -r frontend/src/store/thunks/* ./temp/frontend/src/store/thunks/ 2>/dev/null || true
  fi
  
  find frontend/src -name "*Thunks.js" | while read -r file; do
    cp "$file" ./temp/frontend/src/store/thunks/
  done
  
  if [ -d "frontend/src/store/selectors" ]; then
    cp -r frontend/src/store/selectors/* ./temp/frontend/src/store/selectors/ 2>/dev/null || true
  fi
  
  # Process styles, utils, hooks, and contexts
  log_info "Processing supporting files..."
  
  if [ -d "frontend/src/styles" ]; then
    cp -r frontend/src/styles/* ./temp/frontend/src/styles/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/utils" ]; then
    cp -r frontend/src/utils/* ./temp/frontend/src/utils/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/hooks" ]; then
    cp -r frontend/src/hooks/* ./temp/frontend/src/hooks/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/contexts" ]; then
    cp -r frontend/src/contexts/* ./temp/frontend/src/contexts/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/services" ]; then
    cp -r frontend/src/services/* ./temp/frontend/src/services/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/constants" ]; then
    cp -r frontend/src/constants/* ./temp/frontend/src/constants/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/config" ]; then
    cp -r frontend/src/config/* ./temp/frontend/src/config/ 2>/dev/null || true
  fi
  
  # Process assets, pages, features, and routes
  if [ -d "frontend/src/assets" ]; then
    cp -r frontend/src/assets/* ./temp/frontend/src/assets/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/pages" ]; then
    cp -r frontend/src/pages/* ./temp/frontend/src/pages/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/features" ]; then
    cp -r frontend/src/features/* ./temp/frontend/src/features/ 2>/dev/null || true
  fi
  
  if [ -d "frontend/src/routes" ]; then
    cp -r frontend/src/routes/* ./temp/frontend/src/routes/ 2>/dev/null || true
  fi
  
  # Process public files
  if [ -d "frontend/public" ]; then
    cp -r frontend/public/* ./temp/frontend/public/ 2>/dev/null || true
  fi
  
  # Process test files
  if [ -d "frontend/tests" ]; then
    cp -r frontend/tests/* ./temp/frontend/tests/ 2>/dev/null || true
  elif [ -d "frontend/src/__tests__" ]; then
    cp -r frontend/src/__tests__/* ./temp/frontend/tests/ 2>/dev/null || true
  fi
  
  # Create index files for components if they don't exist
  for dir in ./temp/frontend/src/components/*; do
    if [ -d "$dir" ]; then
      component_dir=$(basename "$dir")
      index_file="${dir}/index.js"
      
      if [ ! -f "$index_file" ]; then
        log_info "Creating index file for ${component_dir} components"
        
        echo "// Auto-generated index file for ${component_dir} components" > "$index_file"
        echo "" >> "$index_file"
        
        # Add exports for each component in the directory
        for component in "$dir"/*.{js,jsx}; do
          if [ -f "$component" ] && [[ "$component" != *"index.js"* ]]; then
            component_name=$(basename "$component" | sed 's/\.[^.]*$//')
            echo "export { default as ${component_name} } from './${component_name}';" >> "$index_file"
          fi
        done
      fi
    fi
  done
  
  log_success "Frontend optimization completed"
}

# Backend optimization
optimize_backend() {
  log_info "Optimizing backend structure..."
  
  # Create temporary directory for reorganized structure
  mkdir -p ./temp/backend
  
  # Core directories structure
  mkdir -p ./temp/backend/app/{api,core,utils,services}
  mkdir -p ./temp/backend/app/api/{models,routes,schemas}
  mkdir -p ./temp/backend/migrations
  mkdir -p ./temp/backend/tests
  mkdir -p ./temp/backend/static
  
  # Copy configuration files
  cp backend/requirements.txt ./temp/backend/ 2>/dev/null || true
  cp backend/pyproject.toml ./temp/backend/ 2>/dev/null || true
  cp backend/.env* ./temp/backend/ 2>/dev/null || true
  cp backend/.flaskenv ./temp/backend/ 2>/dev/null || true
  cp backend/README.md ./temp/backend/ 2>/dev/null || true
  
  # Core application files
  cp backend/app.py ./temp/backend/ 2>/dev/null || true
  cp backend/run.py ./temp/backend/ 2>/dev/null || true
  cp backend/wsgi.py ./temp/backend/ 2>/dev/null || true
  cp backend/setup_db.py ./temp/backend/ 2>/dev/null || true
  cp backend/render-build.sh ./temp/backend/ 2>/dev/null || true
  cp backend/render-start.sh ./temp/backend/ 2>/dev/null || true
  
  # Process app package
  if [ -f "backend/app/__init__.py" ]; then
    cp backend/app/__init__.py ./temp/backend/app/
  fi
  
  if [ -f "backend/app/config.py" ]; then
    cp backend/app/config.py ./temp/backend/app/
  elif [ -f "backend/app/core/config.py" ]; then
    mkdir -p ./temp/backend/app/core
    cp backend/app/core/config.py ./temp/backend/app/core/
  fi
  
  if [ -f "backend/app/extensions.py" ]; then
    cp backend/app/extensions.py ./temp/backend/app/
  fi
  
  # Process API
  if [ -f "backend/app/api/__init__.py" ]; then
    cp backend/app/api/__init__.py ./temp/backend/app/api/
  fi
  
  # Process models
  log_info "Processing models..."
  
  if [ -d "backend/app/api/models" ]; then
    cp -r backend/app/api/models/* ./temp/backend/app/api/models/ 2>/dev/null || true
  fi
  
  find backend -path "*/models/*.py" | while read -r file; do
    # Skip if already in the models directory
    if [[ "$file" == *"/app/api/models/"* ]]; then
      continue
    fi
    
    filename=$(basename "$file")
    
    # Check for duplicate files
    if [ -f "./temp/backend/app/api/models/${filename}" ]; then
      log_warning "Duplicate model found: ${filename}"
      # Compare file sizes and keep the larger one (assumes more content is better)
      original_size=$(wc -c < "$file")
      existing_size=$(wc -c < "./temp/backend/app/api/models/${filename}")
      
      if (( original_size > existing_size )); then
        log_info "Replacing with newer version of ${filename}"
        cp "$file" "./temp/backend/app/api/models/${filename}"
      fi
    else
      cp "$file" "./temp/backend/app/api/models/${filename}"
    fi
  done
  
  # Process routes
  log_info "Processing routes..."
  
  if [ -d "backend/app/api/routes" ]; then
    cp -r backend/app/api/routes/* ./temp/backend/app/api/routes/ 2>/dev/null || true
  fi
  
  find backend -path "*/routes/*.py" | while read -r file; do
    # Skip if already in the routes directory
    if [[ "$file" == *"/app/api/routes/"* ]]; then
      continue
    fi
    
    filename=$(basename "$file")
    
    # Check for duplicate files
    if [ -f "./temp/backend/app/api/routes/${filename}" ]; then
      log_warning "Duplicate route found: ${filename}"
      # Compare file sizes and keep the larger one (assumes more content is better)
      original_size=$(wc -c < "$file")
      existing_size=$(wc -c < "./temp/backend/app/api/routes/${filename}")
      
      if (( original_size > existing_size )); then
        log_info "Replacing with newer version of ${filename}"
        cp "$file" "./temp/backend/app/api/routes/${filename}"
      fi
    else
      cp "$file" "./temp/backend/app/api/routes/${filename}"
    fi
  done
  
  # Process schemas if they exist
  find backend -path "*/schemas/*.py" | while read -r file; do
    filename=$(basename "$file")
    cp "$file" "./temp/backend/app/api/schemas/${filename}"
  done
  
  # Process utilities
  log_info "Processing utilities..."
  
  if [ -d "backend/utils" ]; then
    cp -r backend/utils/* ./temp/backend/app/utils/ 2>/dev/null || true
  elif [ -d "backend/app/utils" ]; then
    cp -r backend/app/utils/* ./temp/backend/app/utils/ 2>/dev/null || true
  fi
  
  # Process services
  if [ -d "backend/services" ]; then
    cp -r backend/services/* ./temp/backend/app/services/ 2>/dev/null || true
  elif [ -d "backend/app/services" ]; then
    cp -r backend/app/services/* ./temp/backend/app/services/ 2>/dev/null || true
  fi
  
  # Process migrations
  if [ -d "backend/migrations" ]; then
    cp -r backend/migrations/* ./temp/backend/migrations/ 2>/dev/null || true
  fi
  
  # Process static files
  if [ -d "backend/static" ]; then
    cp -r backend/static/* ./temp/backend/static/ 2>/dev/null || true
  fi
  
  # Process tests
  if [ -d "backend/tests" ]; then
    cp -r backend/tests/* ./temp/backend/tests/ 2>/dev/null || true
  fi
  
  # Ensure __init__.py exists in all Python packages
  find ./temp/backend -type d -not -path "*/\.*" | while read -r dir; do
    if [[ "$dir" != *"migrations/versions"* ]] && [[ "$dir" != *"static"* ]] && [[ "$dir" != *"tests"* ]]; then
      if [ ! -f "${dir}/__init__.py" ]; then
        touch "${dir}/__init__.py"
      fi
    fi
  done
  
  log_success "Backend optimization completed"
}

# Update imports in frontend files
update_frontend_imports() {
  log_info "Updating imports in frontend files..."
  
  # Find all JS and JSX files in the temporary frontend directory
  find ./temp/frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    # Create a temporary file
    tmp_file=$(mktemp)
    
    # Process import statements
    while IFS= read -r line; do
      # Handle different import pattern types
      if [[ "$line" == *"import "* && "$line" == *"from"* ]]; then
        # Extract the import path
        import_path=$(echo "$line" | sed -n 's/.*from["'"'"' ]*\([^"'"'"']*\)["'"'"' ]*;*/\1/p')
        
        # Skip external imports and absolute imports
        if [[ "$import_path" != "."* ]] && [[ "$import_path" != ".."* ]]; then
          echo "$line" >> "$tmp_file"
          continue
        fi
        
        # Check if we need to adjust the path based on file location and import
        new_line="$line"
        
        # Adjust component imports
        if [[ "$import_path" == *"/components/"* ]]; then
          component_type=$(echo "$import_path" | grep -o '/components/[^/]*/' | cut -d'/' -f3)
          if [ ! -z "$component_type" ]; then
            file_path=$(echo "$file" | sed 's|./temp/frontend/src/||')
            
            # Determine relative path based on file location
            if [[ "$file_path" == "components/${component_type}/"* ]]; then
              # Same directory, use relative path
              new_path=$(echo "$import_path" | sed "s|.*/components/${component_type}/|./|")
              new_line=$(echo "$line" | sed "s|$import_path|$new_path|")
            elif [[ "$file_path" == "components/"* ]]; then
              # Different component type, adjust path
              new_path=$(echo "$import_path" | sed "s|.*/components/|../|")
              new_line=$(echo "$line" | sed "s|$import_path|$new_path|")
            else
              # From outside components directory
              new_line=$(echo "$line" | sed "s|$import_path|@/components/${component_type}$(echo "$import_path" | grep -o '/[^/]*$')|")
            fi
          fi
        fi
        
        echo "$new_line" >> "$tmp_file"
      else
        echo "$line" >> "$tmp_file"
      fi
    done < "$file"
    
    # Replace original file with modified one
    mv "$tmp_file" "$file"
  done
  
  log_success "Frontend imports updated"
}

# Update imports in backend files
update_backend_imports() {
  log_info "Updating imports in backend files..."
  
  # Find all Python files in the temporary backend directory
  find ./temp/backend -type f -name "*.py" | while read -r file; do
    # Create a temporary file
    tmp_file=$(mktemp)
    
    # Process import statements
    while IFS= read -r line; do
      # Handle different import patterns
      if [[ "$line" == "from "* ]] || [[ "$line" == "import "* ]]; then
        # Skip standard library imports
        if [[ "$line" == "from os"* ]] || [[ "$line" == "from sys"* ]] || [[ "$line" == "from datetime"* ]] || [[ "$line" == "import os"* ]] || [[ "$line" == "import sys"* ]] || [[ "$line" == "import datetime"* ]] || [[ "$line" == "from flask"* ]] || [[ "$line" == "import flask"* ]]; then
          echo "$line" >> "$tmp_file"
          continue
        fi
        
        # Replace imports from old structure with new structure
        new_line="$line"
        
        # Adjust imports for models
        if [[ "$line" == *"from app.models"* ]] || [[ "$line" == *"from backend.app.models"* ]]; then
          new_line=$(echo "$line" | sed 's/from app\.models/from app.api.models/g' | sed 's/from backend\.app\.models/from app.api.models/g')
        fi
        
        # Adjust imports for routes
        if [[ "$line" == *"from app.routes"* ]] || [[ "$line" == *"from backend.app.routes"* ]]; then
          new_line=$(echo "$line" | sed 's/from app\.routes/from app.api.routes/g' | sed 's/from backend\.app\.routes/from app.api.routes/g')
        fi
        
        echo "$new_line" >> "$tmp_file"
      else
        echo "$line" >> "$tmp_file"
      fi
    done < "$file"
    
    # Replace original file with modified one
    mv "$tmp_file" "$file"
  done
  
  log_success "Backend imports updated"
}

# Update configuration files to ensure everything runs smoothly
update_configuration() {
  log_info "Updating configuration files..."
  
  # Update frontend Vite configuration
  if [ -f "./temp/frontend/vite.config.js" ]; then
    tmp_file=$(mktemp)
    
    cat > "$tmp_file" << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@config': path.resolve(__dirname, './src/config'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
EOF
    
    mv "$tmp_file" "./temp/frontend/vite.config.js"
  fi
  
  # Create or update frontend index.js
  if [ ! -f "./temp/frontend/src/index.js" ] && [ -f "./temp/frontend/src/main.jsx" ]; then
    cp "./temp/frontend/src/main.jsx" "./temp/frontend/src/index.js"
  fi
  
  # Update backend app/__init__.py if needed
  if [ -f "./temp/backend/app/__init__.py" ]; then
    # Ensure it's using the correct import paths
    sed -i.bak 's/from app\.routes/from app.api.routes/g' "./temp/backend/app/__init__.py"
    sed -i.bak 's/from app\.models/from app.api.models/g' "./temp/backend/app/__init__.py"
    rm "./temp/backend/app/__init__.py.bak"
  fi
  
  log_success "Configuration files updated"
}

# Validate the reorganization
validate_reorganization() {
  log_info "Validating reorganization..."
  
  # Check for critical frontend files
  if [ ! -f "./temp/frontend/src/App.jsx" ] && [ ! -f "./temp/frontend/src/app.jsx" ]; then
    log_warning "Missing App.jsx file in frontend"
  fi
  
  if [ ! -f "./temp/frontend/src/index.js" ] && [ ! -f "./temp/frontend/src/main.jsx" ]; then
    log_warning "Missing entry point (index.js or main.jsx) in frontend"
  fi
  
  if [ ! -f "./temp/frontend/package.json" ]; then
    log_warning "Missing package.json in frontend"
  fi
  
  if [ ! -f "./temp/frontend/vite.config.js" ]; then
    log_warning "Missing vite.config.js in frontend"
  fi
  
  # Check for critical backend files
  if [ ! -f "./temp/backend/app/__init__.py" ]; then
    log_warning "Missing __init__.py in backend/app"
  fi
  
  if [ ! -f "./temp/backend/requirements.txt" ]; then
    log_warning "Missing requirements.txt in backend"
  fi
  
  if [ ! -f "./temp/backend/app.py" ] && [ ! -f "./temp/backend/run.py" ] && [ ! -f "./temp/backend/wsgi.py" ]; then
    log_warning "Missing entry point (app.py, run.py, or wsgi.py) in backend"
  fi
  
  log_success "Validation completed"
}

# Apply reorganization
apply_reorganization() {
  log_info "Applying reorganization..."
  
  # Remove original directories
  rm -rf frontend
  rm -rf backend
  
  # Move reorganized directories to their final locations
  mv ./temp/frontend frontend
  mv ./temp/backend backend
  
  # Clean up
  rm -rf ./temp
  
  log_success "Reorganization applied successfully"
}

# Main execution flow
main() {
  log_info "Starting Harmonic Universe reorganization..."
  
  # Create backups
  create_backups
  
  # Optimize frontend structure
  optimize_frontend
  
  # Optimize backend structure
  optimize_backend
  
  # Update imports in frontend
  update_frontend_imports
  
  # Update imports in backend
  update_backend_imports
  
  # Update configuration files
  update_configuration
  
  # Validate reorganization
  validate_reorganization
  
  # Apply reorganization
  apply_reorganization
  
  log_success "Harmonic Universe reorganization completed successfully!"
  echo ""
  echo -e "${GREEN}The project has been reorganized with an optimized structure.${NC}"
  echo -e "A backup of the original files has been saved to: ${BACKUP_DIR}"
  echo ""
  echo -e "Next steps:"
  echo -e "1. cd into frontend and run: ${CYAN}npm install${NC}"
  echo -e "2. Test the frontend with: ${CYAN}npm run dev${NC}"
  echo -e "3. cd into backend and run: ${CYAN}pip install -r requirements.txt${NC}"
  echo -e "4. Test the backend with: ${CYAN}python run.py${NC}"
}

# Execute main function
main 