# Database Schema Documentation

## Overview

This document describes the database schema for the Harmonic Universe application. The schema is implemented using SQLAlchemy with PostgreSQL as the database engine.

## Core Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### profiles

Stores user profile information.

```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

### universes

Stores universe information.

```sql
CREATE TABLE universes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaborators_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_universes_user_id ON universes(user_id);
CREATE INDEX idx_universes_is_public ON universes(is_public);
```

### physics_parameters

Stores physics parameters for universes.

```sql
CREATE TABLE physics_parameters (
    id SERIAL PRIMARY KEY,
    universe_id INTEGER NOT NULL UNIQUE REFERENCES universes(id) ON DELETE CASCADE,
    gravity FLOAT DEFAULT 9.81,
    time_dilation FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_physics_parameters_universe_id ON physics_parameters(universe_id);
```

### collaborators

Stores universe collaboration information.

```sql
CREATE TABLE collaborators (
    id SERIAL PRIMARY KEY,
    universe_id INTEGER NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(universe_id, user_id)
);

CREATE INDEX idx_collaborators_universe_id ON collaborators(universe_id);
CREATE INDEX idx_collaborators_user_id ON collaborators(user_id);
```

## Relationships

### One-to-One Relationships
- `users` ↔ `profiles`: Each user has exactly one profile
- `universes` ↔ `physics_parameters`: Each universe has exactly one set of physics parameters

### One-to-Many Relationships
- `users` → `universes`: One user can own many universes
- `universes` → `collaborators`: One universe can have many collaborators

## Data Types

### Common Data Types
- `id`: SERIAL (auto-incrementing integer)
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE
- `name`, `email`, `username`: VARCHAR(255)
- `description`, `bio`: TEXT
- `is_public`: BOOLEAN
- `preferences`: JSONB

### Numeric Parameters
- `gravity`: FLOAT
- `time_dilation`: FLOAT
- `collaborators_count`: INTEGER

## Constraints

### Primary Keys
All tables have an `id` SERIAL PRIMARY KEY

### Foreign Keys
- `profiles.user_id` → `users.id`
- `universes.user_id` → `users.id`
- `physics_parameters.universe_id` → `universes.id`
- `collaborators.universe_id` → `universes.id`
- `collaborators.user_id` → `users.id`

### Unique Constraints
- `users.email`
- `users.username`
- `profiles.user_id`
- `physics_parameters.universe_id`
- `collaborators(universe_id, user_id)`

### Cascade Deletes
- When a user is deleted, their profile and universes are deleted
- When a universe is deleted, its physics parameters and collaborator records are deleted

## Indexes

### Performance Indexes
- `idx_users_email`
- `idx_users_username`
- `idx_profiles_user_id`
- `idx_universes_user_id`
- `idx_universes_is_public`
- `idx_physics_parameters_universe_id`
- `idx_collaborators_universe_id`
- `idx_collaborators_user_id`

## Migrations

Migrations are managed using Alembic. The current schema version can be found in the alembic_version table.

## Best Practices

1. Always use migrations for schema changes
2. Include appropriate indexes for frequent queries
3. Use cascade deletes to maintain referential integrity
4. Keep JSONB fields for flexible data (like preferences)
5. Use timestamp with timezone for all datetime fields

Last updated: Thu Jan 30 18:37:47 CST 2025
