"""Audio endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints.audio.audio_files import router as audio_files_router
from app.api.v1.endpoints.audio.midi_events import router as midi_events_router
from app.api.v1.endpoints.audio.music_parameters import router as music_parameters_router

router = APIRouter()
router.include_router(audio_files_router, prefix="/audio-files", tags=["audio"])
router.include_router(midi_events_router, prefix="/midi-events", tags=["audio"])
router.include_router(music_parameters_router, prefix="/music-parameters", tags=["audio"])
