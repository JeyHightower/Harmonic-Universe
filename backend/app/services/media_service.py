from typing import Optional
import os
from werkzeug.utils import secure_filename
from ..models import db, MediaAsset
from ..config import Config

class MediaService:
    ALLOWED_EXTENSIONS = {
        'image': {'png', 'jpg', 'jpeg', 'gif'},
        'audio': {'mp3', 'wav', 'ogg'},
        'video': {'mp4', 'webm'}
    }

    def __init__(self, storage_path: str = Config.UPLOAD_FOLDER):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)

    def allowed_file(self, filename: str, file_type: str) -> bool:
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS.get(file_type, set())

    def upload_file(self, file, file_type: str) -> Optional[MediaAsset]:
        if file and self.allowed_file(file.filename, file_type):
            filename = secure_filename(file.filename)
            filepath = os.path.join(self.storage_path, filename)
            file.save(filepath)

            asset = MediaAsset(
                filename=filename,
                file_type=file_type,
                file_path=filepath,
                size=os.path.getsize(filepath)
            )
            db.session.add(asset)
            db.session.commit()

            return asset
        return None

    def process_media(self, asset_id: int, options: dict) -> Optional[MediaAsset]:
        asset = MediaAsset.query.get(asset_id)
        if not asset:
            return None

        # Process based on file type
        if asset.file_type == 'image':
            return self._process_image(asset, options)
        elif asset.file_type == 'audio':
            return self._process_audio(asset, options)
        elif asset.file_type == 'video':
            return self._process_video(asset, options)

        return None

    def get_signed_url(self, asset_id: int, expires_in: int = 3600) -> Optional[str]:
        asset = MediaAsset.query.get(asset_id)
        if not asset:
            return None

        # Generate signed URL (implement based on your storage solution)
        # For local development, return direct path
        return f'/media/{asset.filename}'

    def _process_image(self, asset: MediaAsset, options: dict) -> MediaAsset:
        # Implement image processing (resize, crop, etc.)
        return asset

    def _process_audio(self, asset: MediaAsset, options: dict) -> MediaAsset:
        # Implement audio processing (normalize, convert, etc.)
        return asset

    def _process_video(self, asset: MediaAsset, options: dict) -> MediaAsset:
        # Implement video processing (compress, convert, etc.)
        return asset
