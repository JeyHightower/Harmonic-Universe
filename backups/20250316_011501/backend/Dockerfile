# Unified Dockerfile for development and production

# Build stage
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt requirements-test.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM builder as development

# Copy development requirements and install
COPY requirements-test.txt .
RUN pip install --no-cache-dir -r requirements-test.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_ENV=development
ENV FLASK_DEBUG=1

# Expose port
EXPOSE 5000

# Start development server
CMD ["python", "run.py"]

# Production stage
FROM builder as production

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0

# Create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Start production server with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "app.main:app"]
