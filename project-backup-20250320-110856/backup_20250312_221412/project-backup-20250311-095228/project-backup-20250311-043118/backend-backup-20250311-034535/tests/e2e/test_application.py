import pytest
import json
import time
from app.models.user import User
from app.models.universe import Universe
from app.models.profile import Profile
from app import db


class TestEndToEnd:
    def test_complete_application_flow(
        self, client, auth_headers, test_user, socketio_client
    ):
        """Test complete application flow from user registration to universe collaboration"""

        # Step 1: User Registration and Profile Setup
        # Create first user
        user1_response = client.post(
            "/api/auth/register",
            json={
                "username": "user1",
                "email": "user1@example.com",
                "password": "password123",
            },
        )
        assert user1_response.status_code == 201
        user1_data = json.loads(user1_response.data)

        # Create profile for first user
        user1_login = client.post(
            "/api/auth/login",
            json={"email": "user1@example.com", "password": "password123"},
        )
        user1_token = json.loads(user1_login.data)["access_token"]
        user1_headers = {"Authorization": f"Bearer {user1_token}"}

        profile_response = client.post(
            "/api/profile",
            json={
                "bio": "First user bio",
                "avatar_url": "http://example.com/avatar1.jpg",
            },
            headers=user1_headers,
        )
        assert profile_response.status_code == 201

        # Step 2: Universe Creation and Setup
        # Create a universe
        universe_response = client.post(
            "/api/universes",
            json={
                "name": "E2E Test Universe",
                "description": "Testing end-to-end flow",
                "is_public": True,
                "physics_parameters": {
                    "gravity": 9.81,
                    "time_dilation": 1.0,
                    "temperature": 293.15,
                },
            },
            headers=user1_headers,
        )
        assert universe_response.status_code == 201
        universe_data = json.loads(universe_response.data)
        universe_id = universe_data["id"]

        # Step 3: Collaboration Setup
        # Create second user
        user2_response = client.post(
            "/api/auth/register",
            json={
                "username": "user2",
                "email": "user2@example.com",
                "password": "password123",
            },
        )
        assert user2_response.status_code == 201
        user2_data = json.loads(user2_response.data)

        # Add second user as collaborator
        add_collab_response = client.post(
            f"/api/universes/{universe_id}/collaborators",
            json={"email": "user2@example.com"},
            headers=user1_headers,
        )
        assert add_collab_response.status_code == 201

        # Step 4: Real-time Collaboration
        # First user joins universe
        socketio_client.emit("join", {"universe_id": universe_id}, namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "join_response" for event in received)

        # Update universe parameters
        update_data = {
            "universe_id": universe_id,
            "parameters": {"physics": {"gravity": 5.0, "temperature": 300.0}},
        }
        socketio_client.emit("parameter_update", update_data, namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "parameters_updated" for event in received)

        # Step 5: Verify Universe State
        # Check universe state through API
        get_response = client.get(
            f"/api/universes/{universe_id}", headers=user1_headers
        )
        assert get_response.status_code == 200
        universe_state = json.loads(get_response.data)
        assert universe_state["physics_parameters"]["gravity"] == 5.0
        assert universe_state["physics_parameters"]["temperature"] == 300.0

        # Step 6: Test Second User Access
        # Login as second user
        user2_login = client.post(
            "/api/auth/login",
            json={"email": "user2@example.com", "password": "password123"},
        )
        user2_token = json.loads(user2_login.data)["access_token"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}

        # Verify access and make changes
        user2_get = client.get(f"/api/universes/{universe_id}", headers=user2_headers)
        assert user2_get.status_code == 200

        user2_update = client.put(
            f"/api/universes/{universe_id}",
            json={"description": "Updated by User 2"},
            headers=user2_headers,
        )
        assert user2_update.status_code == 200

        # Step 7: Test Universe Search and Filtering
        # Search for universe
        search_response = client.get(
            "/api/universes/search?q=E2E Test", headers=user1_headers
        )
        assert search_response.status_code == 200
        search_results = json.loads(search_response.data)
        assert len(search_results) > 0
        assert any(u["id"] == universe_id for u in search_results)

        # Filter public universes
        public_response = client.get("/api/universes/public", headers=user1_headers)
        assert public_response.status_code == 200
        public_universes = json.loads(public_response.data)
        assert any(u["id"] == universe_id for u in public_universes)

        # Step 8: Test Error Handling
        # Try to join non-existent universe
        socketio_client.emit("join", {"universe_id": 99999}, namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "error" for event in received)

        # Try to update without proper permissions
        invalid_update = client.put(
            f"/api/universes/99999",
            json={"name": "Invalid Update"},
            headers=user2_headers,
        )
        assert invalid_update.status_code in [403, 404]

    def test_stress_flow(self, client, auth_headers, socketio_client):
        """Test application behavior under stress"""
        # Create test universe
        universe_response = client.post(
            "/api/universes",
            json={
                "name": "Stress Test Universe",
                "description": "Testing under stress",
                "is_public": True,
            },
            headers=auth_headers,
        )
        universe_id = json.loads(universe_response.data)["id"]

        # Join universe
        socketio_client.emit("join", {"universe_id": universe_id}, namespace="/test")
        socketio_client.get_received(namespace="/test")  # Clear events

        # Simulate rapid updates
        for i in range(10):
            update_data = {
                "universe_id": universe_id,
                "parameters": {
                    "physics": {"gravity": float(i), "temperature": float(i * 10)}
                },
            }
            socketio_client.emit("parameter_update", update_data, namespace="/test")
            time.sleep(0.1)  # Small delay to prevent overwhelming

        # Verify final state
        received = socketio_client.get_received(namespace="/test")
        updates = [
            event for event in received if event.get("name") == "parameters_updated"
        ]
        assert len(updates) > 0
        final_update = updates[-1]
        assert final_update["args"][0]["parameters"]["physics"]["gravity"] == 9.0

    def test_recovery_flow(self, client, auth_headers, socketio_client):
        """Test application recovery from disconnections"""
        # Create test universe
        universe_response = client.post(
            "/api/universes",
            json={
                "name": "Recovery Test Universe",
                "description": "Testing recovery",
                "is_public": True,
            },
            headers=auth_headers,
        )
        universe_id = json.loads(universe_response.data)["id"]

        # Initial connection
        socketio_client.emit("join", {"universe_id": universe_id}, namespace="/test")
        socketio_client.get_received(namespace="/test")

        # Simulate disconnection and reconnection
        socketio_client.disconnect(namespace="/test")
        time.sleep(1)  # Wait for disconnection
        socketio_client.connect(namespace="/test")

        # Verify can still update after reconnection
        update_data = {
            "universe_id": universe_id,
            "parameters": {"physics": {"gravity": 7.0}},
        }
        socketio_client.emit("parameter_update", update_data, namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "parameters_updated" for event in received)
