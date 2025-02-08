from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Optional
import numpy as np
import soundfile as sf
import io
import asyncio
import aiohttp
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.services.audio_processing import process_audio_data
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()

class MusicGenerationParameters(BaseModel):
    style: str
    mood: str
    parameters: Dict[str, float]
    user_id: Optional[int] = None

class AudioGenerationResponse(BaseModel):
    status: str
    message: str
    task_id: Optional[str] = None

@router.post("/generate-music", response_model=AudioGenerationResponse)
async def generate_music(
    params: MusicGenerationParameters,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Validate parameters
        if not params.style or not params.mood:
            raise HTTPException(
                status_code=400,
                detail="Style and mood are required parameters"
            )

        # Initialize audio generation task
        task_id = f"music_gen_{current_user.id}_{int(asyncio.get_event_loop().time())}"

        # Start background task for music generation
        background_tasks.add_task(
            generate_music_task,
            task_id,
            params,
            current_user.id,
            db
        )

        return AudioGenerationResponse(
            status="processing",
            message="Music generation started",
            task_id=task_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error starting music generation: {str(e)}"
        )

@router.get("/music-status/{task_id}")
async def get_music_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        # Check task status in cache/database
        status = await check_task_status(task_id)
        return {"status": status}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking music generation status: {str(e)}"
        )

@router.get("/download-music/{task_id}")
async def download_music(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        # Get generated audio data
        audio_data = await get_generated_audio(task_id)
        if not audio_data:
            raise HTTPException(
                status_code=404,
                detail="Generated audio not found"
            )

        # Create in-memory file-like object
        audio_io = io.BytesIO()
        sf.write(audio_io, audio_data, settings.AUDIO_SAMPLE_RATE, format='wav')
        audio_io.seek(0)

        return StreamingResponse(
            audio_io,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=generated_music_{task_id}.wav"
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading generated music: {str(e)}"
        )

async def generate_music_task(
    task_id: str,
    params: MusicGenerationParameters,
    user_id: int,
    db: Session
):
    try:
        # Call AI music generation service
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.AI_MUSIC_SERVICE_URL,
                json={
                    "style": params.style,
                    "mood": params.mood,
                    "parameters": params.parameters
                },
                headers={
                    "Authorization": f"Bearer {settings.AI_SERVICE_API_KEY}"
                }
            ) as response:
                if response.status != 200:
                    raise Exception(f"AI service returned status {response.status}")

                audio_data = await response.read()

        # Process the generated audio
        processed_audio = await process_audio_data(
            audio_data,
            params.parameters.get("tempo", 120),
            params.parameters.get("complexity", 0.5)
        )

        # Store the processed audio
        await store_generated_audio(task_id, processed_audio, user_id, db)

        # Update task status
        await update_task_status(task_id, "completed")

    except Exception as e:
        await update_task_status(task_id, "failed", str(e))
        raise

async def check_task_status(task_id: str) -> str:
    # Implementation depends on your task management system
    # This could use Redis, database, or other storage
    pass

async def get_generated_audio(task_id: str) -> np.ndarray:
    # Implementation depends on your storage system
    # This could retrieve from file system, S3, or other storage
    pass

async def store_generated_audio(
    task_id: str,
    audio_data: np.ndarray,
    user_id: int,
    db: Session
):
    # Implementation depends on your storage system
    # This could store to file system, S3, or other storage
    pass

async def update_task_status(
    task_id: str,
    status: str,
    error_message: Optional[str] = None
):
    # Implementation depends on your task management system
    # This could use Redis, database, or other storage
    pass
