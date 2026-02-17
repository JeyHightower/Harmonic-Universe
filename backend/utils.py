from flask import session, request, abort
from sqlalchemy import select
from models import db, User, Character, Universe


def get_current_user():
    """Retrieves the current user."""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)

def get_owned_universe_ids(user):
    """Returns set of universe IDs owned by the user."""
    if not user or not hasattr(user, 'owned_universes'):
        return set ()
    return set (u.universe_id for u in user.owned_universes)

def get_request_universe_ids():
    """Returns list of universe IDs in the request"""
    data = request.json
    if not data:
        return []
    return data.get('universe_ids', [])
    
def character_autherization(character_id):
    user = get_current_user()
    if not user:
        return None
    query = select(Character).where(
        Character.user_id == user.user_id,
        Character.character_id == character_id)
    character =db.session.execute(query).scalars().first()
    if not character:
        return None
    return character


def universe_authorization(universe_id):
    user = get_current_user()
    owner_id = user.user_id
    if not user:
        abort(401)
    query = select(Universe).where(
        Universe.owner_id == owner_id,
        Universe.universe_id == universe_id
        )
    universe = db.session.execute(query).scalars().first()
    if not universe:
        abort(403)
    return universe