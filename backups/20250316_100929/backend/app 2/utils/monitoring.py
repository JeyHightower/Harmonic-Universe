"""Monitoring utility functions."""

import time
import psutil
import threading
from typing import Dict, List, Optional, Union
from datetime import datetime
import logging
from dataclasses import dataclass, field
from functools import wraps
import traceback
from collections import deque
import json

@dataclass
class RequestMetrics:
    """Request-level metrics."""
    path: str
    method: str
    start_time: float
    end_time: Optional[float] = None
    status_code: Optional[int] = None
    error: Optional[str] = None

    @property
    def duration(self) -> Optional[float]:
        """Get request duration in seconds."""
        if self.end_time is None:
            return None
        return self.end_time - self.start_time

@dataclass
class ResourceMetrics:
    """System resource metrics."""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_usage: Dict[str, float]
    network_io: Dict[str, int]
    active_threads: int
    open_files: int

class PerformanceMonitor:
    """Performance monitoring implementation."""
    def __init__(self, history_size: int = 1000):
        self.request_metrics: deque = deque(maxlen=history_size)
        self.resource_metrics: deque = deque(maxlen=history_size)
        self._lock = threading.Lock()
        self._monitoring_thread: Optional[threading.Thread] = None
        self._stop_monitoring = threading.Event()
        self.logger = logging.getLogger(__name__)

    def start_request_tracking(self, path: str, method: str) -> RequestMetrics:
        """Start tracking a request."""
        metrics = RequestMetrics(
            path=path,
            method=method,
            start_time=time.time()
        )
        return metrics

    def end_request_tracking(self, metrics: RequestMetrics, status_code: int,
                           error: Optional[str] = None) -> None:
        """End tracking a request."""
        metrics.end_time = time.time()
        metrics.status_code = status_code
        metrics.error = error

        with self._lock:
            self.request_metrics.append(metrics)

    def get_system_metrics(self) -> ResourceMetrics:
        """Get current system resource metrics."""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()._asdict()

        metrics = ResourceMetrics(
            timestamp=datetime.utcnow(),
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            disk_usage={
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent
            },
            network_io={
                'bytes_sent': network['bytes_sent'],
                'bytes_recv': network['bytes_recv']
            },
            active_threads=threading.active_count(),
            open_files=len(psutil.Process().open_files())
        )

        with self._lock:
            self.resource_metrics.append(metrics)

        return metrics

    def start_monitoring(self, interval: int = 60) -> None:
        """Start periodic system monitoring."""
        def monitor():
            while not self._stop_monitoring.is_set():
                try:
                    self.get_system_metrics()
                except Exception as e:
                    self.logger.error(f"Error collecting metrics: {e}")
                time.sleep(interval)

        self._monitoring_thread = threading.Thread(target=monitor, daemon=True)
        self._monitoring_thread.start()

    def stop_monitoring(self) -> None:
        """Stop periodic system monitoring."""
        if self._monitoring_thread:
            self._stop_monitoring.set()
            self._monitoring_thread.join()
            self._monitoring_thread = None

    def get_performance_report(self) -> Dict:
        """Generate performance report."""
        with self._lock:
            requests = list(self.request_metrics)
            resources = list(self.resource_metrics)

        # Request statistics
        request_stats = {
            'total_requests': len(requests),
            'average_duration': sum(r.duration or 0 for r in requests) / len(requests) if requests else 0,
            'error_count': sum(1 for r in requests if r.error),
            'status_codes': {}
        }

        for request in requests:
            if request.status_code:
                request_stats['status_codes'][request.status_code] = \
                    request_stats['status_codes'].get(request.status_code, 0) + 1

        # Resource statistics
        if resources:
            resource_stats = {
                'cpu': {
                    'average': sum(r.cpu_percent for r in resources) / len(resources),
                    'max': max(r.cpu_percent for r in resources)
                },
                'memory': {
                    'average': sum(r.memory_percent for r in resources) / len(resources),
                    'max': max(r.memory_percent for r in resources)
                }
            }
        else:
            resource_stats = {}

        return {
            'timestamp': datetime.utcnow().isoformat(),
            'request_stats': request_stats,
            'resource_stats': resource_stats
        }

def monitor_performance(monitor: PerformanceMonitor):
    """Decorator to monitor function performance."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            metrics = monitor.start_request_tracking(
                path=func.__name__,
                method='FUNCTION'
            )

            try:
                result = func(*args, **kwargs)
                monitor.end_request_tracking(metrics, 200)
                return result
            except Exception as e:
                monitor.end_request_tracking(
                    metrics,
                    500,
                    error=f"{type(e).__name__}: {str(e)}"
                )
                raise
        return wrapper
    return decorator

def log_slow_requests(threshold: float):
    """Decorator to log slow requests."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time

                if duration > threshold:
                    logging.warning(
                        f"Slow request detected: {func.__name__} took {duration:.2f} seconds"
                    )

                return result
            except Exception as e:
                duration = time.time() - start_time
                logging.error(
                    f"Error in {func.__name__} after {duration:.2f} seconds: {str(e)}\n"
                    f"{traceback.format_exc()}"
                )
                raise
        return wrapper
    return decorator
