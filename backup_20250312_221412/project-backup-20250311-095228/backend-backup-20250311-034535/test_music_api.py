#!/usr/bin/env python3
"""
Test script for the music generation API.
"""
import requests
import json
import sys
import uuid
from pprint import pprint
import time
import os

# Configuration
API_URL = "http://localhost:8000"
EMAIL = "demo@example.com"  # Default demo user
PASSWORD = "demo123"  # Updated with correct demo password


def login():
    """Login and get access token."""
    print("Logging in...")
    try:
        print(f"Attempting to connect to {API_URL}/api/v1/auth/demo-login")
        response = requests.post(
            f"{API_URL}/api/v1/auth/demo-login",
            timeout=10,  # Set a timeout of 10 seconds
        )

        if response.status_code != 200:
            print(f"Login failed: {response.status_code}")
            print(response.text)
            sys.exit(1)

        data = response.json()
        print("Login successful!")
        return data["access_token"]
    except requests.exceptions.ConnectionError as e:
        print(f"Connection error: {e}")
        print("Is the server running? Check with 'ps aux | grep run.py'")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {type(e).__name__}: {e}")
        sys.exit(1)


def get_universes(token):
    """Get all universes for the user."""
    print("Getting universes...")
    try:
        response = requests.get(
            f"{API_URL}/api/v1/universes/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )

        if response.status_code != 200:
            print(f"Failed to get universes: {response.status_code}")
            print(response.text)
            return []

        universes = response.json()
        print(f"Found {len(universes)} universes")
        return universes
    except Exception as e:
        print(f"Error getting universes: {type(e).__name__}: {e}")
        return []


def generate_music(token, universe_id):
    """Generate music for a universe."""
    print(f"Generating music for universe {universe_id}...")
    try:
        response = requests.get(
            f"{API_URL}/api/v1/music/{universe_id}/generate",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,  # Longer timeout for music generation
        )

        if response.status_code != 200:
            print(f"Failed to generate music: {response.status_code}")
            print(response.text)
            return None

        music_data = response.json()
        print("Music generated successfully!")
        return music_data
    except Exception as e:
        print(f"Error generating music: {type(e).__name__}: {e}")
        return None


def download_music(token, universe_id):
    """Download music for a universe."""
    print(f"Downloading music for universe {universe_id}...")
    try:
        response = requests.get(
            f"{API_URL}/api/v1/music/{universe_id}/download",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,  # Longer timeout for music download
            stream=True,  # Stream the response to handle large files
        )

        if response.status_code != 200:
            print(f"Failed to download music: {response.status_code}")
            print(response.text)
            return False

        # Save the downloaded file
        download_path = f"universe_{universe_id}_music.wav"
        with open(download_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = os.path.getsize(download_path)
        print(
            f"Music downloaded successfully! File saved to {download_path} ({file_size} bytes)"
        )
        return True
    except Exception as e:
        print(f"Error downloading music: {type(e).__name__}: {e}")
        return False


def test_visualization_data(music_data):
    """Check if music data has all necessary elements for visualization."""
    required_elements = ["melody", "tempo", "scale_type", "physics_influence"]
    missing = [
        elem
        for elem in required_elements
        if elem not in music_data.get("music_data", {})
    ]

    if missing:
        print(
            f"Warning: Music data is missing elements needed for visualization: {', '.join(missing)}"
        )
        return False

    print("Music data contains all elements needed for visualization!")
    return True


def main():
    # Check if server is running
    try:
        print(f"Checking if server is running at {API_URL}/health...")
        health_response = requests.get(f"{API_URL}/health", timeout=5)
        print(f"Server health check response: {health_response.status_code}")
    except requests.exceptions.ConnectionError:
        print("Server appears to be down. Please start the server with 'python run.py'")
        sys.exit(1)

    # Login and get token
    token = login()

    # Get universes
    universes = get_universes(token)

    if not universes:
        print("No universes found. Please create one in the application first.")
        return

    # Print universe options
    print("\nAvailable universes:")
    for i, universe in enumerate(universes):
        print(f"{i+1}. {universe['name']} (ID: {universe['id']})")

    # Use the first universe without asking for input
    selected_universe = universes[0]
    print(
        f"\nAutomatically selected universe: {selected_universe['name']} (ID: {selected_universe['id']})"
    )

    # Generate music
    music_data = generate_music(token, selected_universe["id"])

    if music_data:
        print("\nGenerated Music Data:")
        pprint(music_data)

        # Test if data has all necessary elements for visualization
        test_visualization_data(music_data)

        # Download music
        download_success = download_music(token, selected_universe["id"])
        if download_success:
            print("\nAll music generation features are working correctly!")
    else:
        print("Failed to generate music data.")


if __name__ == "__main__":
    main()
