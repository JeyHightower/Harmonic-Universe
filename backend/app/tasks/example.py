from app.celery import celery

@celery.task
def add(x, y):
    """Simple test task that adds two numbers."""
    return x + y
