FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY requirements-test.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt -r requirements-test.txt

# Create necessary directories
RUN mkdir -p logs uploads data

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHON_ENV=development

# Expose port
EXPOSE 3001

# Start application with uvicorn in development mode
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001", "--reload"]
