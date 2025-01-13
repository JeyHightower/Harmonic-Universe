from app.models import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True, index=True)  # Index added
    email = db.Column(db.String(120), nullable=False, unique=True, index=True)  # Index added
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    universes = db.relationship('Universe', back_populates='user', cascade='all, delete')

    def __repr__(self):
        return f"<User {self.username}>"
