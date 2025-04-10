#!/bin/bash

# Test API CRUD operations for all features
BASE_URL="http://localhost:5001/api"
EMAIL="jey@example.io"
PASSWORD="password123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}       Harmonic Universe API Tests     ${NC}"
echo -e "${BLUE}=======================================${NC}"

# ===========================================
# Get authentication token
# ===========================================
echo -e "\n${YELLOW}*** Getting authentication token ***${NC}"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}" \
  $BASE_URL/auth/login)

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get authentication token!${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
else
  echo -e "${GREEN}Successfully obtained authentication token.${NC}"
fi

# ===========================================
# Universe CRUD Tests
# ===========================================
echo -e "\n${YELLOW}=== UNIVERSE CRUD TESTS ===${NC}"

# 1. Create Universe
echo -e "\n${BLUE}1. Creating Universe...${NC}"
CREATE_UNIVERSE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"API Test Universe", "description":"Created through API tests", "is_public":true}' \
  $BASE_URL/universes)

echo "Response: $CREATE_UNIVERSE_RESPONSE"

# Extract universe ID from response
UNIVERSE_ID=$(echo $CREATE_UNIVERSE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$UNIVERSE_ID" ]; then
  echo -e "${RED}Failed to create universe or extract ID!${NC}"
  echo "Using fallback ID of 1"
  UNIVERSE_ID=1
else
  echo -e "${GREEN}Successfully created universe with ID: $UNIVERSE_ID${NC}"
fi

# 2. Get Universe
echo -e "\n${BLUE}2. Getting Universe...${NC}"
GET_UNIVERSE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/universes/$UNIVERSE_ID)

echo "Response: $GET_UNIVERSE_RESPONSE"

# 3. Update Universe
echo -e "\n${BLUE}3. Updating Universe...${NC}"
UPDATE_UNIVERSE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Updated API Test Universe", "description":"Updated through API tests", "is_public":true}' \
  $BASE_URL/universes/$UNIVERSE_ID)

echo "Response: $UPDATE_UNIVERSE_RESPONSE"

# 4. List All Universes
echo -e "\n${BLUE}4. Listing All Universes...${NC}"
LIST_UNIVERSES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/universes)

echo "Response: $LIST_UNIVERSES_RESPONSE"

# 5. Delete Universe
echo -e "\n${BLUE}5. Deleting Universe...${NC}"
DELETE_UNIVERSE_RESPONSE=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/universes/$UNIVERSE_ID)

echo "Response: $DELETE_UNIVERSE_RESPONSE"

# ===========================================
# Scene CRUD Tests
# ===========================================
echo -e "\n${YELLOW}=== SCENE CRUD TESTS ===${NC}"

# Create a universe for scenes if needed
echo -e "\n${BLUE}Creating Universe for Scenes...${NC}"
CREATE_UNIVERSE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Scene Test Universe", "description":"For scene testing", "is_public":true}' \
  $BASE_URL/universes)

SCENE_UNIVERSE_ID=$(echo $CREATE_UNIVERSE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$SCENE_UNIVERSE_ID" ]; then
  echo -e "${RED}Failed to create universe for scenes!${NC}"
  echo "Using fallback ID of 1"
  SCENE_UNIVERSE_ID=1
else
  echo -e "${GREEN}Successfully created universe with ID: $SCENE_UNIVERSE_ID${NC}"
fi

# 1. Create Scene
echo -e "\n${BLUE}1. Creating Scene...${NC}"
CREATE_SCENE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"API Test Scene\", \"description\":\"Created through API tests\", \"universe_id\":$SCENE_UNIVERSE_ID, \"is_public\":true}" \
  $BASE_URL/scenes)

echo "Response: $CREATE_SCENE_RESPONSE"

# Extract scene ID from response
SCENE_ID=$(echo $CREATE_SCENE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$SCENE_ID" ]; then
  echo -e "${RED}Failed to create scene or extract ID!${NC}"
  echo "Using fallback ID of 1"
  SCENE_ID=1
else
  echo -e "${GREEN}Successfully created scene with ID: $SCENE_ID${NC}"
fi

# 2. Get Scene
echo -e "\n${BLUE}2. Getting Scene...${NC}"
GET_SCENE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/scenes/$SCENE_ID)

echo "Response: $GET_SCENE_RESPONSE"

# 3. Update Scene
echo -e "\n${BLUE}3. Updating Scene...${NC}"
UPDATE_SCENE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Updated API Test Scene\", \"description\":\"Updated through API tests\", \"universe_id\":$SCENE_UNIVERSE_ID, \"is_public\":true}" \
  $BASE_URL/scenes/$SCENE_ID)

echo "Response: $UPDATE_SCENE_RESPONSE"

# 4. List All Scenes
echo -e "\n${BLUE}4. Listing All Scenes...${NC}"
LIST_SCENES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/scenes)

echo "Response: $LIST_SCENES_RESPONSE"

# 5. Delete Scene
echo -e "\n${BLUE}5. Deleting Scene...${NC}"
DELETE_SCENE_RESPONSE=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/scenes/$SCENE_ID)

echo "Response: $DELETE_SCENE_RESPONSE"

# ===========================================
# Character CRUD Tests
# ===========================================
echo -e "\n${YELLOW}=== CHARACTER CRUD TESTS ===${NC}"

# 1. Create Character
echo -e "\n${BLUE}1. Creating Character...${NC}"
CREATE_CHARACTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"API Test Character\", \"description\":\"Created through API tests\", \"universe_id\":$SCENE_UNIVERSE_ID}" \
  $BASE_URL/characters)

echo "Response: $CREATE_CHARACTER_RESPONSE"

# Extract character ID from response
CHARACTER_ID=$(echo $CREATE_CHARACTER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CHARACTER_ID" ]; then
  echo -e "${RED}Failed to create character or extract ID!${NC}"
  echo "Using fallback ID of 1"
  CHARACTER_ID=1
else
  echo -e "${GREEN}Successfully created character with ID: $CHARACTER_ID${NC}"
fi

# 2. Get Character
echo -e "\n${BLUE}2. Getting Character...${NC}"
GET_CHARACTER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/characters/$CHARACTER_ID)

echo "Response: $GET_CHARACTER_RESPONSE"

# 3. Update Character
echo -e "\n${BLUE}3. Updating Character...${NC}"
UPDATE_CHARACTER_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Updated API Test Character\", \"description\":\"Updated through API tests\", \"universe_id\":$SCENE_UNIVERSE_ID}" \
  $BASE_URL/characters/$CHARACTER_ID)

echo "Response: $UPDATE_CHARACTER_RESPONSE"

# 4. List All Characters
echo -e "\n${BLUE}4. Listing All Characters...${NC}"
LIST_CHARACTERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/characters)

echo "Response: $LIST_CHARACTERS_RESPONSE"

# 5. Delete Character
echo -e "\n${BLUE}5. Deleting Character...${NC}"
DELETE_CHARACTER_RESPONSE=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/characters/$CHARACTER_ID)

echo "Response: $DELETE_CHARACTER_RESPONSE"

# ===========================================
# Note CRUD Tests
# ===========================================
echo -e "\n${YELLOW}=== NOTE CRUD TESTS ===${NC}"

# 1. Create Note
echo -e "\n${BLUE}1. Creating Note...${NC}"
CREATE_NOTE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"API Test Note\", \"content\":\"This note was created through API tests\", \"universe_id\":$SCENE_UNIVERSE_ID}" \
  $BASE_URL/notes)

echo "Response: $CREATE_NOTE_RESPONSE"

# Extract note ID from response
NOTE_ID=$(echo $CREATE_NOTE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$NOTE_ID" ]; then
  echo -e "${RED}Failed to create note or extract ID!${NC}"
  echo "Using fallback ID of 1"
  NOTE_ID=1
else
  echo -e "${GREEN}Successfully created note with ID: $NOTE_ID${NC}"
fi

# 2. Get Note
echo -e "\n${BLUE}2. Getting Note...${NC}"
GET_NOTE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/notes/$NOTE_ID)

echo "Response: $GET_NOTE_RESPONSE"

# 3. Update Note
echo -e "\n${BLUE}3. Updating Note...${NC}"
UPDATE_NOTE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"Updated API Test Note\", \"content\":\"This note was updated through API tests\", \"universe_id\":$SCENE_UNIVERSE_ID}" \
  $BASE_URL/notes/$NOTE_ID)

echo "Response: $UPDATE_NOTE_RESPONSE"

# 4. List All Notes
echo -e "\n${BLUE}4. Listing All Notes...${NC}"
LIST_NOTES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/notes)

echo "Response: $LIST_NOTES_RESPONSE"

# 5. Delete Note
echo -e "\n${BLUE}5. Deleting Note...${NC}"
DELETE_NOTE_RESPONSE=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/notes/$NOTE_ID)

echo "Response: $DELETE_NOTE_RESPONSE"

echo -e "\n${GREEN}All API tests completed!${NC}" 