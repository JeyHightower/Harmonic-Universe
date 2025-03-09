from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create FastAPI app
app = FastAPI(title="Harmonic Universe API")

# Get allowed origins from environment variables or use defaults
allowed_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8000"
).split(",")

# Configure CORS with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Specific allowed origins instead of wildcard
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Define routes
@app.get("/")
def root():
    return {"message": "Harmonic Universe API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
