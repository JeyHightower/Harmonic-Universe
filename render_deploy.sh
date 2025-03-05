#!/bin/bash

# Harmonic Universe - Render Deployment Script
# This script helps prepare your Flask-React application for Render.com deployment

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print section headers
print_section() {
  echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"
}

# Print success/error messages
print_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    if [ ! -z "$2" ]; then
      echo -e "${YELLOW}$2${NC}"
    fi
    exit 1
  fi
}

# Check for required commands
check_required_commands() {
  print_section "Checking Required Commands"

  commands=("python3" "pip" "npm" "node")
  for cmd in "${commands[@]}"; do
    if ! command -v $cmd &> /dev/null; then
      echo -e "${RED}Error: $cmd is required but not installed.${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ $cmd is installed${NC}"
  done
}

# Setup Flask configuration
setup_flask_config() {
  print_section "Setting Up Flask Configuration"

  # Check if __init__.py already has the correct static folder configuration
  if grep -q "static_folder='../react-app/build'" backend/app/__init__.py; then
    echo -e "${GREEN}✓ Flask static folder already configured${NC}"
  else
    echo -e "${YELLOW}! Flask static folder configuration needs to be updated.${NC}"
    echo -e "${YELLOW}! Please update backend/app/__init__.py with the correct configuration:${NC}"
    echo -e "${YELLOW}! app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')${NC}"

    echo -e "${YELLOW}! Also add these routes at the bottom of the file:${NC}"
    echo -e "${YELLOW}! @app.route('/', defaults={'path': ''})${NC}"
    echo -e "${YELLOW}! @app.route('/<path:path>')${NC}"
    echo -e "${YELLOW}! def react_root(path):${NC}"
    echo -e "${YELLOW}!     if path == 'favicon.ico':${NC}"
    echo -e "${YELLOW}!         return app.send_from_directory('public', 'favicon.ico')${NC}"
    echo -e "${YELLOW}!     return app.send_static_file('index.html')${NC}"

    read -p "Do you want to update the Flask configuration automatically? (y/n) " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
      # Backup the original file
      cp backend/app/__init__.py backend/app/__init__.py.bak

      # Update the file
      # This is a simplified approach - real implementation would need more careful editing
      echo "Updating Flask configuration... (not implemented in this script)"
      echo "Please make the changes manually following the guidelines above."
    fi
  fi
}

# Update React build script
update_react_build_script() {
  print_section "Updating React Build Script"

  # Check if package.json already has CI=false in the build script
  if grep -q "CI=false" frontend/package.json; then
    echo -e "${GREEN}✓ React build script already includes CI=false${NC}"
  else
    echo -e "${YELLOW}! React build script needs to be updated.${NC}"
    echo -e "${YELLOW}! Please update frontend/package.json build script with CI=false:${NC}"
    echo -e "${YELLOW}! \"build\": \"CI=false && <your existing build command>\"${NC}"

    read -p "Do you want to update the React build script automatically? (y/n) " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
      # Backup the original file
      cp frontend/package.json frontend/package.json.bak

      # Update the file
      # This is a simplified approach - real implementation would need more careful editing
      echo "Updating React build script... (not implemented in this script)"
      echo "Please make the changes manually following the guidelines."
    fi
  fi
}

# Create Render YAML Config
create_render_yaml() {
  print_section "Creating Render YAML Configuration"

  if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓ render.yaml already exists${NC}"
    echo -e "${YELLOW}! Check if the configuration matches your needs.${NC}"
    return
  fi

  echo "Creating render.yaml..."
  cat > render.yaml << EOL
# render.yaml
services:
  - type: web
    name: harmonic-universe
    env: python
    buildCommand: |
      # Build frontend
      cd frontend && npm install && npm run build && cd ..
      # Build backend
      pip install -r backend/requirements.txt
      pip install psycopg2
      flask db upgrade
      flask seed all
    startCommand: cd backend && gunicorn app.main:app
    envVars:
      - key: FLASK_ENV
        value: production
      - key: FLASK_APP
        value: backend/app
      - key: SECRET_KEY
        generateValue: true
      - key: SCHEMA
        value: harmonic_universe_schema
      - key: REACT_APP_BASE_URL
        fromService:
          name: harmonic-universe
          type: web
          property: origin
      - key: DATABASE_URL
        fromDatabase:
          name: harmonic-universe-db
          property: connectionString

databases:
  - name: harmonic-universe-db
    plan: starter
EOL
  print_result "Creating render.yaml" "Failed to create render.yaml"

  echo -e "${GREEN}✓ render.yaml created${NC}"
  echo -e "${YELLOW}! Make sure to review and adjust the configuration to your specific needs.${NC}"
}

# Create Build & Start Commands Reference File
create_reference_file() {
  print_section "Creating Reference File"

  echo "Creating render_deployment_reference.md..."
  cat > render_deployment_reference.md << EOL
# Render Deployment Reference

## Build Command
\`\`\`bash
# Build frontend
cd frontend && npm install && npm run build && cd ..
# Build backend
pip install -r backend/requirements.txt
pip install psycopg2
flask db upgrade
flask seed all
\`\`\`

## Start Command
\`\`\`bash
cd backend && gunicorn app.main:app
\`\`\`

## Required Environment Variables
- FLASK_ENV: production
- FLASK_APP: backend/app
- SECRET_KEY: (generate secure key)
- SCHEMA: harmonic_universe_schema
- REACT_APP_BASE_URL: (your Render.com URL)
- DATABASE_URL: (your Postgres database URL)

## Important Notes
- You must re-create your database instance every 25-30 days (free tier limitation)
- Set calendar reminders to avoid application downtime
- Don't include print statements, console.logs, or debuggers in production code
EOL
  print_result "Creating render_deployment_reference.md" "Failed to create reference file"

  echo -e "${GREEN}✓ Reference file created${NC}"
}

# Check for debug statements
check_debug_statements() {
  print_section "Checking for Debug Statements"

  echo "Checking for print statements, console.logs, and debuggers..."

  print_count=$(grep -r "print(" --include="*.py" backend/ | wc -l)
  console_count=$(grep -r "console.log" --include="*.js" --include="*.jsx" frontend/ | wc -l)
  debugger_count=$(grep -r "debugger" --include="*.js" --include="*.jsx" --include="*.py" . | wc -l)

  if [ $print_count -gt 0 ] || [ $console_count -gt 0 ] || [ $debugger_count -gt 0 ]; then
    echo -e "${YELLOW}! Found potential debug statements:${NC}"
    echo -e "${YELLOW}! - $print_count print() statements${NC}"
    echo -e "${YELLOW}! - $console_count console.log statements${NC}"
    echo -e "${YELLOW}! - $debugger_count debugger statements${NC}"
    echo -e "${YELLOW}! Please review and remove them before deploying to production.${NC}"
  else
    echo -e "${GREEN}✓ No obvious debug statements found${NC}"
  fi
}

# Main function
main() {
  print_section "Harmonic Universe - Render Deployment Script"

  echo -e "This script will help prepare your Flask-React application for deployment to Render.com."
  echo -e "It will check configurations, create reference files, and guide you through the process."
  echo

  # Run all checks and setup steps
  check_required_commands
  setup_flask_config
  update_react_build_script
  create_render_yaml
  create_reference_file
  check_debug_statements

  print_section "Next Steps"
  echo -e "1. Review the created files and configurations"
  echo -e "2. Set up your Render.com account and connect to GitHub"
  echo -e "3. Create a PostgreSQL database instance on Render"
  echo -e "4. Create a Web Service for your application"
  echo -e "5. Use the build and start commands from render_deployment_reference.md"
  echo -e "6. Add all the required environment variables"
  echo -e "7. Deploy your application"
  echo
  echo -e "${BOLD}${CYAN}Remember to set calendar reminders to reset your database every 25 days!${NC}"
}

# Execute main function
main "$@"
