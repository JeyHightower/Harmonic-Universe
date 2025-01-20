import socketio
import time
import logging
import sys
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WebSocketTestClient:
    def __init__(self, url='http://localhost:5002'):
        """Initialize Socket.IO client with minimal configuration."""
        self.url = url
        self.sio = socketio.Client(
            logger=True,
            engineio_logger=True,
            reconnection=True,
            reconnection_attempts=5
        )
        self.setup_handlers()
        self.connected = False
        self.received_messages = []

    def setup_handlers(self):
        """Set up event handlers for the Socket.IO client."""
        @self.sio.event
        def connect():
            logger.info('Connected to server')
            self.connected = True

        @self.sio.event
        def connect_error(data):
            logger.error(f'Connection failed: {data}')
            self.connected = False

        @self.sio.event
        def disconnect():
            logger.info('Disconnected from server')
            self.connected = False

        @self.sio.on('state_update')
        def on_state_update(data):
            logger.info('State update received: %s', data)
            self.received_messages.append(('state_update', data))

        @self.sio.on('room_joined')
        def on_room_joined(data):
            logger.info('Room joined: %s', data)
            self.received_messages.append(('room_joined', data))

        @self.sio.on('error')
        def on_error(data):
            logger.error('Error received: %s', data)
            self.received_messages.append(('error', data))

    def connect(self):
        """Connect to the WebSocket server."""
        try:
            logger.info(f'Attempting to connect to {self.url}')
            self.sio.connect(
                self.url,
                transports=['websocket'],
                namespaces=['/']
            )
            return True
        except Exception as e:
            logger.error(f'Connection error: {e}')
            return False

    def disconnect(self):
        """Disconnect from the WebSocket server."""
        try:
            if self.connected:
                self.sio.disconnect()
            return True
        except Exception as e:
            logger.error(f'Disconnect error: {e}')
            return False

    def send_message(self, message_type: str, payload: Dict[str, Any]):
        """Send a message to the server."""
        try:
            if not self.connected:
                logger.error('Not connected to server')
                return False

            self.sio.emit('client_message', {
                'type': message_type,
                'payload': payload
            })
            return True
        except Exception as e:
            logger.error(f'Error sending message: {e}')
            return False

    def run_test_sequence(self):
        """Run a sequence of tests."""
        try:
            # Connect to server
            if not self.connect():
                return False

            # Join a test room
            self.sio.emit('join_room', {'room_id': 'test_room'})
            time.sleep(1)  # Wait for room join confirmation

            # Test particle creation
            self.send_message('add_particle', {
                'x': 50.0,
                'y': 50.0,
                'mass': 1.0
            })
            time.sleep(1)

            # Test physics parameter update
            self.send_message('update_physics', {
                'gravity': 9.81,
                'friction': 0.5
            })
            time.sleep(1)

            # Wait for state updates
            time.sleep(5)

            # Cleanup
            self.disconnect()
            return True

        except Exception as e:
            logger.error(f'Test sequence error: {e}')
            return False

def main():
    """Main entry point for the test client."""
    client = WebSocketTestClient()

    try:
        success = client.run_test_sequence()
        if success:
            logger.info('Test sequence completed successfully')
        else:
            logger.error('Test sequence failed')
            sys.exit(1)
    except KeyboardInterrupt:
        logger.info('Test interrupted by user')
        client.disconnect()
    except Exception as e:
        logger.error(f'Unexpected error: {e}')
        client.disconnect()
        sys.exit(1)

if __name__ == '__main__':
    main()
