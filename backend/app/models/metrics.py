from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from app.db.base_model import Base
from app.db.custom_types import GUID

class PerformanceMetrics(Base):
    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Resource metrics
    cpu_usage = Column(Float, nullable=False)
    memory_usage = Column(Float, nullable=False)
    disk_usage = Column(Float, nullable=False)

    # Request metrics
    request_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    latency = Column(Float, default=0.0)  # in milliseconds

    # Network metrics
    bandwidth_usage = Column(Float, default=0.0)  # in MB/s
    active_connections = Column(Integer, default=0)

    # Alert information
    alert_triggered = Column(Boolean, default=False)
    alert_severity = Column(String, nullable=True)
    metric_type = Column(String, nullable=True)
    value = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)

    # Additional metadata
    environment = Column(String, nullable=True)
    service_name = Column(String, nullable=True)
    instance_id = Column(String, nullable=True)
