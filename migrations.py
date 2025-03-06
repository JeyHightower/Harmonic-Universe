import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from flask import Flask
from flask_migrate import Migrate, MigrateCommand, init, migrate, upgrade
from models import db, User, Universe, Scene
from werkzeug.security import generate_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('migrations')

def run_migrations(app):
    """Run database migrations and create initial data if needed"""
    with app.app_context():
        try:
            # Check if migrations directory exists
            if not os.path.exists('migrations'):
                # Initialize migrations
                init()

            # Generate migration
            migrate(message='Initial migration')

            # Apply migration
            upgrade()

            # Check if we need to create initial data
            if User.query.count() == 0:
                app.logger.info("Creating initial data...")
                create_initial_data(app)

            app.logger.info("Database setup complete")
            return True

        except Exception as e:
            app.logger.error(f"Database migration error: {str(e)}")
            return False

def create_initial_data(app):
    """Create initial data for the application"""
    try:
        # Create demo user
        demo_password = "demopass123"
        hashed_password = generate_password_hash(demo_password)

        demo_user = User(
            username='demouser',
            email='demo@harmonic-universe.com',
            password_hash=hashed_password
        )

        db.session.add(demo_user)
        db.session.commit()

        # Create sample universes
        universe1 = Universe(
            name='Ethereal Realms',
            description='A universe where magic and technology coexist, with floating islands and ancient ruins.',
            rules='- Magic is commonplace\n- Technology is steam-powered\n- Gravity is variable\n- Multiple intelligent species exist',
            image_url='https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4',
            user_id=demo_user.id
        )

        universe2 = Universe(
            name='Cybernetic Frontier',
            description='A dystopian future where humans have merged with machines and corporations rule the world.',
            rules='- AI has consciousness\n- Human augmentation is normal\n- Digital worlds exist alongside physical ones\n- Space travel is common',
            image_url='https://images.unsplash.com/photo-1558346490-a72e53ae2d4f',
            user_id=demo_user.id
        )

        db.session.add_all([universe1, universe2])
        db.session.commit()

        # Create sample scenes
        scenes = [
            Scene(
                title='The Floating Market',
                description='A bustling market on a floating island where traders from all realms meet.',
                content='The air was thick with the scent of exotic spices and the hum of bargaining voices. Merchants from across the Ethereal Realms had gathered for the monthly Floating Market, their airships tethered to the ancient stone moorings that ringed the island. Gravity-defying walkways connected the various platforms, allowing visitors to browse everything from enchanted trinkets to rare technological artifacts.',
                image_url='https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9',
                universe_id=universe1.id,
                user_id=demo_user.id
            ),
            Scene(
                title='The Ancient Library',
                description='A hidden library containing forgotten knowledge from the dawn of the realms.',
                content='Dust motes danced in the shafts of colored light that streamed through the stained-glass ceiling. The Ancient Library was a maze of towering bookshelves, each filled with tomes whose spines whispered their contents to those who knew how to listen. Magic preserved the fragile pages that contained the history of the Ethereal Realms, from the Sundering to the Age of Reconciliation.',
                image_url='https://images.unsplash.com/photo-1507842217343-583bb7270b66',
                universe_id=universe1.id,
                user_id=demo_user.id
            ),
            Scene(
                title='Neon District',
                description='The heart of the mega-city where the distinction between human and machine blurs.',
                content='Rain streaked down through the forest of holographic advertisements, creating prismatic patterns on the crowded streets below. In the Neon District, augmented humans brushed shoulders with android workers, their internal lights visible beneath synthetic skin. Street vendors sold black-market neural upgrades alongside bowls of synthetic ramen, while corporate security drones hovered overhead, their cameras constantly scanning the crowd.',
                image_url='https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
                universe_id=universe2.id,
                user_id=demo_user.id
            ),
            Scene(
                title='The Digital Oasis',
                description='A sanctuary in the digital realm where the consciousness of humans and AI mingle freely.',
                content='Unlike the harsh geometry of most digital landscapes, the Oasis appeared as an endless shoreline where a crystalline sea met a beach of luminous code-sand. Here, digital avatars of humans relaxed alongside the autonomous personas of AIs, free from the restrictions of both physical and programmatic constraints. It was said that in the Oasis, the distinction between user and program had become meaningless — all were simply beings of thought and will.',
                image_url='https://images.unsplash.com/photo-1541701494587-cb58502866ab',
                universe_id=universe2.id,
                user_id=demo_user.id
            )
        ]

        db.session.add_all(scenes)
        db.session.commit()

        app.logger.info(f"Created demo user: {demo_user.username}")
        app.logger.info(f"Created {len([universe1, universe2])} sample universes")
        app.logger.info(f"Created {len(scenes)} sample scenes")

    except Exception as e:
        app.logger.error(f"Error creating initial data: {str(e)}")
        db.session.rollback()
        raise

if __name__ == "__main__":
    if run_migrations():
        sys.exit(0)
    else:
        sys.exit(1)
