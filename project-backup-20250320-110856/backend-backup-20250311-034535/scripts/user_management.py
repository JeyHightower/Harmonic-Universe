"""User management script."""
import click
from backend.app import create_app
from backend.app.seeds.demo_user import (
    create_demo_user,
    verify_demo_user,
    get_demo_user,
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@click.group()
def cli():
    """User management CLI."""
    pass


@cli.command()
def create():
    """Create demo user."""
    app = create_app()
    with app.app_context():
        try:
            user = create_demo_user()
            if user:
                logger.info(
                    f"Demo user created/verified: {user.username} ({user.email})"
                )
            return True
        except Exception as e:
            logger.error(f"Error creating demo user: {str(e)}")
            return False


@cli.command()
def verify():
    """Verify demo user exists."""
    app = create_app()
    with app.app_context():
        try:
            if verify_demo_user():
                demo_data = get_demo_user()
                if demo_data:
                    user = demo_data["user"]
                    universe = demo_data["universe"]
                    scene = demo_data["scene"]
                    logger.info(f"Found demo user:")
                    logger.info(f"  Username: {user.username}")
                    logger.info(f"  Email: {user.email}")
                    logger.info(f"  Active: {user.is_active}")
                    logger.info(f"  Created at: {user.created_at}")
                    if universe:
                        logger.info(f"  Universe: {universe.name}")
                    if scene:
                        logger.info(f"  Scene: {scene.name}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error verifying demo user: {str(e)}")
            return False


if __name__ == "__main__":
    cli()
