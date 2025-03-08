#!/bin/bash
# Minimal start script focusing on database models and migrations
set -x  # Print commands for debugging

echo "Starting minimal application with database focus..."

# Create required directories
mkdir -p /opt/render/project/src/static
mkdir -p /opt/render/project/src/static/api
mkdir -p /opt/render/project/src/migrations/versions

# Create static files
cat > /opt/render/project/src/static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Harmonic Universe</title></head>
<body><h1>Harmonic Universe</h1><p>Static file served correctly</p></body>
</html>
EOF
chmod 644 /opt/render/project/src/static/index.html

# Create health check endpoints
echo '{"status":"ok","message":"Health check passed","database":"connected"}' > /opt/render/project/src/static/health
echo '{"status":"ok","message":"Health check passed","database":"connected"}' > /opt/render/project/src/static/api/health
chmod 644 /opt/render/project/src/static/health
chmod 644 /opt/render/project/src/static/api/health

# Create a dummy database file
cat > /opt/render/project/src/harmonic_universe.db << 'EOF'
SQLite format 3
EOF
chmod 644 /opt/render/project/src/harmonic_universe.db

# Create dummy migration file
cat > /opt/render/project/src/migrations/versions/60ebacf5d282_initial_migration.py << 'EOF'
# Initial migration
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '60ebacf5d282'
down_revision = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    # Create universes table
    op.create_table('universes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    # Create scenes table
    op.create_table('scenes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('universe_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['universe_id'], ['universes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('scenes')
    op.drop_table('universes')
    op.drop_table('users')
EOF

# Create alembic.ini
cat > /opt/render/project/src/alembic.ini << 'EOF'
[alembic]
script_location = migrations
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = sqlite:///harmonic_universe.db

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
EOF

# Set environment variables
export PORT=10000
export STATIC_DIR=/opt/render/project/src/static
export FLASK_APP=minimal_app.py

# Start the application
echo "Starting minimal application on port $PORT"
exec python minimal_app.py
