"""WebSocket handler for real-time physics simulation updates."""
import json
import asyncio
from typing import Dict, Set, Optional
from dataclasses import asdict
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio
from app.models import Universe, PhysicsParameters
from app.physics.engine import PhysicsEngine, Particle, Vector2D

# Global state
active_simulations: Dict[int, PhysicsEngine] = {}  # universe_id -> PhysicsEngine
simulation_clients: Dict[int, Set[str]] = {}  # universe_id -> set of client IDs
client_universes: Dict[str, int] = {}  # client_id -> universe_id

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    client_id = request.sid
    emit('connection_established', {'client_id': client_id})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    client_id = request.sid
    if client_id in client_universes:
        universe_id = client_universes[client_id]
        leave_simulation(universe_id)

@socketio.on('join_simulation')
def handle_join_simulation(data):
    """Handle client joining a simulation."""
    universe_id = data.get('universe_id')
    client_id = request.sid

    # Get universe and its physics parameters
    universe = Universe.query.get(universe_id)
    if not universe:
        emit('error', {'message': f'Universe {universe_id} not found'})
        return

    # Initialize simulation if not exists
    if universe_id not in active_simulations:
        active_simulations[universe_id] = PhysicsEngine(universe.physics_parameters)
        simulation_clients[universe_id] = set()

    # Add client to simulation room
    join_room(f'universe_{universe_id}')
    simulation_clients[universe_id].add(client_id)
    client_universes[client_id] = universe_id

    # Send initial state
    emit('simulation_state', {
        'particles': [
            {
                'id': p.id,
                'position': {'x': p.position.x, 'y': p.position.y},
                'velocity': {'x': p.velocity.x, 'y': p.velocity.y},
                'radius': p.radius,
                'mass': p.mass
            }
            for p in active_simulations[universe_id].particles
        ]
    })

@socketio.on('leave_simulation')
def handle_leave_simulation(data):
    """Handle client leaving a simulation."""
    universe_id = data.get('universe_id')
    leave_simulation(universe_id)

def leave_simulation(universe_id: int):
    """Remove client from simulation."""
    client_id = request.sid
    if universe_id in simulation_clients and client_id in simulation_clients[universe_id]:
        simulation_clients[universe_id].remove(client_id)
        leave_room(f'universe_{universe_id}')
        del client_universes[client_id]

        # Clean up simulation if no clients left
        if not simulation_clients[universe_id]:
            del simulation_clients[universe_id]
            del active_simulations[universe_id]

@socketio.on('add_particle')
def handle_add_particle(data):
    """Handle adding a particle to the simulation."""
    universe_id = data.get('universe_id')
    if universe_id not in active_simulations:
        emit('error', {'message': 'Not in a simulation'})
        return

    engine = active_simulations[universe_id]

    # Create new particle from data
    particle = Particle(
        position=Vector2D(data['position']['x'], data['position']['y']),
        velocity=Vector2D(data['velocity']['x'], data['velocity']['y']),
        acceleration=Vector2D(0, 0),
        mass=data.get('mass', 1.0),
        radius=data.get('radius', 1.0),
        elasticity=data.get('elasticity', 0.7),
        id=len(engine.particles)
    )

    # Add particle to simulation
    engine.add_particle(particle)

    # Broadcast new particle to all clients in the simulation
    emit('particle_added', {
        'particle': {
            'id': particle.id,
            'position': {'x': particle.position.x, 'y': particle.position.y},
            'velocity': {'x': particle.velocity.x, 'y': particle.velocity.y},
            'radius': particle.radius,
            'mass': particle.mass
        }
    }, room=f'universe_{universe_id}')

@socketio.on('clear_simulation')
def handle_clear_simulation(data):
    """Handle clearing all particles from the simulation."""
    universe_id = data.get('universe_id')
    if universe_id in active_simulations:
        active_simulations[universe_id].clear()
        emit('simulation_cleared', room=f'universe_{universe_id}')

async def broadcast_updates():
    """Broadcast simulation updates to connected clients."""
    while True:
        for universe_id, engine in active_simulations.items():
            if simulation_clients.get(universe_id):
                # Update physics
                engine.update(1/60)  # 60 FPS

                # Broadcast state
                emit('simulation_state', {
                    'particles': [
                        {
                            'id': p.id,
                            'position': {'x': p.position.x, 'y': p.position.y},
                            'velocity': {'x': p.velocity.x, 'y': p.velocity.y},
                            'radius': p.radius,
                            'mass': p.mass
                        }
                        for p in engine.particles
                    ]
                }, room=f'universe_{universe_id}')

        await asyncio.sleep(1/60)  # Wait for next frame

# Start the update loop when the application starts
@socketio.on('connect')
def start_update_loop():
    """Start the physics update loop when first client connects."""
    if not hasattr(start_update_loop, 'started'):
        socketio.start_background_task(broadcast_updates)
        start_update_loop.started = True
