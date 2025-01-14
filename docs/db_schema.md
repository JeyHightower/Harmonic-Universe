# Database Schema for Harmonic Universe

## Tables Overview

### 1. Users Table

Tracks user accounts and their associated universes.

```python
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    universes = db.relationship('Universe', back_populates='user', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint('username', name='uq_users_username'),
        db.UniqueConstraint('email', name='uq_users_email'),
    )
```

### 2. Universes Table

Tracks User Universes.

```python
class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    gravity_constant = db.Column(db.Float)
    environment_harmony = db.Column(db.Float)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    user = db.relationship('User', back_populates='universes')
    music_parameters = db.relationship('MusicParameter', back_populates='universe', cascade='all, delete')
    physics_parameters = db.relationship('PhysicsParameter', back_populates='universe', cascade='all, delete')
    storyboards = db.relationship('Storyboard', back_populates='universe', cascade='all, delete')
```

### 3. Physics Parameters Table

Tracks physics parameters for each universe.

```python
class PhysicsParameter(db.Model):
    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    parameter_name = db.Column(db.String(100), nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)

    # Relationships
    universe = db.relationship('Universe', back_populates='physics_parameters')
```

### 4. Music Parameters Table

Tracks music parameters for each universe.

```python
class MusicParameter(db.Model):
    __tablename__ = 'music_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    parameter_name = db.Column(db.String(100), nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    instrument = db.Column(db.String(50), nullable=True, index=True)

    # Relationships
    universe = db.relationship('Universe', back_populates='music_parameters')
```

### 5. Storyboards Table

Tracks plot points and narrative elements for each universe.

```python
class Storyboard(db.Model):
    __tablename__ = 'storyboards'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    plot_point = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    harmony_tie = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    universe = db.relationship('Universe', back_populates='storyboards')
```
