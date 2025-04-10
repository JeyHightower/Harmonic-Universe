#!/usr/bin/env python3
"""
Test API endpoints for Harmonic Universe
"""
import requests
import json
import sys
from urllib.parse import urljoin
import time

BASE_URL = "http://localhost:5001/api"
EMAIL = "jey@example.io"
PASSWORD = "password123"

# ANSI color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_colored(text, color=RESET):
    """Print colored text to console"""
    print(f"{color}{text}{RESET}")

def print_response(response, label="Response"):
    """Pretty print a response object"""
    try:
        if response.status_code >= 400:
            color = RED
        elif response.status_code >= 300:
            color = YELLOW
        else:
            color = GREEN
        
        print(f"{color}Status: {response.status_code}{RESET}")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
    except Exception as e:
        print(f"{RED}Error printing response: {str(e)}{RESET}")
        print(response)

def get_auth_token():
    """Get authentication token"""
    print_colored("\n*** Getting authentication token ***", YELLOW)
    try:
        login_data = {
            "email": EMAIL,
            "password": PASSWORD
        }
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data
        )
        
        print_response(response)
        
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                print_colored(f"Successfully obtained token: {token[:15]}...", GREEN)
                return token
            else:
                print_colored("Token not found in response", RED)
                return None
        else:
            print_colored(f"Failed to get token. Status: {response.status_code}", RED)
            return None
            
    except Exception as e:
        print_colored(f"Error getting auth token: {str(e)}", RED)
        return None

def test_universe_crud(token):
    """Test Universe CRUD operations"""
    if not token:
        print_colored("No token available. Skipping Universe tests.", RED)
        return
        
    print_colored("\n=== UNIVERSE CRUD TESTS ===", YELLOW)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Universe
    print_colored("\n1. Creating Universe...", BLUE)
    universe_data = {
        "name": "Python Test Universe",
        "description": "Created through Python API tests",
        "is_public": True
    }
    
    create_response = requests.post(
        f"{BASE_URL}/universes",
        headers=headers,
        json=universe_data
    )
    
    print_response(create_response)
    
    # Extract universe ID if available
    universe_id = None
    if create_response.status_code == 201:
        try:
            universe_id = create_response.json().get("universe", {}).get("id")
            print_colored(f"Universe created with ID: {universe_id}", GREEN)
        except:
            print_colored("Could not extract universe ID from response", RED)
            
    # If we couldn't get an ID, use a fallback
    if not universe_id:
        universe_id = 1
        print_colored(f"Using fallback universe ID: {universe_id}", YELLOW)
    
    # 2. Get Universe
    print_colored("\n2. Getting Universe...", BLUE)
    get_response = requests.get(
        f"{BASE_URL}/universes/{universe_id}",
        headers=headers
    )
    
    print_response(get_response)
    
    # 3. Update Universe
    print_colored("\n3. Updating Universe...", BLUE)
    update_data = {
        "name": "Updated Python Test Universe",
        "description": "Updated through Python API tests",
        "is_public": True
    }
    
    update_response = requests.put(
        f"{BASE_URL}/universes/{universe_id}",
        headers=headers,
        json=update_data
    )
    
    print_response(update_response)
    
    # 4. List All Universes
    print_colored("\n4. Listing All Universes...", BLUE)
    list_response = requests.get(
        f"{BASE_URL}/universes",
        headers=headers
    )
    
    print_response(list_response)
    
    # 5. Delete Universe
    print_colored("\n5. Deleting Universe...", BLUE)
    delete_response = requests.delete(
        f"{BASE_URL}/universes/{universe_id}",
        headers=headers
    )
    
    print_response(delete_response)
    
    return universe_id

def test_scene_crud(token, universe_id=None):
    """Test Scene CRUD operations"""
    if not token:
        print_colored("No token available. Skipping Scene tests.", RED)
        return
        
    print_colored("\n=== SCENE CRUD TESTS ===", YELLOW)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a universe for scenes if needed
    if not universe_id:
        print_colored("\nCreating Universe for Scenes...", BLUE)
        universe_data = {
            "name": "Scene Test Universe",
            "description": "For scene testing",
            "is_public": True
        }
        
        create_universe_response = requests.post(
            f"{BASE_URL}/universes",
            headers=headers,
            json=universe_data
        )
        
        print_response(create_universe_response)
        
        if create_universe_response.status_code == 201:
            try:
                universe_id = create_universe_response.json().get("universe", {}).get("id")
                print_colored(f"Universe created with ID: {universe_id}", GREEN)
            except:
                print_colored("Could not extract universe ID from response", RED)
                
        # If we couldn't get an ID, use a fallback
        if not universe_id:
            universe_id = 1
            print_colored(f"Using fallback universe ID: {universe_id}", YELLOW)
    
    # 1. Create Scene
    print_colored("\n1. Creating Scene...", BLUE)
    scene_data = {
        "name": "Python Test Scene",
        "description": "Created through Python API tests",
        "universe_id": universe_id,
        "is_public": True
    }
    
    create_response = requests.post(
        f"{BASE_URL}/scenes",
        headers=headers,
        json=scene_data
    )
    
    print_response(create_response)
    
    # Extract scene ID if available
    scene_id = None
    if create_response.status_code == 201:
        try:
            scene_id = create_response.json().get("scene", {}).get("id")
            print_colored(f"Scene created with ID: {scene_id}", GREEN)
        except:
            print_colored("Could not extract scene ID from response", RED)
            
    # If we couldn't get an ID, use a fallback
    if not scene_id:
        scene_id = 1
        print_colored(f"Using fallback scene ID: {scene_id}", YELLOW)
    
    # 2. Get Scene
    print_colored("\n2. Getting Scene...", BLUE)
    get_response = requests.get(
        f"{BASE_URL}/scenes/{scene_id}",
        headers=headers
    )
    
    print_response(get_response)
    
    # 3. Update Scene
    print_colored("\n3. Updating Scene...", BLUE)
    update_data = {
        "name": "Updated Python Test Scene",
        "description": "Updated through Python API tests",
        "universe_id": universe_id,
        "is_public": True
    }
    
    update_response = requests.put(
        f"{BASE_URL}/scenes/{scene_id}",
        headers=headers,
        json=update_data
    )
    
    print_response(update_response)
    
    # 4. List All Scenes
    print_colored("\n4. Listing Scenes for Universe...", BLUE)
    list_response = requests.get(
        f"{BASE_URL}/universes/{universe_id}/scenes",
        headers=headers
    )
    
    print_response(list_response)
    
    # 5. Delete Scene
    print_colored("\n5. Deleting Scene...", BLUE)
    delete_response = requests.delete(
        f"{BASE_URL}/scenes/{scene_id}",
        headers=headers
    )
    
    print_response(delete_response)

def test_character_crud(token, universe_id=None):
    """Test Character CRUD operations"""
    if not token:
        print_colored("No token available. Skipping Character tests.", RED)
        return
        
    print_colored("\n=== CHARACTER CRUD TESTS ===", YELLOW)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Use existing universe ID or fallback
    if not universe_id:
        universe_id = 1
        print_colored(f"Using fallback universe ID: {universe_id}", YELLOW)
    
    # 1. Create Character
    print_colored("\n1. Creating Character...", BLUE)
    character_data = {
        "name": "Python Test Character",
        "description": "Created through Python API tests",
        "universe_id": universe_id
    }
    
    create_response = requests.post(
        f"{BASE_URL}/characters",
        headers=headers,
        json=character_data
    )
    
    print_response(create_response)
    
    # Extract character ID if available
    character_id = None
    if create_response.status_code == 201:
        try:
            character_id = create_response.json().get("character", {}).get("id")
            print_colored(f"Character created with ID: {character_id}", GREEN)
        except:
            print_colored("Could not extract character ID from response", RED)
            
    # If we couldn't get an ID, use a fallback
    if not character_id:
        character_id = 1
        print_colored(f"Using fallback character ID: {character_id}", YELLOW)
    
    # 2. Get Character
    print_colored("\n2. Getting Character...", BLUE)
    get_response = requests.get(
        f"{BASE_URL}/characters/{character_id}",
        headers=headers
    )
    
    print_response(get_response)
    
    # 3. Update Character
    print_colored("\n3. Updating Character...", BLUE)
    update_data = {
        "name": "Updated Python Test Character",
        "description": "Updated through Python API tests",
        "universe_id": universe_id
    }
    
    update_response = requests.put(
        f"{BASE_URL}/characters/{character_id}",
        headers=headers,
        json=update_data
    )
    
    print_response(update_response)
    
    # 4. List Characters for Universe
    print_colored("\n4. Listing Characters for Universe...", BLUE)
    list_response = requests.get(
        f"{BASE_URL}/universes/{universe_id}/characters",
        headers=headers
    )
    
    print_response(list_response)
    
    # 5. Delete Character
    print_colored("\n5. Deleting Character...", BLUE)
    delete_response = requests.delete(
        f"{BASE_URL}/characters/{character_id}",
        headers=headers
    )
    
    print_response(delete_response)

def test_note_crud(token, universe_id=None):
    """Test Note CRUD operations"""
    if not token:
        print_colored("No token available. Skipping Note tests.", RED)
        return
        
    print_colored("\n=== NOTE CRUD TESTS ===", YELLOW)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Use existing universe ID or fallback
    if not universe_id:
        universe_id = 1
        print_colored(f"Using fallback universe ID: {universe_id}", YELLOW)
    
    # 1. Create Note
    print_colored("\n1. Creating Note...", BLUE)
    note_data = {
        "title": "Python Test Note",
        "content": "This note was created through Python API tests",
        "universe_id": universe_id
    }
    
    create_response = requests.post(
        f"{BASE_URL}/notes",
        headers=headers,
        json=note_data
    )
    
    print_response(create_response)
    
    # Extract note ID if available
    note_id = None
    if create_response.status_code == 201:
        try:
            note_id = create_response.json().get("note", {}).get("id")
            print_colored(f"Note created with ID: {note_id}", GREEN)
        except:
            print_colored("Could not extract note ID from response", RED)
            
    # If we couldn't get an ID, use a fallback
    if not note_id:
        note_id = 1
        print_colored(f"Using fallback note ID: {note_id}", YELLOW)
    
    # 2. Get Note
    print_colored("\n2. Getting Note...", BLUE)
    get_response = requests.get(
        f"{BASE_URL}/notes/{note_id}",
        headers=headers
    )
    
    print_response(get_response)
    
    # 3. Update Note
    print_colored("\n3. Updating Note...", BLUE)
    update_data = {
        "title": "Updated Python Test Note",
        "content": "This note was updated through Python API tests",
        "universe_id": universe_id
    }
    
    update_response = requests.put(
        f"{BASE_URL}/notes/{note_id}",
        headers=headers,
        json=update_data
    )
    
    print_response(update_response)
    
    # 4. List Notes for Universe
    print_colored("\n4. Listing Notes for Universe...", BLUE)
    list_response = requests.get(
        f"{BASE_URL}/universes/{universe_id}/notes",
        headers=headers
    )
    
    print_response(list_response)
    
    # 5. Delete Note
    print_colored("\n5. Deleting Note...", BLUE)
    delete_response = requests.delete(
        f"{BASE_URL}/notes/{note_id}",
        headers=headers
    )
    
    print_response(delete_response)

def main():
    """Run all CRUD tests"""
    print_colored("======================================", BLUE)
    print_colored("    Harmonic Universe API Tests", BLUE)
    print_colored("======================================", BLUE)
    
    # Get authentication token
    token = get_auth_token()
    
    if not token:
        print_colored("Could not get authentication token. Aborting tests.", RED)
        sys.exit(1)
    
    # Run CRUD tests for all features
    universe_id = test_universe_crud(token)
    test_scene_crud(token, universe_id)
    test_character_crud(token, universe_id)
    test_note_crud(token, universe_id)
    
    print_colored("\nAll API tests completed!", GREEN)

if __name__ == "__main__":
    main() 