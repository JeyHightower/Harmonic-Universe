import pytest
from fastapi import status
from backend.app.services.monitoring import MonitoringService
from backend.app.models.metrics import PerformanceMetrics
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.schemas.metrics import MetricsCreate

def test_record_metrics(db: Session):
    """Test recording performance metrics."""
    monitoring = MonitoringService(db)
    metrics = MetricsCreate(
        cpu_usage=50.0,
        memory_usage=60.0,
        disk_usage=70.0,
        request_count=100,
        error_count=5,
        latency=150.0,
        bandwidth_usage=2.5,
        active_connections=10,
        environment="test",
        service_name="api",
        instance_id="test-1"
    )

    result = monitoring.record_metrics(metrics)
    assert result.id is not None
    assert result.cpu_usage == 50.0
    assert result.memory_usage == 60.0
    assert result.disk_usage == 70.0
    assert result.request_count == 100

def test_get_metrics(db: Session):
    """Test retrieving performance metrics."""
    monitoring = MonitoringService(db)

    # Create test metrics
    for i in range(5):
        metrics = MetricsCreate(
            cpu_usage=50.0 + i,
            memory_usage=60.0 + i,
            disk_usage=70.0 + i,
            request_count=100 + i,
            error_count=5,
            latency=150.0,
            bandwidth_usage=2.5,
            active_connections=10,
            environment="test",
            service_name="api",
            instance_id="test-1"
        )
        monitoring.record_metrics(metrics)

    results = monitoring.get_metrics(skip=0, limit=10)
    assert len(results) == 5
    assert all(isinstance(m, PerformanceMetrics) for m in results)

def test_get_metrics_time_range(db: Session):
    """Test retrieving metrics within a time range."""
    monitoring = MonitoringService(db)

    # Create metrics with different timestamps
    base_time = datetime.utcnow()
    for i in range(5):
        metrics = MetricsCreate(
            cpu_usage=50.0,
            memory_usage=60.0,
            disk_usage=70.0,
            request_count=100,
            error_count=5,
            latency=150.0,
            bandwidth_usage=2.5,
            active_connections=10
        )
        db_metrics = PerformanceMetrics(**metrics.dict())
        db_metrics.timestamp = base_time - timedelta(hours=i)
        db.add(db_metrics)
    db.commit()

    # Test time range filtering
    start_time = base_time - timedelta(hours=2)
    end_time = base_time
    results = monitoring.get_metrics(
        start_time=start_time,
        end_time=end_time
    )
    assert len(results) == 3

def test_get_aggregated_metrics(db: Session):
    """Test retrieving aggregated metrics."""
    monitoring = MonitoringService(db)

    # Create test metrics
    base_time = datetime.utcnow()
    for i in range(3):
        metrics = MetricsCreate(
            cpu_usage=50.0 + i,
            memory_usage=60.0 + i,
            disk_usage=70.0 + i,
            request_count=100,
            error_count=5,
            latency=150.0 + i,
            bandwidth_usage=2.5,
            active_connections=10
        )
        db_metrics = PerformanceMetrics(**metrics.dict())
        db_metrics.timestamp = base_time - timedelta(minutes=i)
        db.add(db_metrics)
    db.commit()

    # Get aggregated metrics
    start_time = base_time - timedelta(hours=1)
    end_time = base_time
    result = monitoring.get_aggregated_metrics(start_time, end_time)

    assert "avg_cpu_usage" in result
    assert "avg_memory_usage" in result
    assert "avg_latency" in result
    assert "total_requests" in result
    assert "error_count" in result
    assert result["avg_cpu_usage"] == 51.0  # (50 + 51 + 52) / 3

def test_get_alerts(db: Session):
    """Test retrieving performance alerts."""
    monitoring = MonitoringService(db)

    # Create metrics that trigger alerts
    metrics = MetricsCreate(
        cpu_usage=95.0,  # Above threshold
        memory_usage=90.0,  # Above threshold
        disk_usage=70.0,
        request_count=100,
        error_count=10,  # High error rate
        latency=1500.0,  # Above threshold
        bandwidth_usage=2.5,
        active_connections=10
    )
    result = monitoring.record_metrics(metrics)

    # Check thresholds and update alert status
    alert = monitoring.check_thresholds(result)
    assert alert is not None
    assert alert["type"] == "cpu_usage"
    assert alert["severity"] == "high"

def test_clear_alerts(db: Session):
    """Test clearing performance alerts."""
    monitoring = MonitoringService(db)

    # Create metrics with alerts
    metrics = MetricsCreate(
        cpu_usage=95.0,
        memory_usage=90.0,
        disk_usage=70.0,
        request_count=100,
        error_count=10,
        latency=1500.0,
        bandwidth_usage=2.5,
        active_connections=10
    )
    result = monitoring.record_metrics(metrics)

    # Clear alerts
    success = monitoring.clear_alerts([result.id])
    assert success is True

    # Verify alert was cleared
    updated = db.query(PerformanceMetrics).filter_by(id=result.id).first()
    assert updated.alert_triggered is False
