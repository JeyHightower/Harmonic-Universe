def test_parameter_interaction(client, auth_headers, session):
    """Test interaction between physics and music parameters."""
    # Create universe with initial parameters
    universe = Universe(
        name='Parameter Interaction Test',
        description='Testing parameter interactions',
        user_id=1,
        is_public=True,
        physics_parameters=PhysicsParameters(),
        music_parameters=MusicParameters(),
        visualization_parameters=VisualizationParameters()
    )
    session.add(universe)
    session.commit()

def test_parameter_persistence_across_updates(client, auth_headers, session):
    """Test parameter persistence across multiple updates."""
    # Create universe with initial parameters
    universe = Universe(
        name='Persistence Test',
        description='Testing parameter persistence',
        user_id=1,
        is_public=True,
        physics_parameters=PhysicsParameters(),
        music_parameters=MusicParameters(),
        visualization_parameters=VisualizationParameters()
    )
    session.add(universe)
    session.commit()

def test_error_propagation(client, auth_headers, session):
    """Test error handling and propagation across components."""
    # Create universe
    universe = Universe(
        name='Error Test',
        description='Testing error handling',
        user_id=1,
        is_public=True,
        physics_parameters=PhysicsParameters(),
        music_parameters=MusicParameters(),
        visualization_parameters=VisualizationParameters()
    )
    session.add(universe)
    session.commit()
