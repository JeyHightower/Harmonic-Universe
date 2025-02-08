from celery import Celery
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

celery = Celery(
    'app',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/1'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/1'),
    include=['app.tasks']
)

# Optional configuration
celery.conf.update(
    result_expires=3600,  # Results expire after 1 hour
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

if __name__ == '__main__':
    celery.start()
