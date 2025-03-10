from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from routers import auth, users, universes, scenes
from routers import physics_parameters, audio_files, midi_sequences
from routers import audio_tracks, visualizations, ai_models

app = FastAPI(title="Harmonic Universe API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React/Next.js development server
        "https://your-production-frontend-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(universes.router)
app.include_router(scenes.router)
app.include_router(physics_parameters.router)
app.include_router(audio_files.router)
app.include_router(midi_sequences.router)
app.include_router(audio_tracks.router)
app.include_router(visualizations.router)
app.include_router(ai_models.router)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Harmonic Universe API"}

import uvicorn
from port import get_port

if __name__ == "__main__":
    port = get_port()
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
