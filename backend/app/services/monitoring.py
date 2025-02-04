from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.metrics import PerformanceMetrics
from app.schemas.metrics import MetricsCreate, MetricsUpdate

class MonitoringService:
    def __init__(self, db: Session):
        self.db = db

    def record_metrics(self, metrics: MetricsCreate) -> PerformanceMetrics:
        """Record new performance metrics."""
        db_metrics = PerformanceMetrics(**metrics.dict())
        self.db.add(db_metrics)
        self.db.commit()
        self.db.refresh(db_metrics)
        return db_metrics

    def get_metrics(
        self,
        skip: int = 0,
        limit: int = 100,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[PerformanceMetrics]:
        """Get performance metrics with optional time range filter."""
        query = self.db.query(PerformanceMetrics)

        if start_time:
            query = query.filter(PerformanceMetrics.timestamp >= start_time)
        if end_time:
            query = query.filter(PerformanceMetrics.timestamp <= end_time)

        return query.offset(skip).limit(limit).all()

    def get_aggregated_metrics(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> Dict:
        """Get aggregated metrics for a time period."""
        metrics = self.get_metrics(start_time=start_time, end_time=end_time)

        if not metrics:
            return {
                "avg_cpu_usage": 0,
                "avg_memory_usage": 0,
                "avg_latency": 0,
                "total_requests": 0,
                "error_count": 0
            }

        return {
            "avg_cpu_usage": sum(m.cpu_usage for m in metrics) / len(metrics),
            "avg_memory_usage": sum(m.memory_usage for m in metrics) / len(metrics),
            "avg_latency": sum(m.latency for m in metrics) / len(metrics),
            "total_requests": sum(m.request_count for m in metrics),
            "error_count": sum(m.error_count for m in metrics)
        }

    def get_alerts(
        self,
        skip: int = 0,
        limit: int = 100,
        severity: Optional[str] = None
    ) -> List[Dict]:
        """Get performance alerts."""
        query = self.db.query(PerformanceMetrics).filter(
            PerformanceMetrics.alert_triggered == True
        )

        if severity:
            query = query.filter(PerformanceMetrics.alert_severity == severity)

        alerts = query.offset(skip).limit(limit).all()
        return [
            {
                "id": alert.id,
                "timestamp": alert.timestamp,
                "metric_type": alert.metric_type,
                "value": alert.value,
                "threshold": alert.threshold,
                "severity": alert.alert_severity
            }
            for alert in alerts
        ]

    def clear_alerts(self, alert_ids: List[int]) -> bool:
        """Clear specified alerts."""
        try:
            self.db.query(PerformanceMetrics).filter(
                PerformanceMetrics.id.in_(alert_ids)
            ).update(
                {"alert_triggered": False},
                synchronize_session=False
            )
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

    def check_thresholds(self, metrics: PerformanceMetrics) -> Optional[Dict]:
        """Check if metrics exceed defined thresholds."""
        thresholds = {
            "cpu_usage": 90,  # 90% CPU usage
            "memory_usage": 85,  # 85% memory usage
            "latency": 1000,  # 1000ms latency
            "error_rate": 0.05  # 5% error rate
        }

        alerts = []

        if metrics.cpu_usage > thresholds["cpu_usage"]:
            alerts.append({
                "type": "cpu_usage",
                "value": metrics.cpu_usage,
                "threshold": thresholds["cpu_usage"],
                "severity": "high"
            })

        if metrics.memory_usage > thresholds["memory_usage"]:
            alerts.append({
                "type": "memory_usage",
                "value": metrics.memory_usage,
                "threshold": thresholds["memory_usage"],
                "severity": "high"
            })

        if metrics.latency > thresholds["latency"]:
            alerts.append({
                "type": "latency",
                "value": metrics.latency,
                "threshold": thresholds["latency"],
                "severity": "medium"
            })

        error_rate = metrics.error_count / metrics.request_count if metrics.request_count > 0 else 0
        if error_rate > thresholds["error_rate"]:
            alerts.append({
                "type": "error_rate",
                "value": error_rate,
                "threshold": thresholds["error_rate"],
                "severity": "high"
            })

        return alerts[0] if alerts else None
