@socketio.on("join_simulation", namespace="/physics")
def handle_join_simulation(data):
    """Handle client joining a simulation."""
    universe_id = data.get("universe_id")
    if not universe_id:
        emit("error", {"message": "Universe ID is required"})
        return

    universe = Universe.query.get(universe_id)
    if not universe:
        emit("error", {"message": f"Universe {universe_id} not found"})
        return

    # Join the room for this universe's simulation
    join_room(f"universe_{universe_id}")
    emit("joined_simulation", {"universe_id": universe_id})
