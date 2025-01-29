"""Universe service module."""
from app.models import (
    Universe,
    MusicParameters,
    VisualizationParameters,
)
from app.extensions import db


class UniverseService:
    """Service class for handling universe operations."""

    @staticmethod
    def create_universe(data, user_id):
        """Create a new universe with associated parameters."""
        universe = Universe(
            name=data["name"],
            description=data.get("description", ""),
            creator_id=user_id,
            is_public=data.get("is_public", True),
        )

        music_params = MusicParameters(
            universe=universe,
            tempo=data.get("music", {}).get("tempo", 120),
            key=data.get("music", {}).get("key", "C"),
            scale=data.get("music", {}).get("scale", "major"),
        )

        viz_params = VisualizationParameters(
            universe=universe,
            color_scheme=data.get("visualization", {}).get("color_scheme", "default"),
            particle_size=data.get("visualization", {}).get("particle_size", 1.0),
        )

        db.session.add(universe)
        db.session.add(music_params)
        db.session.add(viz_params)
        db.session.commit()

        return universe

    @staticmethod
    def get_universe(universe_id):
        """Get a universe by ID."""
        return Universe.query.get(universe_id)

    @staticmethod
    def update_universe(universe_id, data):
        """Update a universe and its parameters."""
        universe = Universe.query.get(universe_id)
        if not universe:
            return None

        universe.name = data.get("name", universe.name)
        universe.description = data.get("description", universe.description)
        universe.is_public = data.get("is_public", universe.is_public)

        if "music" in data:
            music = universe.music_parameters
            music.tempo = data["music"].get("tempo", music.tempo)
            music.key = data["music"].get("key", music.key)
            music.scale = data["music"].get("scale", music.scale)

        if "visualization" in data:
            viz = universe.visualization_parameters
            viz.color_scheme = data["visualization"].get(
                "color_scheme", viz.color_scheme
            )
            viz.particle_size = data["visualization"].get(
                "particle_size", viz.particle_size
            )

        db.session.commit()
        return universe

    @staticmethod
    def delete_universe(universe_id):
        """Delete a universe."""
        universe = Universe.query.get(universe_id)
        if universe:
            db.session.delete(universe)
            db.session.commit()
            return True
        return False

    @staticmethod
    def list_universes(user_id=None, public_only=False):
        """List universes with optional filtering."""
        query = Universe.query
        if user_id:
            query = query.filter_by(creator_id=user_id)
        if public_only:
            query = query.filter_by(is_public=True)
        return query.all()
