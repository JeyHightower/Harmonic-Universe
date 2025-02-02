"""Script to generate .env.example file."""

import os
from pathlib import Path

def generate_env_example():
    env_content = """# Application
PROJECT_NAME=Harmonic Universe
VERSION=0.1.0
SECRET_KEY=your-secret-key-here

# Environment
DEBUG=True
TESTING=False

# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=harmonic_universe

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=11520
JWT_ALGORITHM=HS256

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# WebSocket
WS_MESSAGE_QUEUE=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Email
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAILS_FROM_EMAIL=your-email@gmail.com
EMAILS_FROM_NAME=Harmonic Universe

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# File Upload
MAX_UPLOAD_SIZE=10485760
ALLOWED_UPLOAD_EXTENSIONS=.jpg,.jpeg,.png,.gif
"""

    backend_dir = Path(__file__).resolve().parent.parent.parent
    env_example_path = backend_dir / ".env.example"

    with open(env_example_path, "w") as f:
        f.write(env_content)

if __name__ == "__main__":
    generate_env_example()
