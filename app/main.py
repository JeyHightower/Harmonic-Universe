from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create FastAPI app
app = FastAPI(title="Harmonic Universe API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define routes
@app.get("/")
def root():
    return {"message": "Harmonic Universe API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
