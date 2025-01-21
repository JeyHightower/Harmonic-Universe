"""WebSocket handler for physics simulation updates."""
import json
import asyncio
from typing import Dict, Set, Optional
from flask_socketio import emit, join_room, leave_room
from ..models import Universe, PhysicsParameters
from ..services.physics_engine import PhysicsEngine, Vector2D
from ..extensions import socketio, db

# Store active simulations
active_simulations: Dict[int, PhysicsEngine] = {}
# Store connected clients for each universe
universe_clients: Dict[int, Set[str]] = {}

def get_or_create_simulation(universe_id: int) -> Optional[PhysicsEngine]:
    """Get or create a physics simulation for a universe."""
    if universe_id in active_simulations:
        return active_simulations[universe_id]

    # Get universe and physics parameters
    universe = Universe.query.get(universe_id)
    if not universe:
        return None

    # Create new simulation
    engine = PhysicsEngine(universe.physics_parameters)
    active_simulations[universe_id] = engine
    return engine

@socketio.on('join_simulation')
def handle_join_simulation(data):
    """Handle client joining a physics simulation."""
    universe_id = data.get('universe_id')
    if not universe_id:
        emit('error', {'message': 'Universe ID is required'})
        return

    # Get or create simulation
    engine = get_or_create_simulation(universe_id)
    if not engine:
        emit('error', {'message': 'Universe not found'})
        return

    # Add client to universe room
    room = f'universe_{universe_id}'
    join_room(room)

    # Track connected clients
    if universe_id not in universe_clients:
        universe_clients[universe_id] = set()
    universe_clients[universe_id].add(request.sid)

    # Send initial state
    emit('simulation_state', engine.update(0))

@socketio.on('leave_simulation')
def handle_leave_simulation(data):
    """Handle client leaving a physics simulation."""
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    room = f'universe_{universe_id}'
    leave_room(room)

    # Remove client from tracking
    if universe_id in universe_clients:
        universe_clients[universe_id].discard(request.sid)

        # Clean up if no clients are connected
        if not universe_clients[universe_id]:
            if universe_id in active_simulations:
                del active_simulations[universe_id]
            del universe_clients[universe_id]

@socketio.on('add_particle')
def handle_add_particle(data):
    """Handle adding a particle to the simulation."""
    universe_id = data.get('universe_id')
    if not universe_id or universe_id not in active_simulations:
        emit('error', {'message': 'Invalid universe ID'})
        return

    engine = active_simulations[universe_id]

    # Create particle from data
    position = Vector2D(data.get('x', 0), data.get('y', 0))
    velocity = Vector2D(data.get('vx', 0), data.get('vy', 0))
    mass = data.get('mass', 1.0)
    radius = data.get('radius', 1.0)

    # Add particle to simulation
    particle = engine.add_particle(position, velocity, mass, radius)

    # Notify all clients in the universe
    room = f'universe_{universe_id}'
    emit('particle_added', {
        'id': particle.id,
        'position': {'x': position.x, 'y': position.y},
        'velocity': {'x': velocity.x, 'y': velocity.y},
        'mass': mass,
        'radius': radius
    }, room=room)

@socketio.on('clear_simulation')
def handle_clear_simulation(data):
    """Handle clearing all particles from the simulation."""
    universe_id = data.get('universe_id')
    if not universe_id or universe_id not in active_simulations:
        emit('error', {'message': 'Invalid universe ID'})
        return

    engine = active_simulations[universe_id]
    engine.clear()

    # Notify all clients
    room = f'universe_{universe_id}'
    emit('simulation_cleared', {}, room=room)

async def broadcast_simulation_updates():
    """Broadcast physics simulation updates to connected clients."""
    while True:
        for universe_id, engine in active_simulations.items():
            if universe_id in universe_clients and universe_clients[universe_id]:
                # Update simulation and broadcast state
                state = engine.update(1/60)  # 60 FPS
                room = f'universe_{universe_id}'

                # Include energy calculations
                energy = engine.get_energy()
                state['energy'] = energy

                emit('simulation_state', state, room=room, namespace='/')

        await asyncio.sleep(1/60)  # 60 FPS

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    emit('connected', {'message': 'Connected to physics simulation server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    # Remove client from all universes
    for universe_id in list(universe_clients.keys()):
        if request.sid in universe_clients[universe_id]:
            universe_clients[universe_id].discard(request.sid)

            # Clean up if no clients are connected
            if not universe_clients[universe_id]:
                if universe_id in active_simulations:
                    del active_simulations[universe_id]
                del universe_clients[universe_id]

# Start broadcasting updates when the application starts
@socketio.on_namespace('/')
def start_broadcasting():
    """Start broadcasting physics updates when the namespace is initialized."""
    asyncio.create_task(broadcast_simulation_updates())
