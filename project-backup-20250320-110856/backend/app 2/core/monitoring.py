"""Performance monitoring system."""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import time
import threading
import psutil
import json
import os
from dataclasses import dataclass, asdict
from contextlib import contextmanager
from .logging import get_logger

logger = get_logger(__name__)

@dataclass
class RequestMetrics:
    """Metrics for a single request."""
    request_id: str
    path: str
    method: str
    start_time: float
    end_time: float
    duration_ms: float
    status_code: int
    user_id: Optional[int] = None
    error: Optional[str] = None

@dataclass
class ResourceMetrics:
    """System resource usage metrics."""
    timestamp: str
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    open_file_descriptors: int
    thread_count: int
    active_connections: int

class MetricsTracker:
    """Tracks and stores application metrics."""

    def __init__(self, retention_days: int = 7):
        """Initialize metrics tracker."""
        self.metrics_dir = "logs/metrics"
        os.makedirs(self.metrics_dir, exist_ok=True)
        self.retention_days = retention_days
        self._request_metrics: List[RequestMetrics] = []
        self._resource_metrics: List[ResourceMetrics] = []
        self._lock = threading.Lock()

    def add_request_metrics(self, metrics: RequestMetrics) -> None:
        """Add request metrics."""
        with self._lock:
            self._request_metrics.append(metrics)
            if len(self._request_metrics) >= 1000:  # Batch size
                self._save_request_metrics()

    def add_resource_metrics(self, metrics: ResourceMetrics) -> None:
        """Add resource metrics."""
        with self._lock:
            self._resource_metrics.append(metrics)
            if len(self._resource_metrics) >= 100:  # Batch size
                self._save_resource_metrics()

    def _save_request_metrics(self) -> None:
        """Save request metrics to file."""
        if not self._request_metrics:
            return

        timestamp = datetime.now().strftime("%Y%m%d")
        metrics_file = os.path.join(self.metrics_dir, f"requests_{timestamp}.json")

        try:
            with open(metrics_file, 'a') as f:
                for metrics in self._request_metrics:
                    f.write(json.dumps(asdict(metrics)) + '\n')
            self._request_metrics.clear()
        except Exception as e:
            logger.error(f"Failed to save request metrics: {str(e)}")

    def _save_resource_metrics(self) -> None:
        """Save resource metrics to file."""
        if not self._resource_metrics:
            return

        timestamp = datetime.now().strftime("%Y%m%d")
        metrics_file = os.path.join(self.metrics_dir, f"resources_{timestamp}.json")

        try:
            with open(metrics_file, 'a') as f:
                for metrics in self._resource_metrics:
                    f.write(json.dumps(asdict(metrics)) + '\n')
            self._resource_metrics.clear()
        except Exception as e:
            logger.error(f"Failed to save resource metrics: {str(e)}")

    def cleanup_old_metrics(self) -> None:
        """Clean up metrics older than retention period."""
        cutoff_date = datetime.now() - timedelta(days=self.retention_days)

        for filename in os.listdir(self.metrics_dir):
            try:
                file_date = datetime.strptime(filename.split('_')[1].split('.')[0], "%Y%m%d")
                if file_date < cutoff_date:
                    os.remove(os.path.join(self.metrics_dir, filename))
            except (ValueError, IndexError):
                continue

class PerformanceMonitor:
    """Monitors application performance."""

    def __init__(self):
        """Initialize performance monitor."""
        self.tracker = MetricsTracker()
        self._active_connections = 0
        self._lock = threading.Lock()

    @contextmanager
    def track_request(
        self,
        request_id: str,
        path: str,
        method: str,
        user_id: Optional[int] = None
    ):
        """Track request timing and metrics."""
        start_time = time.time()
        error = None
        status_code = 200

        try:
            yield
        except Exception as e:
            error = str(e)
            status_code = 500
            raise
        finally:
            end_time = time.time()
            duration_ms = (end_time - start_time) * 1000

            metrics = RequestMetrics(
                request_id=request_id,
                path=path,
                method=method,
                start_time=start_time,
                end_time=end_time,
                duration_ms=duration_ms,
                status_code=status_code,
                user_id=user_id,
                error=error
            )
            self.tracker.add_request_metrics(metrics)

    def track_resources(self) -> None:
        """Track system resource usage."""
        try:
            metrics = ResourceMetrics(
                timestamp=datetime.now().isoformat(),
                cpu_percent=psutil.cpu_percent(),
                memory_percent=psutil.virtual_memory().percent,
                disk_usage_percent=psutil.disk_usage('/').percent,
                open_file_descriptors=psutil.Process().num_fds(),
                thread_count=threading.active_count(),
                active_connections=self._active_connections
            )
            self.tracker.add_resource_metrics(metrics)
        except Exception as e:
            logger.error(f"Failed to track resources: {str(e)}")

    def increment_connections(self) -> None:
        """Increment active connection count."""
        with self._lock:
            self._active_connections += 1

    def decrement_connections(self) -> None:
        """Decrement active connection count."""
        with self._lock:
            self._active_connections = max(0, self._active_connections - 1)

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics."""
        return {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'cpu_percent': psutil.cpu_percent(),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_usage_percent': psutil.disk_usage('/').percent,
                'open_file_descriptors': psutil.Process().num_fds(),
                'thread_count': threading.active_count()
            },
            'application': {
                'active_connections': self._active_connections
            }
        }

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

__all__ = [
    'performance_monitor',
    'RequestMetrics',
    'ResourceMetrics'
]
