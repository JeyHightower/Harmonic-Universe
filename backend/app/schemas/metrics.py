from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class MetricsBase(BaseModel):
    cpu_usage: float = Field(..., ge=0, le=100)
    memory_usage: float = Field(..., ge=0, le=100)
    disk_usage: float = Field(..., ge=0, le=100)
    request_count: int = Field(default=0, ge=0)
    error_count: int = Field(default=0, ge=0)
    latency: float = Field(default=0.0, ge=0)
    bandwidth_usage: float = Field(default=0.0, ge=0)
    active_connections: int = Field(default=0, ge=0)
    environment: Optional[str] = None
    service_name: Optional[str] = None
    instance_id: Optional[str] = None

class MetricsCreate(MetricsBase):
    pass

class MetricsUpdate(MetricsBase):
    alert_triggered: Optional[bool] = None
    alert_severity: Optional[str] = None
    metric_type: Optional[str] = None
    value: Optional[float] = None
    threshold: Optional[float] = None

class Metrics(MetricsBase):
    id: int
    timestamp: datetime
    alert_triggered: bool
    alert_severity: Optional[str]
    metric_type: Optional[str]
    value: Optional[float]
    threshold: Optional[float]

    class Config:
        from_attributes = True

class MetricsAggregate(BaseModel):
    avg_cpu_usage: float
    avg_memory_usage: float
    avg_latency: float
    total_requests: int
    error_count: int

class Alert(BaseModel):
    id: int
    timestamp: datetime
    metric_type: str
    value: float
    threshold: float
    severity: str
