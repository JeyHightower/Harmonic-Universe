"""Background tasks configuration."""

import asyncio
from typing import Any, Callable, Dict, List, Optional
from datetime import datetime, timedelta

from app.logging.config import get_logger

logger = get_logger(__name__)


class BackgroundTask:
    """Background task class."""

    def __init__(
        self,
        func: Callable,
        interval: timedelta,
        name: Optional[str] = None,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
    ):
        """Initialize background task."""
        self.func = func
        self.interval = interval
        self.name = name or func.__name__
        self.args = args or []
        self.kwargs = kwargs or {}
        self.last_run: Optional[datetime] = None
        self.is_running = False
        self.task: Optional[asyncio.Task] = None

    async def run(self) -> None:
        """Run the task."""
        self.is_running = True
        try:
            while self.is_running:
                try:
                    logger.info(f"Running background task: {self.name}")
                    await self.func(*self.args, **self.kwargs)
                    self.last_run = datetime.utcnow()
                except Exception as e:
                    logger.error(
                        f"Error in background task {self.name}: {str(e)}",
                        exc_info=True,
                    )
                await asyncio.sleep(self.interval.total_seconds())
        finally:
            self.is_running = False

    def start(self) -> None:
        """Start the task."""
        if not self.is_running:
            self.task = asyncio.create_task(self.run())
            logger.info(f"Started background task: {self.name}")

    def stop(self) -> None:
        """Stop the task."""
        if self.is_running and self.task:
            self.is_running = False
            self.task.cancel()
            logger.info(f"Stopped background task: {self.name}")


class BackgroundTaskManager:
    """Background task manager."""

    def __init__(self):
        """Initialize task manager."""
        self.tasks: Dict[str, BackgroundTask] = {}

    def add_task(
        self,
        func: Callable,
        interval: timedelta,
        name: Optional[str] = None,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a task to the manager."""
        task = BackgroundTask(
            func=func,
            interval=interval,
            name=name,
            args=args,
            kwargs=kwargs,
        )
        self.tasks[task.name] = task
        logger.info(f"Added background task: {task.name}")

    def start_all(self) -> None:
        """Start all tasks."""
        for task in self.tasks.values():
            task.start()
        logger.info("Started all background tasks")

    def stop_all(self) -> None:
        """Stop all tasks."""
        for task in self.tasks.values():
            task.stop()
        logger.info("Stopped all background tasks")

    def start_task(self, name: str) -> None:
        """Start a specific task."""
        if task := self.tasks.get(name):
            task.start()
        else:
            logger.warning(f"Task not found: {name}")

    def stop_task(self, name: str) -> None:
        """Stop a specific task."""
        if task := self.tasks.get(name):
            task.stop()
        else:
            logger.warning(f"Task not found: {name}")

    def get_task_status(self, name: str) -> Dict[str, Any]:
        """Get status of a specific task."""
        if task := self.tasks.get(name):
            return {
                "name": task.name,
                "running": task.is_running,
                "last_run": task.last_run.isoformat() if task.last_run else None,
            }
        return {"name": name, "error": "Task not found"}

    def get_all_task_status(self) -> List[Dict[str, Any]]:
        """Get status of all tasks."""
        return [self.get_task_status(name) for name in self.tasks]


# Create a global task manager instance
task_manager = BackgroundTaskManager()
