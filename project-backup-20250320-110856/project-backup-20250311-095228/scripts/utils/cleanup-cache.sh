#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting cleanup of cache and temporary files ===${NC}"

# Function to safely remove directories
safe_remove_dir() {
  if [ -d "$1" ]; then
    echo -e "${YELLOW}Removing directory:${NC} $1"
    rm -rf "$1"
    return 0
  else
    return 1
  fi
}

# Function to safely remove files by pattern
safe_remove_pattern() {
  local count=$(find . -type f -name "$1" | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo -e "${YELLOW}Removing${NC} $count ${YELLOW}files matching pattern:${NC} $1"
    find . -type f -name "$1" -delete
    return 0
  else
    return 1
  fi
}

# Track progress
total_items=0
removed_items=0

echo -e "${BLUE}=== Clearing Frontend Cache ===${NC}"

# Clear frontend specific caches
if safe_remove_dir "./frontend/node_modules/.vite"; then ((removed_items++)); fi
if safe_remove_dir "./frontend/.vite-cache"; then ((removed_items++)); fi
if safe_remove_dir "./frontend/dist"; then ((removed_items++)); fi
if safe_remove_dir "./frontend/build"; then ((removed_items++)); fi
if safe_remove_dir "./node_modules/.cache"; then ((removed_items++)); fi
if safe_remove_dir "./frontend/node_modules/.cache"; then ((removed_items++)); fi
if safe_remove_dir "./.parcel-cache"; then ((removed_items++)); fi
if safe_remove_dir "./frontend/.parcel-cache"; then ((removed_items++)); fi
if safe_remove_pattern "*.tsbuildinfo"; then ((removed_items++)); fi
if safe_remove_pattern ".eslintcache"; then ((removed_items++)); fi
if safe_remove_pattern ".stylelintcache"; then ((removed_items++)); fi
if safe_remove_pattern ".rollup.cache"; then ((removed_items++)); fi
if safe_remove_pattern "vite.config.js.timestamp-*"; then ((removed_items++)); fi
((total_items+=13))

echo -e "${BLUE}=== Clearing Build Artifacts ===${NC}"

# Clear build directories
if safe_remove_dir "./dist"; then ((removed_items++)); fi
if safe_remove_dir "./build"; then ((removed_items++)); fi
if safe_remove_dir "./static"; then ((removed_items++)); fi
((total_items+=3))

echo -e "${BLUE}=== Clearing Python Cache ===${NC}"

# Clear Python cache files
python_cache_count=$(find . -type d -name "__pycache__" | wc -l | tr -d ' ')
if [ "$python_cache_count" -gt 0 ]; then
  echo -e "${YELLOW}Removing${NC} $python_cache_count ${YELLOW}Python cache directories${NC}"
  find . -type d -name "__pycache__" -exec rm -rf {} +
  ((removed_items++))
fi
((total_items++))

# Clear Python pytest cache
pytest_cache_count=$(find . -type d -name ".pytest_cache" | wc -l | tr -d ' ')
if [ "$pytest_cache_count" -gt 0 ]; then
  echo -e "${YELLOW}Removing${NC} $pytest_cache_count ${YELLOW}pytest cache directories${NC}"
  find . -type d -name ".pytest_cache" -exec rm -rf {} +
  ((removed_items++))
fi
((total_items++))

# Clear Python compiled files
if safe_remove_pattern "*.pyc"; then ((removed_items++)); fi
if safe_remove_pattern "*.pyo"; then ((removed_items++)); fi
if safe_remove_pattern "*.pyd"; then ((removed_items++)); fi
((total_items+=3))

echo -e "${BLUE}=== Clearing Temporary Files ===${NC}"

# Clear temporary directories
if safe_remove_dir "./tmp"; then ((removed_items++)); fi
if safe_remove_dir "./temp"; then ((removed_items++)); fi
if safe_remove_dir "./.tmp"; then ((removed_items++)); fi
((total_items+=3))

# Clear temporary files
if safe_remove_pattern "*.tmp"; then ((removed_items++)); fi
if safe_remove_pattern "*.bak"; then ((removed_items++)); fi
if safe_remove_pattern "*.backup"; then ((removed_items++)); fi
if safe_remove_pattern "*.original"; then ((removed_items++)); fi
if safe_remove_pattern "*.moved"; then ((removed_items++)); fi
((total_items+=5))

echo -e "${BLUE}=== Clearing Log Files ===${NC}"

# Remove log files
if safe_remove_dir "./logs"; then ((removed_items++)); fi
if safe_remove_pattern "*.log"; then ((removed_items++)); fi
if safe_remove_pattern "npm-debug.log*"; then ((removed_items++)); fi
if safe_remove_pattern "yarn-debug.log*"; then ((removed_items++)); fi
if safe_remove_pattern "yarn-error.log*"; then ((removed_items++)); fi
((total_items+=5))

echo -e "${BLUE}=== Clearing Test Reports ===${NC}"

# Remove test reports and coverage
if safe_remove_dir "./coverage"; then ((removed_items++)); fi
if safe_remove_dir "./frontend/coverage"; then ((removed_items++)); fi
if safe_remove_dir "./reports"; then ((removed_items++)); fi
if safe_remove_dir "./htmlcov"; then ((removed_items++)); fi
if safe_remove_pattern ".coverage"; then ((removed_items++)); fi
if safe_remove_pattern "coverage.xml"; then ((removed_items++)); fi
((total_items+=6))

echo -e "${BLUE}=== Clearing Timestamp Files ===${NC}"
if safe_remove_pattern ".timestamp-*"; then ((removed_items++)); fi
if safe_remove_pattern "*.timestamp-*"; then ((removed_items++)); fi
((total_items+=2))

# Summary
if [ $removed_items -eq 0 ]; then
  echo -e "${GREEN}=== Cleanup complete! No items needed to be removed. ===${NC}"
else
  echo -e "${GREEN}=== Cleanup complete! Removed${NC} $removed_items ${GREEN}of${NC} $total_items ${GREEN}possible cache items. ===${NC}"
fi

echo -e "${YELLOW}NOTE:${NC} If you need to rebuild the project, please run your usual build commands now."
