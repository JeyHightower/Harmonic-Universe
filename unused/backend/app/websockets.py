from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request, current_app
from threading import Lock
from datetime import datetime
import json
import zlib
from .extensions import cache
from .models import Universe, User, db
from .utils.error_handlers import handle_websocket_error

# Initialize SocketIO with message queue
socketio = SocketIO(message_queue="redis://")
thread = None
thread_lock = Lock()

# Message batching
message_queue = []
BATCH_SIZE = 10
BATCH_TIMEOUT = 0.1  # seconds
COMPRESSION_THRESHOLD = 1024  # bytes


class BatchProcessor:
    def __init__(self):
        self.message_queue = []
        self.batch_size = BATCH_SIZE
        self.batch_timeout = BATCH_TIMEOUT
        self.last_batch_time = datetime.now()
        self.lock = Lock()

    def compress_data(self, data):
        """Compress data if it exceeds threshold"""
        json_data = json.dumps(data)
        if len(json_data) < COMPRESSION_THRESHOLD:
            return {"compressed": False, "data": data}

        compressed = zlib.compress(json_data.encode())
        return {"compressed": True, "data": compressed}

    def decompress_data(self, compressed_data):
        """Decompress data if it was compressed"""
        if not compressed_data.get("compressed"):
            return compressed_data["data"]

        decompressed = zlib.decompress(compressed_data["data"]).decode()
        return json.loads(decompressed)

    def add_message(self, event_type, data):
        """Add message to queue with error handling"""
        try:
            with self.lock:
                self.message_queue.append(
                    {
                        "type": event_type,
                        "data": data,
                        "timestamp": datetime.now().isoformat(),
                    }
                )
                self.process_queue_if_needed()
        except Exception as e:
            current_app.logger.error(f"Error adding message: {str(e)}")
            emit("error", {"message": "Failed to process message"})

    def process_queue_if_needed(self):
        """Process queue if conditions are met"""
        try:
            current_time = datetime.now()
            queue_size = len(self.message_queue)

            if queue_size >= self.batch_size or (
                queue_size > 0
                and (current_time - self.last_batch_time).total_seconds()
                >= self.batch_timeout
            ):
                self.flush_queue()
        except Exception as e:
            current_app.logger.error(f"Error processing queue: {str(e)}")
            emit("error", {"message": "Failed to process message queue"})

    def flush_queue(self):
        """Flush queue with compression and error handling"""
        try:
            with self.lock:
                if not self.message_queue:
                    return

                batch = self.message_queue[: self.batch_size]
                self.message_queue = self.message_queue[self.batch_size :]

                # Compress batch if needed
                compressed_batch = self.compress_data(batch)

                # Emit batch update to all connected clients
                socketio.emit("batch_update", compressed_batch)
                self.last_batch_time = datetime.now()
        except Exception as e:
            current_app.logger.error(f"Error flushing queue: {str(e)}")
            emit("error", {"message": "Failed to send batch update"})


batch_processor = BatchProcessor()


@socketio.on("connect")
def handle_connect():
    """Handle client connection with error handling"""
    try:
        print(f"Client connected: {request.sid}")
        emit("connection_success", {"status": "connected"})
    except Exception as e:
        handle_websocket_error(e, "connection")


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection with error handling"""
    try:
        print(f"Client disconnected: {request.sid}")
    except Exception as e:
        handle_websocket_error(e, "disconnection")


@socketio.on("join_room")
def handle_join_room(data):
    """Handle room joining with error handling"""
    try:
        room = data.get("room_token")
        if not room:
            raise ValueError("Room token is required")

        join_room(room)
        emit("room_joined", {"room": room}, room=room)
    except Exception as e:
        handle_websocket_error(e, "room_join")


@socketio.on("leave_room")
def handle_leave_room(data):
    """Handle room leaving with error handling"""
    try:
        room = data.get("room_token")
        if not room:
            raise ValueError("Room token is required")

        leave_room(room)
        emit("room_left", {"room": room}, room=room)
    except Exception as e:
        handle_websocket_error(e, "room_leave")


@socketio.on("batch_update")
def handle_batch_update(compressed_data):
    """Handle batch updates with compression and error handling"""
    try:
        # Decompress data if needed
        batch = batch_processor.decompress_data(compressed_data)

        for message in batch:
            event = message.get("event")
            data = message.get("data")
            message_id = message.get("messageId")

            if event == "universe_update":
                handle_universe_update(data, message_id)
            elif event == "user_update":
                handle_user_update(data, message_id)
            # Add more event handlers as needed

            # Acknowledge message processing
            emit("message_ack", {"messageId": message_id, "status": "success"})
    except Exception as e:
        current_app.logger.error(f"Error handling batch update: {str(e)}")
        if "messageId" in locals():
            emit(
                "message_ack",
                {"messageId": message_id, "status": "error", "error": str(e)},
            )
        emit("error", {"message": "Failed to process batch update"})


def handle_universe_update(data, message_id):
    """Handle universe updates with error handling"""
    try:
        universe_id = data.get("id")
        action = data.get("action")

        if action == "create":
            universe = Universe(**data)
            db.session.add(universe)
            db.session.commit()
            cache.delete("universes")
            batch_processor.add_message("universe_created", universe.to_dict())

        elif action == "update":
            universe = Universe.query.get(universe_id)
            if universe:
                for key, value in data.items():
                    if hasattr(universe, key):
                        setattr(universe, key, value)
                db.session.commit()
                cache.delete(f"universe_{universe_id}")
                cache.delete("universes")
                batch_processor.add_message("universe_updated", universe.to_dict())

        elif action == "delete":
            universe = Universe.query.get(universe_id)
            if universe:
                db.session.delete(universe)
                db.session.commit()
                cache.delete(f"universe_{universe_id}")
                cache.delete("universes")
                batch_processor.add_message("universe_deleted", {"id": universe_id})

    except Exception as e:
        current_app.logger.error(f"Error handling universe update: {str(e)}")
        emit(
            "message_ack", {"messageId": message_id, "status": "error", "error": str(e)}
        )
        emit("error", {"message": str(e)})


def handle_user_update(data, message_id):
    """Handle user updates with error handling"""
    try:
        user_id = data.get("id")
        action = data.get("action")

        if action == "update":
            user = User.query.get(user_id)
            if user:
                for key, value in data.items():
                    if hasattr(user, key):
                        setattr(user, key, value)
                db.session.commit()
                cache.delete(f"user_{user_id}")
                batch_processor.add_message("user_updated", user.to_dict())

    except Exception as e:
        current_app.logger.error(f"Error handling user update: {str(e)}")
        emit(
            "message_ack", {"messageId": message_id, "status": "error", "error": str(e)}
        )
        emit("error", {"message": str(e)})
