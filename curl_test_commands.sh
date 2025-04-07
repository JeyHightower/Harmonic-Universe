#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API configuration
API_BASE_URL="https://harmonic-universe-z5ka.onrender.com/api"
# API_BASE_URL="http://localhost:5001/api"  # Commented out local URL
TOKEN=""
UNIVERSE_ID=""
SCENE_ID=""
CHARACTER_ID=""
NOTE_ID=""

# Function to print section header
section() {
  echo -e "\n${BLUE}======= $1 =======${NC}\n"
}

# Function to print success message
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to print info message
info() {
  echo -e "${YELLOW}ℹ️ $1${NC}"
}

section "HEALTH CHECK"

# Test the API health endpoint
info "Testing API health endpoint..."
RESPONSE=$(curl -s "${API_BASE_URL}/health")

if [[ $RESPONSE == *"healthy"* ]]; then
  success "API is healthy!"
  echo "$RESPONSE"
else
  error "API health check failed"
  echo "$RESPONSE"
  echo "Continuing with other tests anyway..."
fi

section "AUTHENTICATION"

# Demo login to get token
info "Authenticating using demo login..."
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/demo-login")

# Extract token using jq if available
if command -v jq &> /dev/null; then
  TOKEN=$(echo "$RESPONSE" | jq -r '.token')
else
  # Fallback to grep/sed if jq is not available
  TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  error "Authentication failed"
  echo "$RESPONSE"
  exit 1
else
  success "Authentication successful"
  info "Token: ${TOKEN:0:15}..."
fi

section "UNIVERSE MANAGEMENT"

# Create test universe
info "Creating test universe..."
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/universes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Universe for Curl","description":"A universe created using curl tests"}')

# Extract universe ID using jq if available
if command -v jq &> /dev/null; then
  UNIVERSE_ID=$(echo "$RESPONSE" | jq -r '.universe.id')
  if [ "$UNIVERSE_ID" = "null" ]; then
    UNIVERSE_ID=""
  fi
else
  # Fallback extraction
  UNIVERSE_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
fi

if [ -z "$UNIVERSE_ID" ]; then
  error "Universe creation failed"
  echo "$RESPONSE"
  exit 1
else
  success "Universe created with ID: $UNIVERSE_ID"
fi

section "SCENE MANAGEMENT"

# Create a scene
info "Creating a new scene..."
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/scenes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Curl Test Scene\",\"description\":\"A scene created with curl\",\"universe_id\":$UNIVERSE_ID}")

# Extract scene ID using jq if available
if command -v jq &> /dev/null; then
  SCENE_ID=$(echo "$RESPONSE" | jq -r '.scene.id')
  if [ "$SCENE_ID" = "null" ]; then
    SCENE_ID=""
  fi
else
  # Fallback extraction
  SCENE_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
fi

if [ -z "$SCENE_ID" ]; then
  error "Scene creation failed"
  echo "$RESPONSE"
  exit 1
else
  success "Scene created with ID: $SCENE_ID"
fi

# Get scene details
info "Getting scene details..."
RESPONSE=$(curl -s -X GET "${API_BASE_URL}/scenes/$SCENE_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  SCENE_NAME=$(echo "$RESPONSE" | jq -r '.scene.name')
  if [ "$SCENE_NAME" != "null" ] && [ -n "$SCENE_NAME" ]; then
    success "Scene details retrieved successfully"
    echo "$RESPONSE" | jq '.'
  else
    error "Failed to get scene details"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"scene"* ]]; then
    success "Scene details retrieved successfully"
    echo "$RESPONSE"
  else
    error "Failed to get scene details"
    echo "$RESPONSE"
  fi
fi

# Get all scenes for universe
info "Getting all scenes for universe..."
RESPONSE=$(curl -s -X GET "${API_BASE_URL}/scenes/universe/$UNIVERSE_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  SCENE_COUNT=$(echo "$RESPONSE" | jq -r '.scenes | length')
  if [ "$SCENE_COUNT" != "null" ]; then
    success "Scenes retrieved for universe"
    echo "Found $SCENE_COUNT scenes"
    echo "$RESPONSE" | jq '.scenes[] | {id, name}'
  else
    error "Failed to get scenes for universe"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"scenes"* ]]; then
    success "Scenes retrieved for universe"
    echo "$RESPONSE"
  else
    error "Failed to get scenes for universe"
    echo "$RESPONSE"
  fi
fi

# Update scene
info "Updating scene..."
RESPONSE=$(curl -s -X PUT "${API_BASE_URL}/scenes/$SCENE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Curl Test Scene","description":"This scene was updated with curl"}')

if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.message')
  if [[ $SUCCESS == *"updated successfully"* ]]; then
    success "Scene updated successfully"
    echo "$RESPONSE" | jq '.'
  else
    error "Failed to update scene"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"updated successfully"* ]]; then
    success "Scene updated successfully"
    echo "$RESPONSE"
  else
    error "Failed to update scene"
    echo "$RESPONSE"
  fi
fi

section "CHARACTER MANAGEMENT"

# Create a character
info "Creating a new character..."
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/characters" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Curl Test Character\",\"description\":\"A character created with curl\",\"scene_id\":$SCENE_ID}")

# Extract character ID using jq if available
if command -v jq &> /dev/null; then
  CHARACTER_ID=$(echo "$RESPONSE" | jq -r '.character.id')
  if [ "$CHARACTER_ID" = "null" ]; then
    CHARACTER_ID=""
  fi
else
  # Fallback extraction
  CHARACTER_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
fi

if [ -z "$CHARACTER_ID" ]; then
  error "Character creation failed"
  echo "$RESPONSE"
  exit 1
else
  success "Character created with ID: $CHARACTER_ID"
fi

# Get character details
info "Getting character details..."
RESPONSE=$(curl -s -X GET "${API_BASE_URL}/characters/$CHARACTER_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  CHARACTER_NAME=$(echo "$RESPONSE" | jq -r '.character.name')
  if [ "$CHARACTER_NAME" != "null" ] && [ -n "$CHARACTER_NAME" ]; then
    success "Character details retrieved successfully"
    echo "$RESPONSE" | jq '.'
  else
    error "Failed to get character details"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"character"* ]]; then
    success "Character details retrieved successfully"
    echo "$RESPONSE"
  else
    error "Failed to get character details"
    echo "$RESPONSE"
  fi
fi

# Get characters for scene
info "Getting characters for scene..."
RESPONSE=$(curl -s -X GET "${API_BASE_URL}/characters/scene/$SCENE_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  CHARACTER_COUNT=$(echo "$RESPONSE" | jq -r '.characters | length')
  if [ "$CHARACTER_COUNT" != "null" ]; then
    success "Characters retrieved for scene"
    echo "Found $CHARACTER_COUNT characters"
    echo "$RESPONSE" | jq '.characters[] | {id, name}'
  else
    error "Failed to get characters for scene"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"characters"* ]]; then
    success "Characters retrieved for scene"
    echo "$RESPONSE"
  else
    error "Failed to get characters for scene"
    echo "$RESPONSE"
  fi
fi

# Update character
info "Updating character..."
RESPONSE=$(curl -s -X PUT "${API_BASE_URL}/characters/$CHARACTER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Curl Test Character","description":"This character was updated with curl"}')

if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.message')
  if [[ $SUCCESS == *"updated successfully"* ]]; then
    success "Character updated successfully"
    echo "$RESPONSE" | jq '.'
  else
    error "Failed to update character"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"updated successfully"* ]]; then
    success "Character updated successfully"
    echo "$RESPONSE"
  else
    error "Failed to update character"
    echo "$RESPONSE"
  fi
fi

section "NOTES MANAGEMENT"

# Create a note
info "Creating a new note..."
RESPONSE=$(curl -s -X POST "${API_BASE_URL}/notes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Curl Test Note\",\"content\":\"This is a note created with curl\",\"universe_id\":$UNIVERSE_ID,\"scene_id\":$SCENE_ID}")

# Extract note ID using jq if available
if command -v jq &> /dev/null; then
  NOTE_ID=$(echo "$RESPONSE" | jq -r '.note.id')
  if [ "$NOTE_ID" = "null" ]; then
    NOTE_ID=""
  fi
else
  # Fallback extraction
  NOTE_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
fi

if [ -z "$NOTE_ID" ]; then
  error "Note creation failed"
  echo "$RESPONSE"
  exit 1
else
  success "Note created with ID: $NOTE_ID"
fi

# Get note details
info "Getting note details..."
RESPONSE=$(curl -s -X GET "${API_BASE_URL}/notes/$NOTE_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  NOTE_TITLE=$(echo "$RESPONSE" | jq -r '.note.title')
  if [ "$NOTE_TITLE" != "null" ] && [ -n "$NOTE_TITLE" ]; then
    success "Note details retrieved successfully"
    echo "$RESPONSE" | jq '.'
  else
    error "Failed to get note details"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"note"* ]]; then
    success "Note details retrieved successfully"
    echo "$RESPONSE"
  else
    error "Failed to get note details"
    echo "$RESPONSE"
  fi
fi

# Get notes for universe
info "Getting notes for universe..."
RESPONSE=$(curl -s -X GET "${API_BASE_URL}/notes/universe/$UNIVERSE_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  NOTE_COUNT=$(echo "$RESPONSE" | jq -r '.notes | length')
  if [ "$NOTE_COUNT" != "null" ]; then
    success "Notes retrieved for universe"
    echo "Found $NOTE_COUNT notes"
    echo "$RESPONSE" | jq '.notes[] | {id, title}'
  else
    error "Failed to get notes for universe"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"notes"* ]]; then
    success "Notes retrieved for universe"
    echo "$RESPONSE"
  else
    error "Failed to get notes for universe"
    echo "$RESPONSE"
  fi
fi

# Update note
info "Updating note..."
RESPONSE=$(curl -s -X PUT "${API_BASE_URL}/notes/$NOTE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Curl Test Note","content":"This note was updated with curl"}')

if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.message')
  if [[ $SUCCESS == *"updated successfully"* ]]; then
    success "Note updated successfully"
    echo "$RESPONSE" | jq '.'
  else
    error "Failed to update note"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"updated successfully"* ]]; then
    success "Note updated successfully"
    echo "$RESPONSE"
  else
    error "Failed to update note"
    echo "$RESPONSE"
  fi
fi

# Delete note
info "Deleting note..."
RESPONSE=$(curl -s -X DELETE "${API_BASE_URL}/notes/$NOTE_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.message')
  if [[ $SUCCESS == *"deleted successfully"* ]]; then
    success "Note deleted successfully"
  else
    error "Failed to delete note"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"deleted successfully"* ]]; then
    success "Note deleted successfully"
  else
    error "Failed to delete note"
    echo "$RESPONSE"
  fi
fi

section "CLEANUP"

# Delete character (soft delete)
info "Deleting character..."
RESPONSE=$(curl -s -X DELETE "${API_BASE_URL}/characters/$CHARACTER_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.message')
  if [[ $SUCCESS == *"deleted successfully"* ]]; then
    success "Character deleted successfully"
  else
    error "Failed to delete character"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"deleted successfully"* ]]; then
    success "Character deleted successfully"
  else
    error "Failed to delete character"
    echo "$RESPONSE"
  fi
fi

# Delete scene (soft delete)
info "Deleting scene..."
RESPONSE=$(curl -s -X DELETE "${API_BASE_URL}/scenes/$SCENE_ID" \
  -H "Authorization: Bearer $TOKEN")

if command -v jq &> /dev/null; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.message')
  if [[ $SUCCESS == *"deleted successfully"* ]]; then
    success "Scene deleted successfully"
  else
    error "Failed to delete scene"
    echo "$RESPONSE"
  fi
else
  if [[ $RESPONSE == *"deleted successfully"* ]]; then
    success "Scene deleted successfully"
  else
    error "Failed to delete scene"
    echo "$RESPONSE"
  fi
fi

section "TEST SUMMARY"
success "All API tests completed"
echo -e "Universe ID: $UNIVERSE_ID"
echo -e "Scene ID: $SCENE_ID (soft deleted)"
echo -e "Character ID: $CHARACTER_ID (soft deleted)"
echo -e "Note ID: $NOTE_ID (soft deleted)"

# Informational message about how to run specific tests
info "To run individual tests, you can use the following examples:"

echo -e "\n# Authenticate and get token"
echo 'curl -X POST "https://harmonic-universe-z5ka.onrender.com/api/auth/demo-login"'

echo -e "\n# Create universe"
echo 'curl -X POST "https://harmonic-universe-z5ka.onrender.com/api/universes" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name":"Test Universe","description":"A test universe"}'"'"

echo -e "\n# Create scene"
echo 'curl -X POST "https://harmonic-universe-z5ka.onrender.com/api/scenes" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name":"Test Scene","description":"A test scene","universe_id":YOUR_UNIVERSE_ID}'"'"

echo -e "\n# Create character"
echo 'curl -X POST "https://harmonic-universe-z5ka.onrender.com/api/characters" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"name":"Test Character","description":"A test character","scene_id":YOUR_SCENE_ID}'"'"

echo -e "\n# Create note"
echo 'curl -X POST "https://harmonic-universe-z5ka.onrender.com/api/notes" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"title":"Test Note","content":"A test note content","universe_id":YOUR_UNIVERSE_ID}'"'"

echo -e "\n# Get notes for universe"
echo 'curl -X GET "https://harmonic-universe-z5ka.onrender.com/api/notes/universe/YOUR_UNIVERSE_ID" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN"'

echo -e "\n# Update note"
echo 'curl -X PUT "https://harmonic-universe-z5ka.onrender.com/api/notes/YOUR_NOTE_ID" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"title":"Updated Note","content":"Updated note content"}'"'"

echo -e "\n# Delete note"
echo 'curl -X DELETE "https://harmonic-universe-z5ka.onrender.com/api/notes/YOUR_NOTE_ID" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN"' 