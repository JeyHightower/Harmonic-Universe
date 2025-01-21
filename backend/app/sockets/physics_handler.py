"""WebSocket handler for real-time physics simulation updates."""
import json
from typing import Dict, Set, Optional
from dataclasses import asdict
from flask import request, current_app
from flask_socketio import emit, join_room, leave_room, Namespace
from app.extensions import socketio, db
from app.models import Universe, PhysicsParameters
from app.physics.engine import PhysicsEngine, Particle, Vector2D, BoundaryType
from sqlalchemy.orm import joinedload
import threading
import logging

logger = logging.getLogger(__name__)

class PhysicsNamespace(Namespace):
    """Namespace for physics simulation WebSocket events."""

    def __init__(self, namespace=None):
        super().__init__(namespace)
        self.active_simulations: Dict[int, PhysicsEngine] = {}  # universe_id -> PhysicsEngine
        self.simulation_clients: Dict[int, Set[str]] = {}  # universe_id -> set of client IDs
        self.client_universes: Dict[str, int] = {}  # client_id -> universe_id
        self.update_task = None
        self.app = None
        self._stop_event = threading.Event()
        self.error_counts: Dict[str, int] = {}  # client_id -> error count
        self.max_errors = 3  # Maximum errors before disconnecting client

    def handle_error(self, client_id: str, error: Exception):
        """Handle and log errors, tracking per client."""
        logger.error(f"Error for client {client_id}: {str(error)}")

        if client_id not in self.error_counts:
            self.error_counts[client_id] = 0
        self.error_counts[client_id] += 1

        # Emit error to client
        self.emit('error', {
            'message': str(error),
            'error_count': self.error_counts[client_id]
        }, room=client_id)

    def on_connect(self):
        """Handle client connection."""
        try:
            client_id = request.sid
            logger.info(f"Client {client_id} connected")

            # Store app reference for background task
            if not self.app:
                self.app = current_app._get_current_object()
                logger.info("Stored app reference")

            # Start update loop if not already started
            if not self.update_task and not self._stop_event.is_set():
                self._stop_event.clear()
                logger.info("Starting background task")
                with self.app.app_context():
                    self.update_task = socketio.start_background_task(target=self.broadcast_updates)
                    logger.info(f"Background task started: {self.update_task}")

            # Emit connection established event
            self.emit('connection_established',
                     {'client_id': client_id, 'status': 'connected'},
                     room=client_id)

            self.error_counts[client_id] = 0

        except Exception as e:
            self.handle_error(request.sid, e)
            logger.error(f"Error in connection handler: {str(e)}")

    def on_disconnect(self):
        """Handle client disconnection."""
        try:
            client_id = request.sid
            if client_id in self.client_universes:
                universe_id = self.client_universes[client_id]
                self.leave_simulation(universe_id)
            self.error_counts.pop(client_id, None)

        except Exception as e:
            logger.error(f"Error during disconnect: {str(e)}")

    def on_join_simulation(self, data):
        """Handle client joining a simulation."""
        try:
            universe_id = data.get('universe_id')
            client_id = request.sid

            # Get universe and its physics parameters
            universe = Universe.query.options(
                joinedload(Universe.physics_parameters)
            ).get(universe_id)

            if not universe:
                raise ValueError(f'Universe {universe_id} not found')

            if not universe.physics_parameters:
                raise ValueError(f'Universe {universe_id} has no physics parameters')

            # Initialize simulation if not exists
            if universe_id not in self.active_simulations:
                logger.info(f"Initializing simulation for universe {universe_id}")
                self.active_simulations[universe_id] = PhysicsEngine(universe.physics_parameters)
                self.simulation_clients[universe_id] = set()

                # Set boundary from parameters
                self.active_simulations[universe_id].set_boundary(
                    boundary_type=data.get('boundary_type', 'bounce'),
                    x_min=data.get('x_min', -10.0),
                    x_max=data.get('x_max', 10.0),
                    y_min=data.get('y_min', -10.0),
                    y_max=data.get('y_max', 10.0)
                )

            # Add client to simulation room
            room = f'universe_{universe_id}'
            join_room(room)
            logger.info(f"Client {client_id} joined room {room}")
            self.simulation_clients[universe_id].add(client_id)
            self.client_universes[client_id] = universe_id

            # Send initial state
            state = self.active_simulations[universe_id].get_state()
            logger.info(f"Sending initial state to client {client_id}")
            self.emit('simulation_state', {
                'state': state,
                'universe_id': universe_id
            }, namespace='/physics')

        except Exception as e:
            self.handle_error(request.sid, e)

    def on_leave_simulation(self, data):
        """Handle client leaving a simulation."""
        try:
            universe_id = data.get('universe_id')
            self.leave_simulation(universe_id)

        except Exception as e:
            self.handle_error(request.sid, e)

    def leave_simulation(self, universe_id: int):
        """Remove client from simulation."""
        try:
            client_id = request.sid
            if universe_id in self.simulation_clients and client_id in self.simulation_clients[universe_id]:
                self.simulation_clients[universe_id].remove(client_id)
                leave_room(f'universe_{universe_id}')
                del self.client_universes[client_id]

                # Clean up simulation if no clients left
                if not self.simulation_clients[universe_id]:
                    del self.simulation_clients[universe_id]
                    del self.active_simulations[universe_id]

        except Exception as e:
            self.handle_error(request.sid, e)

    def on_add_particle(self, data):
        """Handle adding a particle to the simulation."""
        try:
            universe_id = data.get('universe_id')
            particle_data = data.get('particle', {})
            client_id = request.sid

            if universe_id not in self.active_simulations:
                raise ValueError(f'Universe {universe_id} not found')

            if not particle_data:
                raise ValueError('No particle data provided')

            # Extract particle properties with validation
            position = particle_data.get('position')
            velocity = particle_data.get('velocity')
            mass = float(particle_data.get('mass', 1.0))
            radius = float(particle_data.get('radius', 0.5))

            if not all([position, velocity]):
                raise ValueError('Missing required particle properties')

            if not all(k in position for k in ['x', 'y']):
                raise ValueError('Invalid position format')

            if not all(k in velocity for k in ['x', 'y']):
                raise ValueError('Invalid velocity format')

            # Create particle with validated data
            engine = self.active_simulations[universe_id]
            engine.add_particle(
                position=position,  # PhysicsEngine will create Vector2D
                velocity=velocity,  # PhysicsEngine will create Vector2D
                mass=mass,
                radius=radius
            )

            # Send immediate update
            state = engine.get_state()
            room = f'universe_{universe_id}'
            logger.info(f"Broadcasting state to room {room}")
            self.emit('simulation_state', {
                'state': state,
                'universe_id': universe_id
            }, room=room)

        except Exception as e:
            logger.error(f"Error adding particle: {str(e)}")
            self.emit('error', {'message': str(e)}, room=client_id)

    def on_clear_simulation(self, data):
        """Handle clearing all particles from the simulation."""
        try:
            universe_id = data.get('universe_id')
            if universe_id in self.active_simulations:
                self.active_simulations[universe_id].clear_particles()
                self.emit('simulation_cleared', room=f'universe_{universe_id}')

        except Exception as e:
            self.handle_error(request.sid, e)

    def on_set_boundary(self, data):
        """Handle setting simulation boundary."""
        try:
            universe_id = data.get('universe_id')
            if universe_id not in self.active_simulations:
                raise ValueError('Simulation not found')

            engine = self.active_simulations[universe_id]
            engine.set_boundary(
                boundary_type=data.get('type', 'bounce'),
                x_min=data.get('x_min', -10.0),
                x_max=data.get('x_max', 10.0),
                y_min=data.get('y_min', -10.0),
                y_max=data.get('y_max', 10.0),
                elasticity=data.get('elasticity')
            )

            # Broadcast boundary update
            self.emit('boundary_updated', {
                'boundary': engine.boundary.__dict__
            }, room=f'universe_{universe_id}')

        except Exception as e:
            self.handle_error(request.sid, e)

    def broadcast_updates(self):
        """Broadcast simulation updates to connected clients."""
        logger.info("Starting broadcast task")

        while not self._stop_event.is_set():
            try:
                if not self.app:
                    logger.error("No app context available")
                    socketio.sleep(1)
                    continue

                with self.app.app_context():
                    for universe_id, engine in list(self.active_simulations.items()):
                        if self.simulation_clients.get(universe_id):
                            # Update physics and broadcast state
                            state = engine.update(1/60)  # 60 FPS
                            logger.debug(f"Broadcasting state for universe {universe_id} to {len(self.simulation_clients[universe_id])} clients")

                            # Broadcast to all clients in the universe room
                            room = f'universe_{universe_id}'
                            logger.debug(f"Broadcasting to room: {room}")
                            self.emit('simulation_state',
                                    {
                                        'state': state,
                                        'universe_id': universe_id
                                    },
                                    room=room,
                                    namespace='/physics')  # Explicitly specify namespace

                    # Use socketio.sleep for proper timing
                    socketio.sleep(1/60)  # Wait for next frame

            except Exception as e:
                logger.error(f"Error in broadcast task: {str(e)}")
                socketio.sleep(1)  # Wait longer on error

    def cleanup(self):
        """Clean up namespace state."""
        logger.info("Cleaning up physics namespace")
        self._stop_event.set()
        if self.update_task:
            logger.info("Waiting for background task to stop")
            socketio.sleep(0.1)  # Give the task time to stop
            self.update_task = None
        self.active_simulations.clear()
        self.simulation_clients.clear()
        self.client_universes.clear()
        self.error_counts.clear()
        logger.info("Cleanup complete")

def init_socket_handlers(socketio):
    """Initialize socket handlers."""
    socketio.on_namespace(PhysicsNamespace('/physics'))
