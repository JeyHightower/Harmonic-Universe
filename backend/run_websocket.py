import os
import sys
import signal
import logging
import time
import socket
import redis
import psutil
from contextlib import contextmanager
from typing import List, Optional, Dict
import threading
from datetime import datetime
import asyncio
import json
import copy

# Force eventlet mode before any other imports
os.environ['EVENTLET_MONKEY_PATCH'] = '1'
os.environ['FLASK_SOCKETIO_MODE'] = 'eventlet'

import eventlet
eventlet.monkey_patch(all=True)  # Ensure complete monkey patching

from app import create_app
from app.services.websocket_manager import WebSocketManager
from flask_socketio import SocketIO
from flask import jsonify

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('websocket_server.log')
    ]
)
logger = logging.getLogger(__name__)

# Global variables for cleanup and state management
_cleanup_tasks = []
_redis_client = None
_workers = []
_worker_health = {}
_connection_pool = None
_max_connections = 1000
_health_check_interval = 30  # seconds
_connection_metrics = {
    'total_connections': 0,
    'active_connections': 0,
    'connection_rate': 0,
    'last_connection_time': None
}
_rate_limit = {
    'connections_per_second': 100,
    'window_size': 1,  # seconds
    'connection_times': []
}

# Add system metrics
_system_metrics = {
    'cpu_percent': 0,
    'memory_percent': 0,
    'disk_usage': 0,
    'network_io': {'bytes_sent': 0, 'bytes_recv': 0},
    'last_update': None
}

# Add performance metrics
_performance_metrics = {
    'latency': [],
    'throughput': 0,
    'error_rate': 0,
    'request_count': 0,
    'error_count': 0
}

# Add resource thresholds and alerts
_resource_thresholds = {
    'cpu_percent': 80.0,
    'memory_percent': 85.0,
    'disk_usage': 90.0,
    'error_rate': 0.05
}

# Add automatic scaling configuration
_scaling_config = {
    'min_workers': 2,
    'max_workers': 8,
    'scale_up_threshold': 0.75,  # CPU usage threshold to scale up
    'scale_down_threshold': 0.25,  # CPU usage threshold to scale down
    'cooldown_period': 300  # seconds between scaling operations
}

# Add metric persistence configuration
_metric_config = {
    'retention_period': 86400,  # 24 hours in seconds
    'aggregation_interval': 300,  # 5 minutes in seconds
    'cleanup_interval': 3600,  # 1 hour in seconds
}

# Add notification configuration
_notification_config = {
    'channels': ['log', 'redis'],
    'severity_levels': {
        'critical': 0,
        'error': 1,
        'warning': 2,
        'info': 3
    },
    'notification_threshold': {
        'critical': 0,  # Send immediately
        'error': 5,     # 5 similar errors
        'warning': 10   # 10 similar warnings
    }
}

# Add metric aggregation configuration
_metric_aggregation = {
    'intervals': [60, 300, 3600],  # 1 min, 5 min, 1 hour
    'retention': {
        60: 24 * 60 * 60,    # 1 day for 1-min aggregates
        300: 7 * 24 * 60 * 60,  # 1 week for 5-min aggregates
        3600: 30 * 24 * 60 * 60  # 30 days for 1-hour aggregates
    }
}

# Add worker load balancing configuration
_load_balancing = {
    'max_load_ratio': 1.5,
    'min_load_ratio': 0.5,
    'rebalance_threshold': 0.75,
    'connection_buffer': 0.1
}

# Add monitoring configuration
_monitoring_config = {
    'metrics': {
        'collection_interval': 60,  # seconds
        'retention_period': 86400,  # 24 hours
        'aggregation_intervals': [300, 3600],  # 5 min, 1 hour
    },
    'alerts': {
        'thresholds': {
            'cpu_critical': 90,
            'memory_critical': 85,
            'error_rate_critical': 0.1,
            'latency_critical': 1000  # ms
        },
        'notification_channels': ['log', 'redis']
    }
}

class BackoffStrategy:
    def __init__(self, initial_delay: float = 1.0, max_delay: float = 60.0, factor: float = 2.0):
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.factor = factor
        self.current_delay = initial_delay
        self.attempt = 0

    def next_delay(self) -> float:
        delay = min(self.initial_delay * (self.factor ** self.attempt), self.max_delay)
        self.attempt += 1
        return delay

    def reset(self):
        self.attempt = 0
        self.current_delay = self.initial_delay

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, reset_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failures = 0
        self.last_failure_time = 0
        self.state = "closed"
        self.lock = threading.Lock()
        self.last_state_change = time.time()
        self.metrics = {
            'total_failures': 0,
            'consecutive_successes': 0,
            'state_changes': []
        }

    def can_execute(self) -> bool:
        with self.lock:
            current_time = time.time()
            if self.state == "open":
                if current_time - self.last_failure_time > self.reset_timeout:
                    self.state = "half-open"
                    self._record_state_change("half-open")
                    return True
                return False
            return True

    def record_failure(self):
        with self.lock:
            self.failures += 1
            self.last_failure_time = time.time()
            self.metrics['total_failures'] += 1
            self.metrics['consecutive_successes'] = 0
            if self.failures >= self.failure_threshold:
                self.state = "open"
                self._record_state_change("open")

    def record_success(self):
        with self.lock:
            self.failures = 0
            self.metrics['consecutive_successes'] += 1
            if self.state != "closed":
                self.state = "closed"
                self._record_state_change("closed")

    def _record_state_change(self, new_state: str):
        self.metrics['state_changes'].append({
            'time': time.time(),
            'from': self.state,
            'to': new_state
        })
        self.last_state_change = time.time()

class ConnectionPool:
    def __init__(self, max_connections: int):
        self.max_connections = max_connections
        self.current_connections = 0
        self.lock = threading.Lock()
        self.metrics = {
            'peak_connections': 0,
            'total_rejected': 0,
            'connection_history': []
        }
        self.active_pools = {}

    def get_or_create_pool(self, worker_id: int) -> Dict:
        """Get or create a connection pool for a worker."""
        with self.lock:
            if worker_id not in self.active_pools:
                self.active_pools[worker_id] = {
                    'connections': {},
                    'last_cleanup': time.time()
                }
            return self.active_pools[worker_id]

    def acquire(self, worker_id: int, client_id: str) -> bool:
        """Acquire a connection from a specific worker's pool."""
        with self.lock:
            if self.current_connections >= self.max_connections:
                self.metrics['total_rejected'] += 1
                return False

            pool = self.get_or_create_pool(worker_id)
            if client_id in pool['connections']:
                return False

            pool['connections'][client_id] = {
                'connected_at': time.time(),
                'last_activity': time.time()
            }
            self.current_connections += 1
            self.metrics['peak_connections'] = max(
                self.metrics['peak_connections'],
                self.current_connections
            )
            self._record_connection()
            return True

    def release(self, worker_id: int, client_id: str):
        """Release a connection back to the pool."""
        with self.lock:
            pool = self.active_pools.get(worker_id)
            if pool and client_id in pool['connections']:
                del pool['connections'][client_id]
                self.current_connections -= 1

    def cleanup_inactive(self, timeout: int = 300):
        """Clean up inactive connections."""
        current_time = time.time()
        with self.lock:
            for worker_id, pool in self.active_pools.items():
                if current_time - pool['last_cleanup'] > 60:  # Cleanup every minute
                    inactive = [
                        cid for cid, data in pool['connections'].items()
                        if current_time - data['last_activity'] > timeout
                    ]
                    for client_id in inactive:
                        self.release(worker_id, client_id)
                    pool['last_cleanup'] = current_time

    def _record_connection(self):
        """Record connection metrics."""
        self.metrics['connection_history'].append({
            'time': time.time(),
            'count': self.current_connections
        })
        # Keep only last hour of history
        cutoff_time = time.time() - 3600
        self.metrics['connection_history'] = [
            entry for entry in self.metrics['connection_history']
            if entry['time'] > cutoff_time
        ]

def can_accept_connection() -> bool:
    """Check if we can accept a new connection based on rate limiting."""
    current_time = time.time()
    window_start = current_time - _rate_limit['window_size']

    # Remove old connection times
    _rate_limit['connection_times'] = [
        t for t in _rate_limit['connection_times']
        if t > window_start
    ]

    # Check if we're under the rate limit
    if len(_rate_limit['connection_times']) < _rate_limit['connections_per_second']:
        _rate_limit['connection_times'].append(current_time)
        return True
    return False

def update_connection_metrics():
    """Update connection metrics."""
    current_time = time.time()
    if _connection_metrics['last_connection_time']:
        time_diff = current_time - _connection_metrics['last_connection_time']
        if time_diff > 0:
            _connection_metrics['connection_rate'] = 1 / time_diff
    _connection_metrics['last_connection_time'] = current_time
    _connection_metrics['total_connections'] += 1
    _connection_metrics['active_connections'] = _connection_pool.current_connections if _connection_pool else 0

def register_cleanup(task):
    """Register a cleanup task to be executed on shutdown."""
    _cleanup_tasks.append(task)

def execute_cleanup():
    """Execute all registered cleanup tasks."""
    logger.info("Executing cleanup tasks...")
    for task in reversed(_cleanup_tasks):
        try:
            task()
        except Exception as e:
            logger.error(f"Cleanup task failed: {e}", exc_info=True)

def signal_handler(sig, frame):
    """Enhanced signal handler with graceful shutdown."""
    logger.info("Received shutdown signal")
    shutdown_manager = GracefulShutdown()
    shutdown_manager.initiate()
    asyncio.run(shutdown_manager.shutdown_sequence())
    sys.exit(0)

@contextmanager
def redis_connection(retries=5, retry_delay=1):
    """Context manager for Redis connection with retry mechanism."""
    global _redis_client
    circuit_breaker = CircuitBreaker()
    backoff = BackoffStrategy()

    for attempt in range(retries):
        if not circuit_breaker.can_execute():
            logger.warning("Circuit breaker is open, waiting before retry...")
            time.sleep(backoff.next_delay())
            continue

        try:
            _redis_client = redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                socket_timeout=5,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30,
                max_connections=_max_connections,
                retry_on_timeout=True,
                decode_responses=True
            )
            _redis_client.ping()  # Test connection
            circuit_breaker.record_success()
            backoff.reset()
            logger.info("Successfully connected to Redis")
            break
        except redis.ConnectionError as e:
            circuit_breaker.record_failure()
            logger.warning(f"Redis connection attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(backoff.next_delay())
            else:
                raise RuntimeError(f"Failed to connect to Redis after {retries} attempts")
    try:
        yield _redis_client
    finally:
        if _redis_client:
            _redis_client.close()
            _redis_client = None

@contextmanager
def socket_cleanup(port, retries=5, retry_delay=1, backlog=100):
    """Context manager for socket cleanup with retry mechanism."""
    global _connection_pool
    sock = None
    _connection_pool = ConnectionPool(_max_connections)
    backoff = BackoffStrategy()

    for attempt in range(retries):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 5)
            sock.settimeout(30)  # 30 second timeout
            sock.bind(('0.0.0.0', port))
            sock.listen(backlog)
            logger.info(f"Successfully bound to port {port} with backlog {backlog}")
            break
        except socket.error as e:
            if e.errno == 98:  # Address already in use
                logger.warning(f"Port {port} is in use, attempt {attempt + 1}/{retries}")
                if sock:
                    sock.close()
                if attempt < retries - 1:
                    time.sleep(backoff.next_delay())
                else:
                    raise RuntimeError(f"Failed to bind to port {port} after {retries} attempts")
            else:
                raise
    try:
        yield sock
    finally:
        if sock:
            sock.close()

def update_system_metrics():
    """Update system resource metrics."""
    global _system_metrics
    try:
        _system_metrics.update({
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'network_io': psutil.net_io_counters()._asdict(),
            'last_update': time.time()
        })
    except Exception as e:
        logger.error(f"Failed to update system metrics: {e}")

def update_performance_metrics(latency: float = None, is_error: bool = False):
    """Update performance metrics."""
    global _performance_metrics
    current_time = time.time()

    if latency is not None:
        _performance_metrics['latency'].append(latency)
        # Keep only last 1000 latency measurements
        if len(_performance_metrics['latency']) > 1000:
            _performance_metrics['latency'] = _performance_metrics['latency'][-1000:]

    _performance_metrics['request_count'] += 1
    if is_error:
        _performance_metrics['error_count'] += 1

    _performance_metrics['error_rate'] = (
        _performance_metrics['error_count'] / _performance_metrics['request_count']
        if _performance_metrics['request_count'] > 0 else 0
    )

def check_resource_thresholds():
    """Check if any resource thresholds are exceeded."""
    alerts = []
    if _system_metrics['cpu_percent'] > _resource_thresholds['cpu_percent']:
        alerts.append(f"CPU usage critical: {_system_metrics['cpu_percent']}%")
    if _system_metrics['memory_percent'] > _resource_thresholds['memory_percent']:
        alerts.append(f"Memory usage critical: {_system_metrics['memory_percent']}%")
    if _system_metrics['disk_usage'] > _resource_thresholds['disk_usage']:
        alerts.append(f"Disk usage critical: {_system_metrics['disk_usage']}%")
    if _performance_metrics['error_rate'] > _resource_thresholds['error_rate']:
        alerts.append(f"Error rate critical: {_performance_metrics['error_rate']}")

    if alerts:
        logger.warning("Resource alerts: " + "; ".join(alerts))
    return alerts

def detect_performance_degradation():
    """Detect and respond to performance degradation."""
    while True:
        try:
            current_time = time.time()

            # Check latency trends
            if len(_performance_metrics['latency']) >= 10:
                recent_latency = sum(_performance_metrics['latency'][-10:]) / 10
                historical_latency = sum(_performance_metrics['latency'][:-10]) / max(len(_performance_metrics['latency']) - 10, 1)

                if recent_latency > historical_latency * 1.5:  # 50% increase in latency
                    logger.warning(f"Performance degradation detected - High latency: {recent_latency:.2f}ms vs {historical_latency:.2f}ms")
                    alert_system.add_alert(
                        'performance',
                        f"High latency detected: {recent_latency:.2f}ms (50% above normal)",
                        'warning'
                    )

            # Check error rate trends
            error_rate = _performance_metrics['error_count'] / max(_performance_metrics['request_count'], 1)
            if error_rate > _monitoring_config['alerts']['thresholds']['error_rate_critical']:
                logger.warning(f"Performance degradation detected - High error rate: {error_rate:.2%}")
                alert_system.add_alert(
                    'performance',
                    f"High error rate detected: {error_rate:.2%}",
                    'critical'
                )

            # Check worker load distribution
            worker_loads = [w.load for w in _workers if w.state.current_state == 'running']
            if worker_loads:
                avg_load = sum(worker_loads) / len(worker_loads)
                max_load = max(worker_loads)

                if max_load > avg_load * _load_balancing['max_load_ratio']:
                    logger.warning(f"Performance degradation detected - Uneven load distribution: {max_load:.2%} vs {avg_load:.2%}")
                    # Trigger auto-scaling if needed
                    auto_scale_workers()

            # Sleep for monitoring interval
            eventlet.sleep(_monitoring_config['metrics']['collection_interval'])

        except Exception as e:
            logger.error(f"Error in performance degradation detection: {e}", exc_info=True)
            eventlet.sleep(5)  # Short sleep on error before retrying

def auto_scale_workers():
    """Enhanced auto-scaling with improved metrics and decision making."""
    try:
        current_time = time.time()
        if hasattr(auto_scale_workers, 'last_scale_time') and \
           current_time - auto_scale_workers.last_scale_time < _scaling_config['cooldown_period']:
            return

        # Get system metrics
        cpu_usage = _system_metrics['cpu_percent'] / 100.0
        memory_usage = _system_metrics['memory_percent'] / 100.0

        # Get worker metrics
        active_workers = [w for w in _workers if w.state.current_state == 'running']
        current_workers = len(active_workers)

        # Calculate average worker load
        worker_loads = [w.load for w in active_workers]
        avg_load = sum(worker_loads) / len(worker_loads) if worker_loads else 0

        # Scale up conditions
        scale_up = False
        scale_up_reason = None

        if cpu_usage > _scaling_config['scale_up_threshold']:
            scale_up = True
            scale_up_reason = f"High CPU usage: {cpu_usage:.2%}"
        elif avg_load > _load_balancing['rebalance_threshold']:
            scale_up = True
            scale_up_reason = f"High average worker load: {avg_load:.2%}"
        elif memory_usage > 0.85:  # 85% memory usage
            scale_up = True
            scale_up_reason = f"High memory usage: {memory_usage:.2%}"

        # Scale down conditions
        scale_down = False
        scale_down_reason = None

        if cpu_usage < _scaling_config['scale_down_threshold'] and \
           avg_load < _load_balancing['min_load_ratio'] and \
           current_workers > _scaling_config['min_workers']:
            scale_down = True
            scale_down_reason = f"Low resource usage - CPU: {cpu_usage:.2%}, Load: {avg_load:.2%}"

        # Execute scaling decision
        if scale_up and current_workers < _scaling_config['max_workers']:
            logger.info(f"Scaling up due to {scale_up_reason}")
            new_worker = Worker(len(_workers))
            new_worker.start()
            _workers.append(new_worker)
            _worker_health[len(_workers) - 1] = "healthy"
            auto_scale_workers.last_scale_time = current_time

            # Log scaling event
            alert_system.add_alert(
                'scaling',
                f"Scaled up to {len(_workers)} workers - Reason: {scale_up_reason}",
                'info'
            )

        elif scale_down:
            logger.info(f"Scaling down due to {scale_down_reason}")
            worker = _workers.pop()
            worker.stop()
            _worker_health.pop(len(_workers))
            auto_scale_workers.last_scale_time = current_time

            # Log scaling event
            alert_system.add_alert(
                'scaling',
                f"Scaled down to {len(_workers)} workers - Reason: {scale_down_reason}",
                'info'
            )

    except Exception as e:
        logger.error(f"Error in auto-scaling: {e}", exc_info=True)

def monitor_connections():
    """Enhanced connection monitoring with improved metrics and management."""
    while True:
        try:
            current_time = time.time()

            # Check connection pool health
            if _connection_pool:
                # Cleanup inactive connections
                _connection_pool.cleanup_inactive()

                # Check connection rate
                connection_rate = len(_rate_limit['connection_times']) / _rate_limit['window_size']
                if connection_rate > _rate_limit['connections_per_second'] * 0.8:  # 80% of limit
                    logger.warning(f"High connection rate detected: {connection_rate:.2f}/s")
                    alert_system.add_alert(
                        'connection',
                        f"High connection rate: {connection_rate:.2f}/s",
                        'warning'
                    )

                # Check connection distribution
                worker_loads = [(w, w.load) for w in _workers if w.state.current_state == 'running']
                if worker_loads:
                    avg_load = sum(load for _, load in worker_loads) / len(worker_loads)
                    for worker, load in worker_loads:
                        if load > avg_load * _load_balancing['max_load_ratio']:
                            logger.warning(f"Worker {worker.id} is overloaded, redistributing connections")
                            # Find least loaded worker
                            target_worker = min(
                                (w for w, _ in worker_loads if w.id != worker.id),
                                key=lambda w: w.load
                            )
                            worker._migrate_connections(target_worker)

                # Update connection metrics
                update_connection_metrics()

                # Store connection metrics
                metric_collector.store_metrics({
                    'connections': {
                        'active': _connection_pool.current_connections,
                        'rate': connection_rate,
                        'rejected': _connection_pool.metrics['total_rejected']
                    }
                })

            # Sleep for monitoring interval
            eventlet.sleep(_monitoring_config['metrics']['collection_interval'])

        except Exception as e:
            logger.error(f"Error in connection monitoring: {e}", exc_info=True)
            eventlet.sleep(5)  # Short sleep on error before retrying

class GracefulShutdown:
    def __init__(self):
        self.is_shutting_down = False
        self.shutdown_start = None
        self.max_wait = 30  # Maximum seconds to wait for graceful shutdown

    def initiate(self):
        """Initiate graceful shutdown sequence."""
        self.is_shutting_down = True
        self.shutdown_start = time.time()
        logger.info("Initiating graceful shutdown...")

    def should_force_shutdown(self):
        """Check if we should force shutdown."""
        return time.time() - self.shutdown_start > self.max_wait

    async def shutdown_sequence(self):
        """Execute graceful shutdown sequence."""
        try:
            # Stop accepting new connections
            if _connection_pool:
                _connection_pool.max_connections = 0

            # Wait for existing connections to complete
            while _connection_pool and _connection_pool.current_connections > 0:
                if self.should_force_shutdown():
                    logger.warning("Force shutdown initiated after timeout")
                    break
                await asyncio.sleep(1)

            # Stop workers gracefully
            for worker in _workers:
                worker.stop()

            # Execute cleanup tasks
            execute_cleanup()

        except Exception as e:
            logger.error(f"Error during graceful shutdown: {e}", exc_info=True)
            raise

# Add memory leak detection and resource monitoring
class MemoryMonitor:
    def __init__(self, threshold_mb=100):
        self.threshold_mb = threshold_mb
        self.baseline = None
        self.last_check = time.time()
        self.check_interval = 300  # 5 minutes
        self.history = []

    def check_memory(self):
        current_time = time.time()
        if current_time - self.last_check < self.check_interval:
            return None

        process = psutil.Process()
        current_memory = process.memory_info().rss / (1024 * 1024)  # Convert to MB

        if self.baseline is None:
            self.baseline = current_memory
            self.history.append((current_time, current_memory))
            return None

        self.history.append((current_time, current_memory))
        # Keep last 24 hours of history
        self.history = [(t, m) for t, m in self.history if current_time - t < 86400]

        # Check for memory growth
        if len(self.history) > 2:
            memory_growth = current_memory - self.history[0][1]
            time_diff = current_time - self.history[0][0]
            growth_rate = memory_growth / (time_diff / 3600)  # MB per hour

            if growth_rate > self.threshold_mb:
                return {
                    'growth_rate': growth_rate,
                    'current_memory': current_memory,
                    'baseline': self.baseline,
                    'duration_hours': time_diff / 3600
                }

        self.last_check = current_time
        return None

# Add alert management
class AlertManager:
    def __init__(self):
        self.alerts = []
        self.alert_history = []
        self.alert_thresholds = {
            'memory_leak': 100,  # MB per hour
            'cpu_sustained': 90,  # percentage
            'error_rate': 0.1,  # 10% error rate
            'latency': 1000,  # ms
            'connection_reject_rate': 0.2  # 20% rejection rate
        }

    def add_alert(self, alert_type: str, message: str, severity: str = 'warning'):
        alert = {
            'type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': time.time()
        }
        self.alerts.append(alert)
        self.alert_history.append(alert)

        # Keep only last 1000 alerts in history
        if len(self.alert_history) > 1000:
            self.alert_history = self.alert_history[-1000:]

    def check_thresholds(self, metrics):
        # Check memory leak
        if metrics.get('memory_leak'):
            if metrics['memory_leak']['growth_rate'] > self.alert_thresholds['memory_leak']:
                self.add_alert(
                    'memory_leak',
                    f"Memory leak detected: {metrics['memory_leak']['growth_rate']:.2f} MB/hour",
                    'critical'
                )

        # Check CPU usage
        if metrics.get('cpu_percent', 0) > self.alert_thresholds['cpu_sustained']:
            self.add_alert(
                'cpu_high',
                f"High CPU usage: {metrics['cpu_percent']}%",
                'warning'
            )

        # Check error rate
        if metrics.get('error_rate', 0) > self.alert_thresholds['error_rate']:
            self.add_alert(
                'error_rate',
                f"High error rate: {metrics['error_rate']*100:.2f}%",
                'critical'
            )

# Add recovery strategies
class RecoveryManager:
    def __init__(self):
        self.recovery_attempts = {}
        self.max_attempts = 3
        self.cooldown_period = 300  # 5 minutes

    def can_attempt_recovery(self, component: str) -> bool:
        if component not in self.recovery_attempts:
            self.recovery_attempts[component] = []
            return True

        current_time = time.time()
        # Clean up old attempts
        self.recovery_attempts[component] = [
            t for t in self.recovery_attempts[component]
            if current_time - t < self.cooldown_period
        ]

        return len(self.recovery_attempts[component]) < self.max_attempts

    def record_attempt(self, component: str):
        if component not in self.recovery_attempts:
            self.recovery_attempts[component] = []
        self.recovery_attempts[component].append(time.time())

    async def recover_worker(self, worker: Worker) -> bool:
        if not self.can_attempt_recovery(f"worker_{worker.id}"):
            return False

        try:
            worker.stop()
            await asyncio.sleep(1)
            worker.start()
            self.record_attempt(f"worker_{worker.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to recover worker {worker.id}: {e}")
            return False

class MetricStore:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.prefix = 'metrics:'

    def store_metric(self, metric_type: str, value: float, timestamp: float = None):
        """Store a metric in Redis with TTL."""
        if timestamp is None:
            timestamp = time.time()

        key = f"{self.prefix}{metric_type}:{int(timestamp / _metric_config['aggregation_interval'])}"
        try:
            self.redis.zadd(key, {str(value): timestamp})
            self.redis.expire(key, _metric_config['retention_period'])
        except Exception as e:
            logger.error(f"Failed to store metric: {e}")

    def get_metrics(self, metric_type: str, start_time: float, end_time: float) -> List[tuple]:
        """Get metrics for a time range."""
        metrics = []
        start_bucket = int(start_time / _metric_config['aggregation_interval'])
        end_bucket = int(end_time / _metric_config['aggregation_interval'])

        for bucket in range(start_bucket, end_bucket + 1):
            key = f"{self.prefix}{metric_type}:{bucket}"
            try:
                values = self.redis.zrangebyscore(key, start_time, end_time, withscores=True)
                metrics.extend(values)
            except Exception as e:
                logger.error(f"Failed to retrieve metrics: {e}")

        return metrics

    def cleanup_old_metrics(self):
        """Clean up expired metrics."""
        current_time = time.time()
        pattern = f"{self.prefix}*"
        try:
            for key in self.redis.scan_iter(match=pattern):
                if not self.redis.ttl(key):
                    self.redis.delete(key)
        except Exception as e:
            logger.error(f"Failed to cleanup metrics: {e}")

class NotificationManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.prefix = 'notifications:'
        self.alert_counts = {}

    def should_notify(self, alert_type: str, severity: str) -> bool:
        """Determine if notification should be sent based on alert count and severity."""
        key = f"{alert_type}:{severity}"
        self.alert_counts[key] = self.alert_counts.get(key, 0) + 1
        threshold = _notification_config['notification_threshold'].get(severity, 1)

        if self.alert_counts[key] >= threshold:
            self.alert_counts[key] = 0
            return True
        return False

    def send_notification(self, alert: dict):
        """Send notification through configured channels."""
        if not self.should_notify(alert['type'], alert['severity']):
            return

        for channel in _notification_config['channels']:
            try:
                if channel == 'log':
                    logger.warning(f"Alert: {alert['message']} (Severity: {alert['severity']})")
                elif channel == 'redis':
                    self.redis.lpush(
                        f"{self.prefix}alerts",
                        json.dumps({**alert, 'timestamp': time.time()})
                    )
                    self.redis.ltrim(f"{self.prefix}alerts", 0, 999)  # Keep last 1000 alerts
            except Exception as e:
                logger.error(f"Failed to send notification: {e}")

class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.prefix = 'cache:'
        self.default_ttl = 300  # 5 minutes

    def get_cached(self, key: str) -> Optional[str]:
        """Get value from cache."""
        try:
            return self.redis.get(f"{self.prefix}{key}")
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    def set_cached(self, key: str, value: str, ttl: int = None):
        """Set value in cache with TTL."""
        try:
            self.redis.set(
                f"{self.prefix}{key}",
                value,
                ex=ttl or self.default_ttl
            )
        except Exception as e:
            logger.error(f"Cache set error: {e}")

class MetricAggregator:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.prefix = 'metrics:aggregated:'

    def aggregate_metrics(self, metric_type: str, interval: int):
        """Aggregate metrics for a specific interval."""
        now = int(time.time())
        window_start = now - interval

        # Get raw metrics
        raw_metrics = metric_store.get_metrics(metric_type, window_start, now)

        if not raw_metrics:
            return

        # Calculate aggregates
        values = [float(v) for v, _ in raw_metrics]
        aggregates = {
            'min': min(values),
            'max': max(values),
            'avg': sum(values) / len(values),
            'count': len(values)
        }

        # Store aggregates
        key = f"{self.prefix}{metric_type}:{interval}:{now // interval}"
        self.redis.hmset(key, aggregates)
        self.redis.expire(key, _metric_aggregation['retention'][interval])

class LoadBalancer:
    def __init__(self):
        self.last_rebalance = time.time()
        self.rebalance_interval = 60  # seconds

    def calculate_worker_load(self, worker: Worker) -> float:
        """Calculate normalized load for a worker."""
        if not worker.metrics.request_count:
            return 0.0

        # Consider multiple factors for load calculation
        cpu_load = worker.metrics.peak_memory / psutil.virtual_memory().total
        conn_load = worker.metrics.current_connections / _max_connections
        error_rate = worker.metrics.error_count / worker.metrics.request_count

        # Weighted average of different metrics
        return (0.4 * cpu_load + 0.4 * conn_load + 0.2 * (1 - error_rate))

    def needs_rebalancing(self, workers: List[Worker]) -> bool:
        """Check if workers need rebalancing."""
        if not workers or time.time() - self.last_rebalance < self.rebalance_interval:
            return False

        loads = [self.calculate_worker_load(w) for w in workers]
        avg_load = sum(loads) / len(loads)

        return any(
            load > avg_load * _load_balancing['max_load_ratio'] or
            load < avg_load * _load_balancing['min_load_ratio']
            for load in loads
        )

    def rebalance_connections(self, workers: List[Worker]):
        """Rebalance connections across workers."""
        if not self.needs_rebalancing(workers):
            return

        loads = [(w, self.calculate_worker_load(w)) for w in workers]
        avg_load = sum(l for _, l in loads) / len(loads)

        # Sort workers by load
        loads.sort(key=lambda x: x[1])

        # Redistribute connections from most loaded to least loaded
        while loads[-1][1] > avg_load * _load_balancing['max_load_ratio']:
            source = loads[-1][0]
            target = loads[0][0]

            # Calculate number of connections to move
            conns_to_move = int(
                (source.metrics.current_connections - target.metrics.current_connections) *
                _load_balancing['connection_buffer']
            )

            if conns_to_move > 0:
                self._migrate_connections(source, target, conns_to_move)

            # Update loads
            loads[-1] = (source, self.calculate_worker_load(source))
            loads[0] = (target, self.calculate_worker_load(target))
            loads.sort(key=lambda x: x[1])

        self.last_rebalance = time.time()

    def _migrate_connections(self, source: Worker, target: Worker, count: int):
        """Migrate connections from source to target worker."""
        logger.info(f"Migrating {count} connections from worker {source.id} to {target.id}")

        try:
            # Get connections to migrate
            conns = source.get_connections()[:count]

            for conn in conns:
                # Notify client about migration
                socketio.emit('server_migration', {
                    'target_worker': target.id
                }, room=conn.sid)

                # Move connection
                source.remove_connection(conn)
                target.add_connection(conn)

        except Exception as e:
            logger.error(f"Error migrating connections: {e}")

class ConnectionManager:
    def __init__(self, max_connections: int):
        self.max_connections = max_connections
        self.active_connections = {}
        self.connection_history = []
        self.rate_limiter = RateLimiter()
        self.lock = threading.Lock()

    def can_accept_connection(self, client_id: str) -> bool:
        """Check if a new connection can be accepted."""
        with self.lock:
            # Check rate limit
            if not self.rate_limiter.check_rate(client_id):
                return False

            # Check connection limit
            if len(self.active_connections) >= self.max_connections:
                return False

            return True

    def add_connection(self, client_id: str, worker_id: int):
        """Add a new connection."""
        with self.lock:
            if client_id in self.active_connections:
                return False

            self.active_connections[client_id] = {
                'worker_id': worker_id,
                'connected_at': time.time(),
                'last_activity': time.time()
            }

            self.connection_history.append({
                'client_id': client_id,
                'action': 'connect',
                'timestamp': time.time()
            })

            # Cleanup old history
            self._cleanup_history()

            return True

    def remove_connection(self, client_id: str):
        """Remove a connection."""
        with self.lock:
            if client_id in self.active_connections:
                del self.active_connections[client_id]

                self.connection_history.append({
                    'client_id': client_id,
                    'action': 'disconnect',
                    'timestamp': time.time()
                })

    def update_activity(self, client_id: str):
        """Update last activity time for a connection."""
        with self.lock:
            if client_id in self.active_connections:
                self.active_connections[client_id]['last_activity'] = time.time()

    def _cleanup_history(self):
        """Clean up old connection history."""
        current_time = time.time()
        self.connection_history = [
            entry for entry in self.connection_history
            if current_time - entry['timestamp'] < 86400  # Keep 24 hours of history
        ]

class RateLimiter:
    def __init__(self):
        self.rates = {}
        self.window_size = 60  # 1 minute window
        self.max_requests = 100  # requests per window
        self.lock = threading.Lock()

    def check_rate(self, client_id: str) -> bool:
        """Check if client is within rate limits."""
        with self.lock:
            current_time = time.time()

            # Initialize or clean up client's rate data
            if client_id not in self.rates:
                self.rates[client_id] = []
            else:
                # Remove old requests
                self.rates[client_id] = [
                    t for t in self.rates[client_id]
                    if current_time - t < self.window_size
                ]

            # Check rate limit
            if len(self.rates[client_id]) >= self.max_requests:
                return False

            # Add new request
            self.rates[client_id].append(current_time)
            return True

class WorkerMetrics:
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.average_latency = 0
        self.peak_memory = 0
        self.current_connections = 0
        self.total_processed = 0
        self.last_update = time.time()
        self.connection_history = []

    def update(self, latency: float = None, is_error: bool = False):
        self.request_count += 1
        if is_error:
            self.error_count += 1
        if latency is not None:
            self.average_latency = (
                (self.average_latency * (self.request_count - 1) + latency)
                / self.request_count
            )
        self.peak_memory = max(self.peak_memory, psutil.Process().memory_info().rss)
        self.total_processed += 1
        self.last_update = time.time()

    def add_connection(self):
        self.current_connections += 1
        self.connection_history.append({
            'action': 'connect',
            'timestamp': time.time(),
            'count': self.current_connections
        })

    def remove_connection(self):
        if self.current_connections > 0:
            self.current_connections -= 1
            self.connection_history.append({
                'action': 'disconnect',
                'timestamp': time.time(),
                'count': self.current_connections
            })

class WorkerState:
    def __init__(self):
        self.states = {
            'initializing': 0,
            'running': 1,
            'stopping': 2,
            'stopped': 3,
            'error': 4,
            'recovering': 5
        }
        self.current_state = 'initializing'
        self.transitions = []
        self.last_transition = time.time()

    def transition_to(self, new_state: str):
        if new_state in self.states:
            old_state = self.current_state
            self.current_state = new_state
            self.transitions.append({
                'from': old_state,
                'to': new_state,
                'timestamp': time.time()
            })
            self.last_transition = time.time()
            return True
        return False

    def get_state_duration(self) -> float:
        return time.time() - self.last_transition

    def is_stable(self) -> bool:
        return self.current_state in ['running', 'stopped']

class Worker:
    def __init__(self, worker_id: int):
        self.id = worker_id
        self.process = None
        self.metrics = WorkerMetrics()
        self.last_heartbeat = time.time()
        self.state = WorkerState()
        self.load = 0
        self.connection_pool = ConnectionPool(_max_connections)
        self.lock = threading.Lock()
        self.recovery_attempts = 0
        self.max_recovery_attempts = 3
        self.recovery_cooldown = 300  # 5 minutes

    def start(self):
        """Start the worker process with enhanced state management."""
        try:
            self.state.transition_to('initializing')
            self.process = eventlet.spawn(self._worker_loop)
            self.state.transition_to('running')
            logger.info(f"Worker {self.id} started successfully")
        except Exception as e:
            logger.error(f"Failed to start worker {self.id}: {e}")
            self.state.transition_to('error')
            raise

    def stop(self):
        """Stop the worker process gracefully with enhanced cleanup."""
        try:
            if self.process:
                self.state.transition_to('stopping')
                # Migrate connections to other workers
                self._migrate_connections()
                # Cleanup resources
                self._cleanup_resources()
                self.process.kill()
                self.process = None
                self.state.transition_to('stopped')
                logger.info(f"Worker {self.id} stopped gracefully")
        except Exception as e:
            logger.error(f"Error stopping worker {self.id}: {e}")
            self.state.transition_to('error')

    def _migrate_connections(self):
        """Migrate connections to other workers."""
        connections = self.get_connections()
        if not connections:
            return

        other_workers = [w for w in _workers if w.id != self.id and w.state.current_state == 'running']
        if not other_workers:
            return

        for conn_id in connections:
            # Find least loaded worker
            target_worker = min(other_workers, key=lambda w: w.load)
            if target_worker.add_connection(conn_id):
                self.remove_connection(conn_id)
                logger.info(f"Migrated connection {conn_id} from worker {self.id} to worker {target_worker.id}")

    def _cleanup_resources(self):
        """Cleanup worker resources."""
        try:
            # Clear connection pool
            self.connection_pool = ConnectionPool(_max_connections)
            # Reset metrics
            self.metrics = WorkerMetrics()
            # Reset recovery state
            self.recovery_attempts = 0
        except Exception as e:
            logger.error(f"Error cleaning up worker {self.id} resources: {e}")

    def can_recover(self) -> bool:
        """Check if worker can attempt recovery."""
        if self.recovery_attempts >= self.max_recovery_attempts:
            return False
        if time.time() - self.state.last_transition < self.recovery_cooldown:
            return False
        return True

    def attempt_recovery(self) -> bool:
        """Attempt to recover the worker."""
        if not self.can_recover():
            return False

        try:
            self.state.transition_to('recovering')
            self.stop()
            time.sleep(1)  # Brief pause before restart
            self.start()
            self.recovery_attempts += 1
            return self.state.current_state == 'running'
        except Exception as e:
            logger.error(f"Failed to recover worker {self.id}: {e}")
            self.state.transition_to('error')
            return False

    def _worker_loop(self):
        """Main worker loop with enhanced monitoring."""
        while True:
            try:
                # Update heartbeat
                self.last_heartbeat = time.time()

                # Update load metrics
                self.load = self.connection_pool.current_connections

                # Update process metrics
                process = psutil.Process()
                self.metrics.peak_memory = max(
                    self.metrics.peak_memory,
                    process.memory_info().rss
                )

                # Cleanup inactive connections
                self.connection_pool.cleanup_inactive()

                # Update worker metrics
                self.metrics.current_connections = self.load
                self.metrics.last_update = time.time()

                eventlet.sleep(1)  # Sleep for 1 second

            except Exception as e:
                logger.error(f"Worker {self.id} error: {e}")
                self.metrics.error_count += 1
                self.state.transition_to('error')
                break

class HealthCheck:
    def __init__(self):
        self.last_check = time.time()
        self.check_interval = 30  # seconds
        self.metrics = {
            'system': {},
            'workers': {},
            'redis': {},
            'websocket': {}
        }
        self.status_history = []

    def check_health(self) -> dict:
        """Perform comprehensive health check."""
        current_time = time.time()
        if current_time - self.last_check < self.check_interval:
            return self.metrics

        try:
            # System health
            self.metrics['system'] = {
                'cpu_usage': psutil.cpu_percent(),
                'memory_usage': psutil.virtual_memory().percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'network': psutil.net_io_counters()._asdict()
            }

            # Worker health
            self.metrics['workers'] = {
                worker.id: {
                    'state': worker.state.current_state,
                    'uptime': time.time() - worker.metrics.start_time,
                    'connections': worker.connection_pool.current_connections,
                    'error_rate': worker.metrics.error_count / max(worker.metrics.request_count, 1),
                    'load': worker.load
                } for worker in _workers
            }

            # Redis health
            if _redis_client:
                try:
                    _redis_client.ping()
                    self.metrics['redis']['status'] = 'connected'
                except:
                    self.metrics['redis']['status'] = 'disconnected'

            # WebSocket health
            self.metrics['websocket'] = {
                'active_connections': _connection_metrics['active_connections'],
                'connection_rate': _connection_metrics['connection_rate'],
                'error_rate': _performance_metrics['error_rate']
            }

            # Store history
            self.status_history.append({
                'timestamp': current_time,
                'metrics': copy.deepcopy(self.metrics)
            })

            # Keep last 24 hours of history
            self.status_history = [
                entry for entry in self.status_history
                if current_time - entry['timestamp'] < 86400
            ]

            self.last_check = current_time
            return self.metrics

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return None

class MetricCollector:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.prefix = 'metrics:'
        self.aggregation_intervals = [60, 300, 3600]  # 1min, 5min, 1hour
        self.last_cleanup = time.time()
        self.cleanup_interval = 3600  # 1 hour

    def collect_metrics(self):
        """Collect all system and application metrics."""
        current_time = time.time()
        metrics = {
            'system': {
                'cpu': _system_metrics['cpu_percent'],
                'memory': _system_metrics['memory_percent'],
                'disk': _system_metrics['disk_usage']
            },
            'performance': {
                'latency': sum(_performance_metrics['latency']) / len(_performance_metrics['latency'])
                if _performance_metrics['latency'] else 0,
                'error_rate': _performance_metrics['error_rate'],
                'request_count': _performance_metrics['request_count']
            },
            'workers': [
                {
                    'id': worker.id,
                    'connections': worker.connection_pool.current_connections,
                    'error_count': worker.metrics.error_count,
                    'request_count': worker.metrics.request_count
                } for worker in _workers
            ],
            'timestamp': current_time
        }

        # Store raw metrics
        self.store_metrics(metrics)

        # Aggregate metrics
        self.aggregate_metrics(metrics)

        # Cleanup old metrics if needed
        if current_time - self.last_cleanup > self.cleanup_interval:
            self.cleanup_old_metrics()
            self.last_cleanup = current_time

    def store_metrics(self, metrics: dict):
        """Store raw metrics in Redis."""
        try:
            key = f"{self.prefix}raw:{int(time.time())}"
            self.redis.setex(
                key,
                _metric_config['retention_period'],
                json.dumps(metrics)
            )
        except Exception as e:
            logger.error(f"Failed to store metrics: {e}")

    def aggregate_metrics(self, metrics: dict):
        """Aggregate metrics for different time intervals."""
        current_time = int(time.time())

        for interval in self.aggregation_intervals:
            bucket = current_time - (current_time % interval)
            key = f"{self.prefix}agg:{interval}:{bucket}"

            try:
                # Get existing aggregates
                existing = self.redis.get(key)
                if existing:
                    agg = json.loads(existing)
                else:
                    agg = {
                        'count': 0,
                        'system': {'cpu': [], 'memory': [], 'disk': []},
                        'performance': {'latency': [], 'error_rate': [], 'request_count': []},
                        'workers': {}
                    }

                # Update aggregates
                agg['count'] += 1
                for metric_type in ['cpu', 'memory', 'disk']:
                    agg['system'][metric_type].append(metrics['system'][metric_type])

                for metric_type in ['latency', 'error_rate', 'request_count']:
                    agg['performance'][metric_type].append(metrics['performance'][metric_type])

                for worker in metrics['workers']:
                    worker_id = str(worker['id'])
                    if worker_id not in agg['workers']:
                        agg['workers'][worker_id] = {
                            'connections': [],
                            'error_count': [],
                            'request_count': []
                        }
                    agg['workers'][worker_id]['connections'].append(worker['connections'])
                    agg['workers'][worker_id]['error_count'].append(worker['error_count'])
                    agg['workers'][worker_id]['request_count'].append(worker['request_count'])

                # Store updated aggregates
                self.redis.setex(
                    key,
                    _metric_aggregation['retention'][interval],
                    json.dumps(agg)
                )

            except Exception as e:
                logger.error(f"Failed to aggregate metrics: {e}")

    def cleanup_old_metrics(self):
        """Clean up expired metrics."""
        try:
            current_time = time.time()
            pattern = f"{self.prefix}*"

            for key in self.redis.scan_iter(match=pattern):
                if not self.redis.ttl(key):
                    self.redis.delete(key)

        except Exception as e:
            logger.error(f"Failed to cleanup metrics: {e}")

class AlertSystem:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.prefix = 'alerts:'
        self.alert_history = []
        self.notification_manager = NotificationManager(redis_client)
        self.thresholds = {
            'cpu_usage': 80,
            'memory_usage': 85,
            'disk_usage': 90,
            'error_rate': 0.1,
            'worker_load': 0.8
        }

    def check_alerts(self, health_metrics: dict):
        """Check metrics against thresholds and generate alerts."""
        current_time = time.time()
        alerts = []

        # System alerts
        if health_metrics['system']['cpu_usage'] > self.thresholds['cpu_usage']:
            alerts.append({
                'type': 'system',
                'severity': 'critical',
                'message': f"CPU usage critical: {health_metrics['system']['cpu_usage']}%"
            })

        if health_metrics['system']['memory_usage'] > self.thresholds['memory_usage']:
            alerts.append({
                'type': 'system',
                'severity': 'warning',
                'message': f"Memory usage high: {health_metrics['system']['memory_usage']}%"
            })

        # Worker alerts
        for worker_id, worker_metrics in health_metrics['workers'].items():
            if worker_metrics['error_rate'] > self.thresholds['error_rate']:
                alerts.append({
                    'type': 'worker',
                    'severity': 'error',
                    'message': f"Worker {worker_id} high error rate: {worker_metrics['error_rate']:.2%}"
                })

            if worker_metrics['load'] > self.thresholds['worker_load']:
                alerts.append({
                    'type': 'worker',
                    'severity': 'warning',
                    'message': f"Worker {worker_id} high load: {worker_metrics['load']:.2%}"
                })

        # Process alerts
        for alert in alerts:
            alert['timestamp'] = current_time
            self.process_alert(alert)

    def process_alert(self, alert: dict):
        """Process and store alert, send notifications if needed."""
        try:
            # Store alert
            self.alert_history.append(alert)

            # Keep only last 1000 alerts
            if len(self.alert_history) > 1000:
                self.alert_history = self.alert_history[-1000:]

            # Store in Redis
            key = f"{self.prefix}{int(alert['timestamp'])}"
            self.redis.setex(
                key,
                86400,  # 24 hour retention
                json.dumps(alert)
            )

            # Send notification
            self.notification_manager.send_notification(alert)

        except Exception as e:
            logger.error(f"Failed to process alert: {e}")

    def get_active_alerts(self) -> list:
        """Get list of active alerts."""
        return [
            alert for alert in self.alert_history
            if time.time() - alert['timestamp'] < 3600  # Active for last hour
        ]

# Add monitoring configuration
_monitoring_config = {
    'metrics': {
        'collection_interval': 60,  # seconds
        'retention_period': 86400,  # 24 hours
        'aggregation_intervals': [300, 3600],  # 5 min, 1 hour
    },
    'alerts': {
        'thresholds': {
            'cpu_critical': 90,
            'memory_critical': 85,
            'error_rate_critical': 0.1,
            'latency_critical': 1000  # ms
        },
        'notification_channels': ['log', 'redis']
    }
}

class SystemMonitor:
    def __init__(self):
        self.metrics = {
            'system': {
                'cpu': [],
                'memory': [],
                'disk': [],
                'network': []
            },
            'performance': {
                'latency': [],
                'error_rate': [],
                'throughput': []
            },
            'workers': {}
        }
        self.last_collection = time.time()
        self.alert_manager = AlertManager()

    def collect_metrics(self):
        """Collect system and application metrics."""
        current_time = time.time()
        if current_time - self.last_collection < _monitoring_config['metrics']['collection_interval']:
            return

        try:
            # System metrics
            self.metrics['system']['cpu'].append({
                'timestamp': current_time,
                'value': psutil.cpu_percent()
            })
            self.metrics['system']['memory'].append({
                'timestamp': current_time,
                'value': psutil.virtual_memory().percent
            })
            self.metrics['system']['disk'].append({
                'timestamp': current_time,
                'value': psutil.disk_usage('/').percent
            })
            net_io = psutil.net_io_counters()
            self.metrics['system']['network'].append({
                'timestamp': current_time,
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv
            })

            # Performance metrics
            if _performance_metrics['latency']:
                avg_latency = sum(_performance_metrics['latency']) / len(_performance_metrics['latency'])
                self.metrics['performance']['latency'].append({
                    'timestamp': current_time,
                    'value': avg_latency
                })

            error_rate = _performance_metrics['error_count'] / max(_performance_metrics['request_count'], 1)
            self.metrics['performance']['error_rate'].append({
                'timestamp': current_time,
                'value': error_rate
            })

            # Worker metrics
            for worker in _workers:
                if worker.id not in self.metrics['workers']:
                    self.metrics['workers'][worker.id] = {
                        'connections': [],
                        'error_rate': [],
                        'state_changes': []
                    }

                worker_metrics = self.metrics['workers'][worker.id]
                worker_metrics['connections'].append({
                    'timestamp': current_time,
                    'value': worker.connection_pool.current_connections
                })
                worker_metrics['error_rate'].append({
                    'timestamp': current_time,
                    'value': worker.metrics.error_count / max(worker.metrics.request_count, 1)
                })
                if worker.state.transitions:
                    worker_metrics['state_changes'].extend(worker.state.transitions)
                    worker.state.transitions = []  # Clear processed transitions

            # Check for alerts
            self.check_alerts()

            # Cleanup old metrics
            self.cleanup_old_metrics()

            self.last_collection = current_time

        except Exception as e:
            logger.error(f"Error collecting metrics: {e}", exc_info=True)

    def check_alerts(self):
        """Check metrics against thresholds and generate alerts."""
        thresholds = _monitoring_config['alerts']['thresholds']

        # CPU alert
        latest_cpu = self.metrics['system']['cpu'][-1]['value']
        if latest_cpu > thresholds['cpu_critical']:
            self.alert_manager.add_alert(
                'system',
                f"CPU usage critical: {latest_cpu}%",
                'critical'
            )

        # Memory alert
        latest_memory = self.metrics['system']['memory'][-1]['value']
        if latest_memory > thresholds['memory_critical']:
            self.alert_manager.add_alert(
                'system',
                f"Memory usage critical: {latest_memory}%",
                'critical'
            )

        # Error rate alert
        latest_error_rate = self.metrics['performance']['error_rate'][-1]['value']
        if latest_error_rate > thresholds['error_rate_critical']:
            self.alert_manager.add_alert(
                'application',
                f"High error rate: {latest_error_rate:.2%}",
                'critical'
            )

        # Latency alert
        if self.metrics['performance']['latency']:
            latest_latency = self.metrics['performance']['latency'][-1]['value']
            if latest_latency > thresholds['latency_critical']:
                self.alert_manager.add_alert(
                    'application',
                    f"High latency: {latest_latency:.2f}ms",
                    'critical'
                )

    def cleanup_old_metrics(self):
        """Remove metrics older than retention period."""
        cutoff_time = time.time() - _monitoring_config['metrics']['retention_period']

        # Clean system metrics
        for metric_type in self.metrics['system']:
            self.metrics['system'][metric_type] = [
                m for m in self.metrics['system'][metric_type]
                if m['timestamp'] > cutoff_time
            ]

        # Clean performance metrics
        for metric_type in self.metrics['performance']:
            self.metrics['performance'][metric_type] = [
                m for m in self.metrics['performance'][metric_type]
                if m['timestamp'] > cutoff_time
            ]

        # Clean worker metrics
        for worker_id in self.metrics['workers']:
            worker_metrics = self.metrics['workers'][worker_id]
            for metric_type in ['connections', 'error_rate']:
                worker_metrics[metric_type] = [
                    m for m in worker_metrics[metric_type]
                    if m['timestamp'] > cutoff_time
                ]
            worker_metrics['state_changes'] = [
                change for change in worker_metrics['state_changes']
                if change['timestamp'] > cutoff_time
            ]

# Initialize system monitor
system_monitor = SystemMonitor()

# Update monitor_system_health function
def monitor_system_health():
    """Enhanced system health monitoring with improved metrics and recovery."""
    health_check = HealthCheck()
    metric_collector = MetricCollector(_redis_client)
    alert_system = AlertSystem(_redis_client)

    while True:
        try:
            # Perform health check
            health_metrics = health_check.check_health()
            if health_metrics:
                # Collect and store metrics
                metric_collector.collect_metrics()

                # Check for alerts
                alert_system.check_alerts(health_metrics)

            # Update system metrics
            update_system_metrics()

            # Check worker health and attempt recovery if needed
            for worker in _workers:
                if worker.state.current_state == 'error' and worker.can_recover():
                    logger.warning(f"Attempting to recover worker {worker.id}")
                    if worker.attempt_recovery():
                        logger.info(f"Worker {worker.id} recovered successfully")
                    else:
                        logger.error(f"Worker {worker.id} recovery failed")

            # Sleep for monitoring interval
            eventlet.sleep(_monitoring_config['metrics']['collection_interval'])

        except Exception as e:
            logger.error(f"Error in system health monitoring: {e}", exc_info=True)
            eventlet.sleep(5)  # Short sleep on error before retrying

def create_websocket_app():
    """Create and configure the WebSocket application with improved connection handling."""
    try:
        app = create_app()

        @app.route('/health')
        def health_check():
            """Enhanced health check endpoint with detailed metrics."""
            try:
                # Get current health metrics
                health_metrics = health_check_system.check_health()

                # Get worker metrics
                worker_metrics = {
                    worker.id: {
                        'state': worker.state.current_state,
                        'connections': worker.connection_pool.current_connections,
                        'error_rate': worker.metrics.error_count / max(worker.metrics.request_count, 1),
                        'uptime': time.time() - worker.metrics.start_time,
                        'load': worker.load,
                        'recovery_attempts': worker.recovery_attempts
                    } for worker in _workers
                }

                # Get system metrics
                system_metrics = {
                    'cpu': psutil.cpu_percent(),
                    'memory': psutil.virtual_memory().percent,
                    'disk': psutil.disk_usage('/').percent,
                    'network': psutil.net_io_counters()._asdict()
                }

                status = {
                    'status': 'healthy',
                    'timestamp': datetime.utcnow().isoformat(),
                    'system': system_metrics,
                    'workers': worker_metrics,
                    'connections': {
                        'current': _connection_pool.current_connections if _connection_pool else 0,
                        'metrics': _connection_metrics,
                        'pool_metrics': _connection_pool.metrics if _connection_pool else None
                    },
                    'alerts': alert_system.get_active_alerts() if 'alert_system' in globals() else []
                }

                return jsonify(status)
            except Exception as e:
                logger.error(f"Health check failed: {e}")
                return jsonify({
                    'status': 'unhealthy',
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }), 500

        socketio = SocketIO(
            app,
            cors_allowed_origins="*",
            async_mode='eventlet',
            message_queue='redis://',
            logger=True,
            engineio_logger=True,
            always_connect=True,
            ping_timeout=60,
            ping_interval=25,
            manage_session=False,
            websocket_class=eventlet.websocket.WebSocket,
            max_http_buffer_size=1024 * 1024
        )

        # Add connection event handlers with improved error handling and metrics
        @socketio.on('connect')
        def handle_connect():
            try:
                client_id = request.sid
                if not can_accept_connection():
                    logger.warning(f"Connection rejected for client {client_id} (rate limit)")
                    return False

                if not _connection_pool or _connection_pool.current_connections >= _max_connections:
                    logger.warning(f"Connection rejected for client {client_id} (pool full)")
                    return False

                # Find least loaded worker with proper error handling
                try:
                    available_workers = [w for w in _workers if w.state.current_state == 'running']
                    if not available_workers:
                        logger.error("No available workers for new connection")
                        return False

                    target_worker = min(available_workers, key=lambda w: w.load)

                    if target_worker.add_connection(client_id):
                        update_connection_metrics()
                        logger.info(f"Client {client_id} connected to worker {target_worker.id}")
                        return True

                    logger.warning(f"Failed to add connection for client {client_id}")
                    return False

                except Exception as e:
                    logger.error(f"Error assigning worker for client {client_id}: {e}")
                    return False

            except Exception as e:
                logger.error(f"Connection handler error: {e}")
                return False

        @socketio.on('disconnect')
        def handle_disconnect():
            try:
                client_id = request.sid
                # Find and cleanup client connection
                for worker in _workers:
                    if client_id in worker.get_connections():
                        worker.remove_connection(client_id)
                        logger.info(f"Client {client_id} disconnected from worker {worker.id}")
                        break

                update_connection_metrics()

            except Exception as e:
                logger.error(f"Disconnect handler error: {e}")

        # Add error handlers
        @socketio.on_error()
        def error_handler(e):
            logger.error(f"SocketIO error: {e}")
            update_performance_metrics(is_error=True)

        @socketio.on_error_default
        def default_error_handler(e):
            logger.error(f"SocketIO default error: {e}")
            update_performance_metrics(is_error=True)

        websocket_manager = WebSocketManager(socketio)
        websocket_manager.register_handlers()

        # Register cleanup tasks
        register_cleanup(lambda: websocket_manager.stop_updates())
        register_cleanup(lambda: socketio.stop())
        register_cleanup(lambda: cleanup_connections())

        return app, socketio, websocket_manager

    except Exception as e:
        logger.error(f"Failed to create WebSocket app: {e}", exc_info=True)
        raise

def cleanup_connections():
    """Enhanced connection cleanup with migration support."""
    try:
        if _connection_pool:
            # Get all active connections
            active_connections = []
            for worker in _workers:
                active_connections.extend([
                    (conn_id, worker.id)
                    for conn_id in worker.get_connections()
                ])

            # Find available workers
            available_workers = [
                w for w in _workers
                if w.state.current_state == 'running'
            ]

            if available_workers:
                # Migrate connections to available workers
                for conn_id, worker_id in active_connections:
                    current_worker = next(w for w in _workers if w.id == worker_id)
                    if current_worker.state.current_state != 'running':
                        # Find least loaded available worker
                        target_worker = min(available_workers, key=lambda w: w.load)
                        if target_worker.add_connection(conn_id):
                            current_worker.remove_connection(conn_id)
                            logger.info(
                                f"Migrated connection {conn_id} from worker {worker_id} "
                                f"to worker {target_worker.id}"
                            )

            # Cleanup remaining connections
            for worker in _workers:
                for conn_id in worker.get_connections():
                    worker.remove_connection(conn_id)

            logger.info("All connections cleaned up successfully")

    except Exception as e:
        logger.error(f"Error cleaning up connections: {e}", exc_info=True)

def monitor_worker_health():
    """Monitor worker health and restart failed workers with enhanced monitoring."""
    while True:
        try:
            current_time = time.time()

            # Check each worker's health
            for worker in _workers:
                # Check heartbeat
                if current_time - worker.last_heartbeat > 30:  # No heartbeat for 30 seconds
                    logger.warning(f"Worker {worker.id} heartbeat timeout")
                    if worker.can_recover():
                        worker.attempt_recovery()

                # Check error rate
                error_rate = worker.metrics.error_count / max(worker.metrics.request_count, 1)
                if error_rate > _monitoring_config['alerts']['thresholds']['error_rate_critical']:
                    logger.warning(f"Worker {worker.id} high error rate: {error_rate:.2%}")
                    alert_system.add_alert(
                        'worker',
                        f"Worker {worker.id} high error rate: {error_rate:.2%}",
                        'critical'
                    )

                # Check load
                if worker.load > 0.8:  # 80% load threshold
                    logger.warning(f"Worker {worker.id} high load: {worker.load:.2%}")
                    # Attempt to redistribute connections
                    other_workers = [w for w in _workers if w.id != worker.id and w.load < 0.5]
                    if other_workers:
                        target_worker = min(other_workers, key=lambda w: w.load)
                        worker._migrate_connections(target_worker)

                # Update metrics
                metric_collector.collect_worker_metrics(worker)

            # Check system health
            health_metrics = health_check.check_health()
            if health_metrics:
                # Check for alerts
                alert_system.check_alerts(health_metrics)

                # Store metrics
                metric_collector.collect_metrics()

            # Sleep for monitoring interval
            eventlet.sleep(_monitoring_config['metrics']['collection_interval'])

        except Exception as e:
            logger.error(f"Error in worker health monitoring: {e}", exc_info=True)
            eventlet.sleep(5)  # Short sleep on error before retrying

def setup_worker_processes(num_workers=4):
    """Set up worker processes for handling WebSocket connections with enhanced monitoring."""
    global _workers, _worker_health
    _workers = []
    try:
        # Initialize monitoring systems
        health_check = HealthCheck()
        metric_collector = MetricCollector(_redis_client)
        alert_system = AlertSystem(_redis_client)

        for i in range(num_workers):
            worker = Worker(i)
            worker.start()
            _workers.append(worker)
            _worker_health[i] = "healthy"

        # Start health monitoring
        eventlet.spawn(monitor_worker_health)
        eventlet.spawn(monitor_system_health)

        # Start metric collection
        eventlet.spawn(lambda: metric_collector.collect_metrics())

        # Start auto scaling
        eventlet.spawn(lambda: auto_scale_workers())

        # Start performance monitoring
        eventlet.spawn(lambda: detect_performance_degradation())

        # Start connection monitoring
        eventlet.spawn(lambda: monitor_connections())

        logger.info(f"Started {num_workers} worker processes with enhanced monitoring")
        return _workers

    except Exception as e:
        logger.error(f"Failed to setup worker processes: {e}", exc_info=True)
        raise

def monitor_connections():
    """Enhanced connection monitoring with improved metrics and management."""
    while True:
        try:
            current_time = time.time()

            # Check connection pool health
            if _connection_pool:
                # Cleanup inactive connections
                _connection_pool.cleanup_inactive()

                # Check connection rate
                connection_rate = len(_rate_limit['connection_times']) / _rate_limit['window_size']
                if connection_rate > _rate_limit['connections_per_second'] * 0.8:  # 80% of limit
                    logger.warning(f"High connection rate detected: {connection_rate:.2f}/s")
                    alert_system.add_alert(
                        'connection',
                        f"High connection rate: {connection_rate:.2f}/s",
                        'warning'
                    )

                # Check connection distribution
                worker_loads = [(w, w.load) for w in _workers if w.state.current_state == 'running']
                if worker_loads:
                    avg_load = sum(load for _, load in worker_loads) / len(worker_loads)
                    for worker, load in worker_loads:
                        if load > avg_load * _load_balancing['max_load_ratio']:
                            logger.warning(f"Worker {worker.id} is overloaded, redistributing connections")
                            # Find least loaded worker
                            target_worker = min(
                                (w for w, _ in worker_loads if w.id != worker.id),
                                key=lambda w: w.load
                            )
                            worker._migrate_connections(target_worker)

                # Update connection metrics
                update_connection_metrics()

                # Store connection metrics
                metric_collector.store_metrics({
                    'connections': {
                        'active': _connection_pool.current_connections,
                        'rate': connection_rate,
                        'rejected': _connection_pool.metrics['total_rejected']
                    }
                })

            # Sleep for monitoring interval
            eventlet.sleep(_monitoring_config['metrics']['collection_interval'])

        except Exception as e:
            logger.error(f"Error in connection monitoring: {e}", exc_info=True)
            eventlet.sleep(5)  # Short sleep on error before retrying

if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    port = 5002
    try:
        with redis_connection():
            with socket_cleanup(port):
                logger.info("Initializing WebSocket server...")
                app, socketio, websocket_manager = create_websocket_app()

                # Initialize monitoring systems
                health_check = HealthCheck()
                metric_collector = MetricCollector(_redis_client)
                alert_system = AlertSystem(_redis_client)

                # Start worker processes with monitoring
                workers = setup_worker_processes()
                websocket_manager.start_updates()
                logger.info("WebSocket manager started successfully")

                # Start system monitoring
                eventlet.spawn(monitor_system_health)
                eventlet.spawn(lambda: metric_collector.collect_metrics())

                # Start memory monitoring
                memory_monitor = MemoryMonitor()
                eventlet.spawn(lambda: memory_monitor.check_memory())

                # Start connection monitoring
                eventlet.spawn(lambda: monitor_connections())

                logger.info(f"Starting WebSocket server on port {port}...")
                socketio.run(
                    app,
                    host='0.0.0.0',
                    port=port,
                    debug=False,
                    use_reloader=False,
                    log_output=True,
                    allow_unsafe_werkzeug=True
                )

    except Exception as e:
        logger.error(f"Server failed to start: {e}", exc_info=True)
        execute_cleanup()
        sys.exit(1)
