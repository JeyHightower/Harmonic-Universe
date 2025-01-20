import json
import websocket
import threading
import time

class WebSocketTestClient:
    """Test client for WebSocket integration tests."""
    def __init__(self, url):
        self.url = url
        self.ws = None
        self.connected = False
        self.received_messages = []
        self._connect_lock = threading.Lock()
        self._message_lock = threading.Lock()

    def connect(self):
        """Connect to the WebSocket server."""
        with self._connect_lock:
            if not self.connected:
                try:
                    self.ws = websocket.WebSocket()
                    self.ws.connect(self.url)
                    self.connected = True
                    return True
                except Exception as e:
                    print(f"Connection failed: {e}")
                    return False
            return True

    def disconnect(self):
        """Disconnect from the WebSocket server."""
        with self._connect_lock:
            if self.connected and self.ws:
                try:
                    self.ws.close()
                finally:
                    self.connected = False
                    self.ws = None

    def send_message(self, message):
        """Send a message to the WebSocket server."""
        if not self.connected:
            return False
        try:
            self.ws.send(json.dumps(message))
            return True
        except Exception as e:
            print(f"Send failed: {e}")
            return False

    def receive_message(self, timeout=1):
        """Receive a message from the WebSocket server."""
        if not self.connected:
            return None
        try:
            self.ws.settimeout(timeout)
            message = self.ws.recv()
            return json.loads(message)
        except Exception as e:
            print(f"Receive failed: {e}")
            return None

    def authenticate(self, token):
        """Send authentication message."""
        auth_message = {
            'type': 'authenticate',
            'token': token
        }
        return self.send_message(auth_message)

    def subscribe(self, universe_id):
        """Subscribe to a universe."""
        subscribe_message = {
            'type': 'subscribe',
            'universe_id': universe_id
        }
        return self.send_message(subscribe_message)

    def unsubscribe(self, universe_id):
        """Unsubscribe from a universe."""
        unsubscribe_message = {
            'type': 'unsubscribe',
            'universe_id': universe_id
        }
        return self.send_message(unsubscribe_message)

    def wait_for_message(self, message_type, timeout=5):
        """Wait for a specific type of message."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            message = self.receive_message(timeout=1)
            if message and message.get('type') == message_type:
                return message
        return None
