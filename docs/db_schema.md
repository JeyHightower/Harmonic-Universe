# Database Schema for Harmonic Universe

## Tables Overview

### 1. Users Table

Tracks user accounts and their associated universes.
db
:models/user.py
class User(db.Model):
**tablename** = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    # Relationships
    universes = db.relationship('Universe', back_populates='user', cascade='all, delete')

#### 2. Universes Table

Tracks User Universes.

:models/universe.py
class Universe(db.Model):
    **tablename** = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    gravity_constant = db.Column(db.Float default=0.0)
    friction = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    # Relationships
    user = db.relationship('User', back_populates='universes')


