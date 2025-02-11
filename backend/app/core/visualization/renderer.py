from typing import Dict, Any, Optional, List
import numpy as np
from pathlib import Path
import json
import asyncio
from fastapi import WebSocket
from app.models.visualization import RenderingMode, SceneObjectType

class Renderer:
    def __init__(self, scene_data: Dict[str, Any]):
        self.scene_data = scene_data
        self.mode = RenderingMode(scene_data["rendering_mode"])
        self.frame_count = 0
        self.is_running = False
        self.clients: List[WebSocket] = []
        self.frame_buffer = []
        self.last_frame_time = 0

    async def start(self):
        """Start the rendering loop."""
        self.is_running = True
        while self.is_running:
            frame_data = await self.render_frame()
            await self.broadcast_frame(frame_data)
            self.frame_count += 1
            await asyncio.sleep(1 / self.scene_data.get("fps", 60))

    async def stop(self):
        """Stop the rendering loop."""
        self.is_running = False

    async def render_frame(self) -> Dict[str, Any]:
        """Render a single frame."""
        frame_data = {
            "frame_number": self.frame_count,
            "timestamp": self.last_frame_time,
            "objects": [],
            "camera": self.scene_data["camera_settings"],
            "lights": self.scene_data["lighting_settings"]
        }

        # Process each object in the scene
        for obj in self.scene_data["objects"]:
            obj_data = self._process_object(obj)
            if obj_data:
                frame_data["objects"].append(obj_data)

        # Apply post-processing effects
        if self.scene_data.get("post_processing"):
            frame_data = self._apply_post_processing(frame_data)

        return frame_data

    def _process_object(self, obj: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process a scene object for rendering."""
        if not obj.get("visible", True):
            return None

        obj_type = SceneObjectType(obj["type"])
        processed_data = {
            "id": obj["id"],
            "type": obj_type.value,
            "transform": {
                "position": obj.get("position", {"x": 0, "y": 0, "z": 0}),
                "rotation": obj.get("rotation", {"x": 0, "y": 0, "z": 0}),
                "scale": obj.get("scale", {"x": 1, "y": 1, "z": 1})
            }
        }

        if obj_type == SceneObjectType.MESH:
            processed_data.update({
                "geometry": obj["geometry"],
                "material": obj["material"]
            })
        elif obj_type == SceneObjectType.LIGHT:
            processed_data.update({
                "color": obj.get("parameters", {}).get("color"),
                "intensity": obj.get("parameters", {}).get("intensity", 1.0),
                "shadow": obj.get("parameters", {}).get("shadow", False)
            })
        elif obj_type == SceneObjectType.PARAMETER_VISUAL:
            processed_data.update(self._process_parameter_visual(obj))

        return processed_data

    def _process_parameter_visual(self, obj: Dict[str, Any]) -> Dict[str, Any]:
        """Process parameter visualization object."""
        params = obj.get("parameters", {})
        visual_type = params.get("visual_type")

        if visual_type == "waveform":
            return {
                "visual_type": "waveform",
                "data": self._generate_waveform_data(params),
                "style": params.get("style", {})
            }
        elif visual_type == "spectrum":
            return {
                "visual_type": "spectrum",
                "data": self._generate_spectrum_data(params),
                "style": params.get("style", {})
            }
        elif visual_type == "parameter_graph":
            return {
                "visual_type": "parameter_graph",
                "data": self._generate_parameter_graph(params),
                "style": params.get("style", {})
            }

        return {"visual_type": "unknown"}

    def _generate_waveform_data(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate waveform visualization data."""
        audio_data = params.get("audio_data", [])
        return {
            "points": audio_data,
            "range": params.get("range", {"min": -1, "max": 1}),
            "resolution": params.get("resolution", 1000)
        }

    def _generate_spectrum_data(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate frequency spectrum visualization data."""
        if "fft_data" in params:
            return {
                "frequencies": params["fft_data"],
                "range": params.get("range", {"min": 0, "max": 20000}),
                "scale": params.get("scale", "linear")
            }
        return {"frequencies": []}

    def _generate_parameter_graph(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate parameter graph visualization data."""
        return {
            "parameter": params.get("parameter", ""),
            "values": params.get("values", []),
            "range": params.get("range", {"min": 0, "max": 1}),
            "interpolation": params.get("interpolation", "linear")
        }

    def _apply_post_processing(self, frame_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply post-processing effects to the frame."""
        effects = self.scene_data["post_processing"]

        for effect in effects:
            if effect["type"] == "bloom":
                frame_data["post_processing"] = {
                    "bloom": {
                        "intensity": effect.get("intensity", 1.0),
                        "threshold": effect.get("threshold", 0.8)
                    }
                }
            elif effect["type"] == "color_correction":
                frame_data["post_processing"] = {
                    "color_correction": {
                        "brightness": effect.get("brightness", 1.0),
                        "contrast": effect.get("contrast", 1.0),
                        "saturation": effect.get("saturation", 1.0)
                    }
                }

        return frame_data

    async def add_client(self, websocket: WebSocket):
        """Add a new WebSocket client."""
        await websocket.accept()
        self.clients.append(websocket)

    async def remove_client(self, websocket: WebSocket):
        """Remove a WebSocket client."""
        if websocket in self.clients:
            self.clients.remove(websocket)

    async def broadcast_frame(self, frame_data: Dict[str, Any]):
        """Broadcast frame data to all connected clients."""
        disconnected_clients = []

        for client in self.clients:
            try:
                await client.send_json(frame_data)
            except:
                disconnected_clients.append(client)

        # Remove disconnected clients
        for client in disconnected_clients:
            await self.remove_client(client)

    def export_frame(self, frame_data: Dict[str, Any], output_path: Path):
        """Export a frame to file."""
        with output_path.open("w") as f:
            json.dump(frame_data, f)
