# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
ENV FLASK_DEBUG=1
ENV PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

# Create necessary directories
RUN mkdir -p /app/static

# Make scripts executable and set proper permissions
RUN chmod +x scripts/*.sh && \
    chmod +x docker-entrypoint.sh && \
    chown -R root:root /app && \
    chmod -R 755 /app

# Expose the port the app runs on
EXPOSE 5001

# Set the entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]
