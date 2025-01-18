import eventlet
eventlet.monkey_patch()

import socketio
import time
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create a Socket.IO client with specific version and transport options
sio = socketio.Client(
    logger=True,
    engineio_logger=True,
    ssl_verify=False,
    reconnection=True,
    reconnection_attempts=5,
    reconnection_delay=1,
    reconnection_delay_max=5,
    request_timeout=10
)

@sio.event
def connect():
    logger.info('Connected to server')
    # Join a room
    sio.emit('join_room', {'room_id': 'test_room'})

    # Add a test particle
    sio.emit('client_message', {
        'type': 'add_particle',
        'room_id': 'test_room',
        'payload': {
            'x': 50.0,
            'y': 50.0,
            'mass': 1.0
        }
    })

@sio.event
def connect_error(data):
    logger.error('Connection failed: %s', data)

@sio.event
def disconnect():
    logger.info('Disconnected from server')

@sio.on('state_update')
def on_state_update(data):
    logger.info('Received state update:')
    logger.info(f"Number of particles: {len(data['harmony']['particles'])}")
    logger.info(f"Timeline status: {data['timeline']}")

@sio.on('message_processed')
def on_message_processed(data):
    logger.info('Message processed: %s', data)

@sio.on('connection_established')
def on_connection_established(data):
    logger.info('Connection established: %s', data)

@sio.on('room_joined')
def on_room_joined(data):
    logger.info('Room joined: %s', data)

def main():
    try:
        # Connect to the server with websocket transport
        logger.info('Attempting to connect to server...')
        print(f"Attempting WebSocket connection to ws://localhost:5002/socket.io/?transport=websocket&EIO=4")
        sio.connect(
            'http://localhost:5002',
            wait=True,
            wait_timeout=10,
            transports=['websocket'],
            namespaces=['/'],
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5002'
            }
        )
        logger.info('Connection established')

        # Keep the script running for a while to receive updates
        time.sleep(10)

        # Clean up
        sio.emit('leave_room', {'room_id': 'test_room'})
        sio.disconnect()

    except Exception as e:
        logger.error('Error: %s', str(e), exc_info=True)
        if hasattr(sio, 'connected') and sio.connected:
            sio.disconnect()
        sys.exit(1)

if __name__ == '__main__':
    main()
