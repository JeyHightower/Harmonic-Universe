from typing import Dict, Any
import openai
from app.models.ai_model import AIModel

async def generate_visualization(input_data: Dict[str, Any], ai_model: AIModel) -> Dict[str, Any]:
    """
    Generate visualization using AI.
    """
    if ai_model.provider == "openai":
        return await _generate_visualization_openai(input_data, ai_model)
    elif ai_model.provider == "stable-diffusion":
        return await _generate_visualization_stable_diffusion(input_data, ai_model)
    else:
        raise ValueError(f"Unsupported AI provider: {ai_model.provider}")

async def _generate_visualization_openai(input_data: Dict[str, Any], ai_model: AIModel) -> Dict[str, Any]:
    """
    Generate visualization using OpenAI's DALL-E API.
    """
    # Configure OpenAI
    openai.api_key = ai_model.api_key

    # Prepare the prompt
    description = input_data.get("description", "")
    style = input_data.get("style", "")
    parameters = input_data.get("parameters", {})

    prompt = f"""
    Create a visualization with the following characteristics:
    Description: {description}
    Style: {style}
    Parameters: {parameters}
    """

    try:
        # Call DALL-E API
        response = await openai.Image.acreate(
            prompt=prompt,
            n=1,
            size=ai_model.configuration.get("size", "1024x1024"),
            response_format="b64_json"
        )

        return {
            "image_data": response.data[0].b64_json,
            "format": "png",
            "size": ai_model.configuration.get("size", "1024x1024"),
            "model_info": {
                "model": "dall-e",
                "provider": "openai"
            }
        }
    except Exception as e:
        raise ValueError(f"Failed to generate image with DALL-E: {str(e)}")

async def _generate_visualization_stable_diffusion(input_data: Dict[str, Any], ai_model: AIModel) -> Dict[str, Any]:
    """
    Generate visualization using Stable Diffusion.
    """
    try:
        from diffusers import StableDiffusionPipeline
        import torch
        import base64
        from io import BytesIO
        from PIL import Image

        # Load model
        model_id = ai_model.configuration.get("model_id", "runwayml/stable-diffusion-v1-5")
        pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
        pipe = pipe.to("cuda")

        # Prepare prompt
        description = input_data.get("description", "")
        style = input_data.get("style", "")
        prompt = f"{description} {style}"

        # Generate image
        image = pipe(
            prompt,
            num_inference_steps=ai_model.parameters.get("num_inference_steps", 50),
            guidance_scale=ai_model.parameters.get("guidance_scale", 7.5)
        ).images[0]

        # Convert to base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        image_base64 = base64.b64encode(buffered.getvalue()).decode()

        return {
            "image_data": image_base64,
            "format": "png",
            "size": f"{image.size[0]}x{image.size[1]}",
            "model_info": {
                "model": model_id,
                "provider": "stable-diffusion"
            }
        }

    except Exception as e:
        raise ValueError(f"Failed to generate image with Stable Diffusion: {str(e)}")
