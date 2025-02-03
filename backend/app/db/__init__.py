"""
Database package.
"""

from app.db.base_model import Base

__all__ = ['Base']

def init_db(app):
    """Initialize database."""
    db.init_app(app)

    with app.app_context():
        db.create_all()
