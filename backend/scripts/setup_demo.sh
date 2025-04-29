#!/bin/bash

# Function to set up demo data in Docker environment
setup_in_docker() {
    echo "Setting up demo data in Docker environment..."

    # Get the container ID of the running backend container
    CONTAINER_ID=$(docker ps -qf "name=harmonic-universe-backend-1")

    if [ -z "$CONTAINER_ID" ]; then
        echo "Error: Backend container not found. Make sure the containers are running."
        exit 1
    fi

    # Execute the setup commands in the container
    docker exec --tty=false "$CONTAINER_ID" python3 -c "
import sys
sys.path.append('/app')
from app.api.models.user import User
from app.api.models.universe import Universe
from app.extensions import db
from app import create_app

app = create_app()
with app.app_context():
    # Check if demo user exists
    demo_user = User.query.filter_by(email='demo@example.com').first()
    if not demo_user:
        demo_user = User(
            username='demo',
            email='demo@example.com',
            password='password123'
        )
        db.session.add(demo_user)
        db.session.commit()
        print('Demo user created successfully')
    else:
        print('Demo user already exists')

    # Check if test universe exists
    test_universe = Universe.query.filter_by(name='Test Universe').first()
    if not test_universe:
        test_universe = Universe(
            name='Test Universe',
            description='A test universe for demonstration purposes',
            user_id=demo_user.id
        )
        db.session.add(test_universe)
        db.session.commit()
        print('Test universe created successfully')
    else:
        print('Test universe already exists')
"
}

# Execute the setup
setup_in_docker
