#!/bin/bash

# Create necessary directories
mkdir -p logs
mkdir -p instance
mkdir -p migrations/versions
mkdir -p static
mkdir -p uploads
mkdir -p flask_session

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python reset_db.py

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
FLASK_APP=run.py
FLASK_ENV=development
DATABASE_URL=sqlite:///instance/app.db
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')
JWT_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')
EOL
fi

echo "Setup complete! Run 'flask run' to start the server."
