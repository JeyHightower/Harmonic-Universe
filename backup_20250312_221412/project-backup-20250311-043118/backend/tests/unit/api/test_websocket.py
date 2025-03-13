import pytest
from flask_socketio import SocketIOTestClient
from app import create_app, socketio, db
from app.models.user import User
from app.models.universe import Universe


class TestWebSocket:
    def test_connection(self, socketio_client):
        """Test basic connection functionality"""
        assert socketio_client.is_connected(namespace="/test")

    def test_unauthorized_connection(self, unauthenticated_socketio_client):
        """Test connection without authentication"""
        received = unauthenticated_socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "error" for event in received)

    def test_universe_join(self, app, socketio_client, test_universe):
        """Test joining a universe room"""
        socketio_client.emit(
            "join", {"universe_id": test_universe.id}, namespace="/test"
        )
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "join_response" for event in received)
        join_event = next(
            event for event in received if event.get("name") == "join_response"
        )
        assert join_event["args"][0]["status"] == "success"
        assert "universe" in join_event["args"][0]

    def test_parameter_update(self, app, socketio_client, test_universe):
        """Test updating universe parameters"""
        # Join universe first
        socketio_client.emit(
            "join", {"universe_id": test_universe.id}, namespace="/test"
        )
        socketio_client.get_received(namespace="/test")  # Clear received events

        # Update parameters
        update_data = {
            "universe_id": test_universe.id,
            "parameters": {"physics": {"gravity": 5.0, "time_dilation": 2.0}},
        }
        socketio_client.emit("parameter_update", update_data, namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "parameters_updated" for event in received)
        update_event = next(
            event for event in received if event.get("name") == "parameters_updated"
        )
        assert update_event["args"][0]["parameters"]["physics"]["gravity"] == 5.0

    def test_leave_universe(self, app, socketio_client, test_universe):
        """Test leaving a universe room"""
        # Join first
        socketio_client.emit(
            "join", {"universe_id": test_universe.id}, namespace="/test"
        )
        socketio_client.get_received(namespace="/test")  # Clear received events

        # Leave
        socketio_client.emit(
            "leave", {"universe_id": test_universe.id}, namespace="/test"
        )
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "leave_response" for event in received)

    def test_heartbeat(self, socketio_client):
        """Test heartbeat functionality"""
        socketio_client.emit("heartbeat", namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "heartbeat_response" for event in received)

    def test_error_handling(self, socketio_client):
        """Test error handling for invalid requests"""
        # Try to join non-existent universe
        socketio_client.emit("join", {"universe_id": 99999}, namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "error" for event in received)

        # Try to update parameters without joining
        update_data = {
            "universe_id": 99999,
            "parameters": {"physics": {"gravity": 5.0}},
        }
        socketio_client.emit("parameter_update", update_data, namespace="/test")
        received = socketio_client.get_received(namespace="/test")
        assert any(event.get("name") == "error" for event in received)
