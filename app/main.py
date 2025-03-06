from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import universe

# Create FastAPI app
app = FastAPI(title="Harmonic Universe API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Harmonic Universe API"}

# Register routers
app.include_router(universe.router, prefix="/api/universes", tags=["universes"])

# Add more routers as needed for other resources
