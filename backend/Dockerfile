# Use Python 3.9 slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    netcat-openbsd \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload and logs directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app
ENV FLASK_ENV=development
ENV PYTHONPATH=/app/backend

# Run the application
CMD ["sh", "-c", "while ! nc -z db 5432; do sleep 1; done && flask db upgrade && flask run --host=0.0.0.0"]
