import unittest
from unittest.mock import MagicMock, patch
from app.services.websocket_manager import WebSocketManager
from flask_socketio import SocketIO
import time

class TestWebSocketManager(unittest.TestCase):
    def setUp(self):
        self.socketio = MagicMock(spec=SocketIO)
        self.manager = WebSocketManager(self.socketio)

    def test_initialize_room(self):
        room_id = 'test_room'
        self.manager.initialize_room(room_id)

        self.assertIn(room_id, self.manager.rooms)
        room_data = self.manager.rooms[room_id]

        self.assertIn('harmony_engine', room_data)
        self.assertIn('storyboard_manager', room_data)
        self.assertIn('clients', room_data)
        self.assertIn('last_update', room_data)

        self.assertEqual(len(room_data['clients']), 0)

    def test_cleanup_room(self):
        room_id = 'test_room'
        self.manager.initialize_room(room_id)
        self.manager.cleanup_room(room_id)

        self.assertNotIn(room_id, self.manager.rooms)

    def test_start_stop_updates(self):
        self.manager.start_updates()
        self.assertTrue(self.manager.is_running)
        self.assertIsNotNone(self.manager.update_thread)

        self.manager.stop_updates()
        self.assertFalse(self.manager.is_running)

    @patch('time.sleep', return_value=None)
    def test_update_loop(self, mock_sleep):
        room_id = 'test_room'
        self.manager.initialize_room(room_id)

        # Add a mock client to the room
        with self.manager.lock:
            self.manager.rooms[room_id]['clients'].add('test_client')

        # Start updates
        self.manager.start_updates()

        # Let it run for a short time
        time.sleep(0.1)

        # Stop updates
        self.manager.stop_updates()

        # Verify that emit was called
        self.socketio.emit.assert_called()

        # Verify emit call arguments
        args, kwargs = self.socketio.emit.call_args
        self.assertEqual(args[0], 'state_update')
        self.assertIn('harmony', args[1])
        self.assertIn('timeline', args[1])
        self.assertEqual(kwargs['room'], room_id)

    def test_handle_client_message(self):
        room_id = 'test_room'
        self.manager.initialize_room(room_id)

        # Test add_particle message
        self.manager.handle_client_message('add_particle', {
            'x': 10,
            'y': 20,
            'mass': 1.0
        }, room_id)

        # Test update_physics message
        self.manager.handle_client_message('update_physics', {
            'gravity': 9.81,
            'friction': 0.5
        }, room_id)

        # Test invalid room
        with self.assertRaises(ValueError):
            self.manager.handle_client_message('add_particle', {}, 'invalid_room')

        # Test invalid message type
        with self.assertRaises(ValueError):
            self.manager.handle_client_message('invalid_type', {}, room_id)

if __name__ == '__main__':
    unittest.main()
