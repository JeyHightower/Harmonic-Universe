from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from redis import Redis
from rq import Queue, Worker
from ..models import db, MediaAsset, Scene, SceneVersion
from .media_service import MediaService
from .ai_service import AIService

class JobProcessor:
    def __init__(self, redis_url: str = 'redis://localhost:6379'):
        self.redis = Redis.from_url(redis_url)
        self.media_queue = Queue('media', connection=self.redis)
        self.ai_queue = Queue('ai', connection=self.redis)
        self.maintenance_queue = Queue('maintenance', connection=self.redis)

        self.media_service = MediaService()
        self.ai_service = AIService()

    def process_media_queue(self):
        """Process media processing jobs"""
        def process_media_job(asset_id: int, options: Dict[str, Any]):
            return self.media_service.process_media(asset_id, options)

        # Get pending media assets
        pending_assets = MediaAsset.query.filter_by(status='pending').all()

        for asset in pending_assets:
            self.media_queue.enqueue(
                process_media_job,
                asset.id,
                asset.processing_options
            )

    def run_ai_tasks(self):
        """Run AI-related background tasks"""
        def run_scene_generation(prompt: str):
            return self.ai_service.generate_scene(prompt)

        def run_audio_enhancement(track_id: int):
            return self.ai_service.enhance_audio(track_id)

        def run_physics_optimization(scene_id: int):
            return self.ai_service.optimize_physics(scene_id)

        # Queue AI tasks based on your application needs
        # This is just an example structure
        self.ai_queue.enqueue(run_scene_generation, "example prompt")
        self.ai_queue.enqueue(run_audio_enhancement, 1)
        self.ai_queue.enqueue(run_physics_optimization, 1)

    def cleanup_old_versions(self, days: int = 30):
        """Clean up old scene versions"""
        def cleanup_job():
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            old_versions = SceneVersion.query\
                .filter(SceneVersion.created_at < cutoff_date)\
                .all()

            for version in old_versions:
                db.session.delete(version)

            db.session.commit()

        self.maintenance_queue.enqueue(cleanup_job)

    def start_workers(self, num_workers: int = 3):
        """Start background workers"""
        workers = []

        for _ in range(num_workers):
            worker = Worker(
                queues=[self.media_queue, self.ai_queue, self.maintenance_queue],
                connection=self.redis
            )
            worker.work(with_scheduler=True)
            workers.append(worker)

        return workers

    def get_queue_status(self) -> Dict[str, Any]:
        """Get status of all job queues"""
        return {
            'media': {
                'pending': self.media_queue.count,
                'failed': self.media_queue.failed_job_registry.count
            },
            'ai': {
                'pending': self.ai_queue.count,
                'failed': self.ai_queue.failed_job_registry.count
            },
            'maintenance': {
                'pending': self.maintenance_queue.count,
                'failed': self.maintenance_queue.failed_job_registry.count
            }
        }

    def retry_failed_jobs(self):
        """Retry failed jobs across all queues"""
        queues = [self.media_queue, self.ai_queue, self.maintenance_queue]

        for queue in queues:
            failed_registry = queue.failed_job_registry
            for job_id in failed_registry.get_job_ids():
                failed_registry.requeue(job_id)
