#!/usr/bin/env python3
"""
Script to check demo user universes and create one if needed
"""

from app import create_app
from app.extensions import db
from app.api.models.user import User
from app.api.models.universe import Universe

def check_and_create_demo_universes():
    app = create_app()
    with app.app_context():
        # Find the demo user
        demo_user = User.query.filter_by(email='demo@example.com').first()
        if not demo_user:
            print('No demo user found. Please run demo login first.')
            return

        print(f'Demo user found: ID={demo_user.id}, Email={demo_user.email}')

        # Check what universes the demo user owns
        demo_universes = Universe.query.filter_by(user_id=demo_user.id, is_deleted=False).all()
        print(f'Demo user owns {len(demo_universes)} universes:')

        for universe in demo_universes:
            print(f'  - Universe {universe.id}: "{universe.name}" (created: {universe.created_at})')

        # Check all universes in the database
        all_universes = Universe.query.filter_by(is_deleted=False).all()
        print(f'\nTotal universes in database: {len(all_universes)}')

        for universe in all_universes:
            owner = User.query.get(universe.user_id)
            owner_email = owner.email if owner else 'Unknown'
            print(f'  - Universe {universe.id}: "{universe.name}" (owner: {owner_email}, user_id: {universe.user_id})')

        # Create a demo universe if the demo user doesn't have any
        if not demo_universes:
            print('\nCreating a demo universe for the demo user...')
            demo_universe = Universe(
                name='Demo Universe',
                description='A sample universe created for the demo user',
                user_id=demo_user.id,
                is_public=False
            )

            db.session.add(demo_universe)
            db.session.commit()

            print(f'Created demo universe: ID={demo_universe.id}, Name="{demo_universe.name}"')
        else:
            print('\nDemo user already has universes. No new universe created.')

if __name__ == '__main__':
    check_and_create_demo_universes()
