from typing import Dict, Any
import openai
from app.models.ai_model import AIModel

async def generate_music(input_data: Dict[str, Any], ai_model: AIModel) -> Dict[str, Any]:
    """
    Generate music using AI.
    """
    if ai_model.provider == "openai":
        return await _generate_music_openai(input_data, ai_model)
    elif ai_model.provider == "musicgen":
        return await _generate_music_musicgen(input_data, ai_model)
    else:
        raise ValueError(f"Unsupported AI provider: {ai_model.provider}")

async def _generate_music_openai(input_data: Dict[str, Any], ai_model: AIModel) -> Dict[str, Any]:
    """
    Generate music using OpenAI's API.
    """
    # Configure OpenAI
    openai.api_key = ai_model.api_key

    # Prepare the prompt
    description = input_data.get("description", "")
    style = input_data.get("style", "")
    parameters = input_data.get("parameters", {})
    duration = input_data.get("duration", 30)  # Duration in seconds

    prompt = f"""
    Generate music with the following characteristics:
    Description: {description}
    Style: {style}
    Parameters: {parameters}
    Duration: {duration} seconds

    Generate music in MIDI format with appropriate musical elements and structure.
    """

    # Call OpenAI API for music generation
    # Note: This is a placeholder as OpenAI doesn't currently have a direct music generation API
    # In practice, you might want to use a specialized music generation service
    response = await openai.ChatCompletion.acreate(
        model=ai_model.configuration.get("model_name", "gpt-4"),
        messages=[
            {"role": "system", "content": "You are a music generation assistant for the Harmonic Universe application."},
            {"role": "user", "content": prompt}
        ],
        temperature=ai_model.parameters.get("temperature", 0.7),
        max_tokens=ai_model.parameters.get("max_tokens", 1000)
    )

    # Process and validate the response
    try:
        music_data = response.choices[0].message.content
        return {
            "music_data": music_data,
            "format": "midi",
            "duration": duration,
            "model_info": {
                "model": ai_model.configuration.get("model_name"),
                "provider": "openai"
            }
        }
    except Exception as e:
        raise ValueError(f"Failed to process OpenAI response: {str(e)}")

async def _generate_music_musicgen(input_data: Dict[str, Any], ai_model: AIModel) -> Dict[str, Any]:
    """
    Generate music using Meta's MusicGen model.
    """
    try:
        # Import MusicGen
        from audiocraft.models import MusicGen
        import torch
        import torchaudio
        import io
        import base64

        # Load model
        model = MusicGen.get_pretrained(ai_model.configuration.get("model_name", "melody"))

        # Set parameters
        model.set_generation_params(
            duration=input_data.get("duration", 8),
            temperature=ai_model.parameters.get("temperature", 0.7),
            top_k=ai_model.parameters.get("top_k", 250),
            top_p=ai_model.parameters.get("top_p", 0.0)
        )

        # Generate music
        description = input_data.get("description", "")
        wav = model.generate([description])  # Shape: [1, channels, samples]

        # Convert to audio file
        buffer = io.BytesIO()
        torchaudio.save(buffer, wav.cpu(), sample_rate=32000, format="wav")
        audio_base64 = base64.b64encode(buffer.getvalue()).decode()

        return {
            "audio_data": audio_base64,
            "format": "wav",
            "sample_rate": 32000,
            "duration": input_data.get("duration", 8),
            "model_info": {
                "model": ai_model.configuration.get("model_name"),
                "provider": "musicgen"
            }
        }

    except Exception as e:
        raise ValueError(f"Failed to generate music with MusicGen: {str(e)}")
