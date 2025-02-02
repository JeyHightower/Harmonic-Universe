"""
Database package.
"""

from app.extensions import db

__all__ = ['db']

def init_db(app):
    """Initialize database."""
    db.init_app(app)

    with app.app_context():
        db.create_all()
