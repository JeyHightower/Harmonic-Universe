#!/usr/bin/env python3

from app import create_app
from app.extensions import db
from app.api.models.user import User
from app.api.models.universe import Universe

app = create_app()
app.app_context().push()

# Check demo user
demo_user = User.query.filter_by(email='demo@example.com').first()
print(f'Demo user ID: {demo_user.id if demo_user else None}')

if demo_user:
    # Check demo user universes
    universes = Universe.query.filter_by(user_id=demo_user.id, is_deleted=False).all()
    print(f'Demo user universes: {[u.id for u in universes]}')

    # Check universe 3 specifically
    universe_3 = Universe.query.filter_by(id=3, is_deleted=False).first()
    if universe_3:
        print(f'Universe 3 exists, user_id: {universe_3.user_id}, is_public: {universe_3.is_public}')
    else:
        print('Universe 3 does not exist or is deleted')
else:
    print('Demo user not found')
