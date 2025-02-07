"""
WebSocket handler for real-time communication.
"""

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from typing import Dict, Set
import json
import logging
from ..models.user import User
from ..models.universe import Universe
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

socketio = SocketIO()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, universe_id: int):
        await websocket.accept()
        if universe_id not in self.active_connections:
            self.active_connections[universe_id] = set()
        self.active_connections[universe_id].add(websocket)

    def disconnect(self, websocket: WebSocket, universe_id: int):
        self.active_connections[universe_id].remove(websocket)
        if not self.active_connections[universe_id]:
            del self.active_connections[universe_id]

    async def broadcast(self, message: dict, universe_id: int):
        if universe_id in self.active_connections:
            for connection in self.active_connections[universe_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@socketio.on('connect')
def handle_connect():
    try:
        token = decode_token(request.args.get('token'))
        user_id = token['sub']
        user = User.query.get(user_id)
        if not user:
            return False
        manager.user_sessions[request.sid] = user_id
        return True
    except Exception as e:
        logger.error(f"Connection error: {e}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    manager.disconnect(request.sid)

@socketio.on('join_universe')
def handle_join_universe(data):
    try:
        universe_id = data['universe_id']
        universe = Universe.query.get(universe_id)
        if not universe:
            emit('error', {'message': 'Universe not found'})
            return

        join_room(universe_id)
        manager.connect(request.sid, universe_id)
        emit('universe_joined', {
            'universe_id': universe_id,
            'message': f'Joined universe {universe.name}'
        })
    except Exception as e:
        logger.error(f"Error joining universe: {e}")
        emit('error', {'message': 'Failed to join universe'})

@socketio.on('leave_universe')
def handle_leave_universe(data):
    try:
        universe_id = data['universe_id']
        leave_room(universe_id)
        manager.disconnect(request.sid)
        emit('universe_left', {
            'universe_id': universe_id,
            'message': 'Left universe'
        })
    except Exception as e:
        logger.error(f"Error leaving universe: {e}")
        emit('error', {'message': 'Failed to leave universe'})

@socketio.on('physics_update')
def handle_physics_update(data):
    try:
        universe_id = data['universe_id']
        universe = Universe.query.get(universe_id)
        if not universe:
            emit('error', {'message': 'Universe not found'})
            return

        # Update physics parameters
        universe.update_physics(data['parameters'])

        # Broadcast update to all users in the universe
        manager.broadcast_to_universe(universe_id, 'physics_changed', {
            'universe_id': universe_id,
            'parameters': data['parameters']
        })

        # Generate and broadcast music update based on physics
        harmony = universe.calculate_harmony(data['parameters'])
        manager.broadcast_to_universe(universe_id, 'harmony_changed', {
            'universe_id': universe_id,
            'harmony': harmony
        })
    except Exception as e:
        logger.error(f"Error updating physics: {e}")
        emit('error', {'message': 'Failed to update physics'})

@socketio.on('story_update')
def handle_story_update(data):
    try:
        universe_id = data['universe_id']
        universe = Universe.query.get(universe_id)
        if not universe:
            emit('error', {'message': 'Universe not found'})
            return

        # Update story and harmony
        universe.update_story(data['story_point'])

        # Broadcast update to all users
        manager.broadcast_to_universe(universe_id, 'story_changed', {
            'universe_id': universe_id,
            'story_point': data['story_point']
        })
    except Exception as e:
        logger.error(f"Error updating story: {e}")
        emit('error', {'message': 'Failed to update story'})

@socketio.on('export_request')
def handle_export_request(data):
    try:
        universe_id = data['universe_id']
        universe = Universe.query.get(universe_id)
        if not universe:
            emit('error', {'message': 'Universe not found'})
            return

        # Generate exports
        json_export = universe.export_to_json()
        audio_export = universe.export_audio()

        emit('export_ready', {
            'universe_id': universe_id,
            'json_data': json_export,
            'audio_url': audio_export
        })
    except Exception as e:
        logger.error(f"Error exporting universe: {e}")
        emit('error', {'message': 'Failed to export universe'})

async def handle_websocket(websocket: WebSocket, universe_id: int):
    await manager.connect(websocket, universe_id)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data, universe_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, universe_id)
        await manager.broadcast(
            {"type": "disconnect", "message": "Client disconnected"},
            universe_id
        )
