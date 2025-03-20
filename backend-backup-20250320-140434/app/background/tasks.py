"""Background tasks for periodic operations."""

from backend.app.celery import celery
from backend.app.models.core.universe import Universe
from backend.app.models.audio import AudioFile
from backend.app.db.session import get_db
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@celery.task
def cleanup_old_audio_files():
    """Clean up audio files older than 7 days that are not associated with any universe."""
    try:
        with get_db() as db:
            # Find old audio files
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            old_files = (
                db.query(AudioFile)
                .filter(
                    AudioFile.created_at < cutoff_date, AudioFile.universe_id.is_(None)
                )
                .all()
            )

            # Delete files and records
            for audio_file in old_files:
                try:
                    if os.path.exists(audio_file.path):
                        os.remove(audio_file.path)
                    db.delete(audio_file)
                except Exception as e:
                    logger.error(f"Error deleting file {audio_file.path}: {str(e)}")

            db.commit()
            return {"status": "success", "files_cleaned": len(old_files)}

    except Exception as e:
        logger.error(f"Error in cleanup task: {str(e)}")
        return {"status": "error", "error": str(e)}


@celery.task
def update_universe_statistics():
    """Update statistics for all universes."""
    try:
        with get_db() as db:
            universes = db.query(Universe).all()
            for universe in universes:
                try:
                    # Calculate statistics
                    audio_files = len(universe.audio_files)
                    total_duration = sum(
                        af.duration for af in universe.audio_files if af.duration
                    )
                    active_users = len(universe.collaborators)

                    # Update universe stats
                    universe.statistics = {
                        "audio_files": audio_files,
                        "total_duration": total_duration,
                        "active_users": active_users,
                        "last_updated": datetime.utcnow().isoformat(),
                    }

                except Exception as e:
                    logger.error(
                        f"Error updating stats for universe {universe.id}: {str(e)}"
                    )

            db.commit()
            return {"status": "success", "universes_updated": len(universes)}

    except Exception as e:
        logger.error(f"Error in statistics update task: {str(e)}")
        return {"status": "error", "error": str(e)}


@celery.task
def monitor_system_health():
    """Monitor system health and resources."""
    try:
        # Check disk space
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
        total, used, free = os.statvfs(upload_dir)[0:6:2]
        disk_usage = (used / total) * 100

        # Check database connection
        with get_db() as db:
            db.execute("SELECT 1")

        # Check audio file count
        with get_db() as db:
            audio_file_count = db.query(AudioFile).count()

        return {
            "status": "success",
            "disk_usage_percent": disk_usage,
            "audio_file_count": audio_file_count,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error in health monitoring task: {str(e)}")
        return {"status": "error", "error": str(e)}
