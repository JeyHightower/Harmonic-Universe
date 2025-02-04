from pydantic_settings import BaseSettings
from typing import Dict, Any

class WebSocketSettings(BaseSettings):
    """WebSocket-specific settings."""
    # Rate limiting
    RATE_LIMIT: int = 100  # messages per minute
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # Connection limits
    MAX_CONNECTIONS: int = 10000
    MAX_CONNECTIONS_PER_IP: int = 100
    MAX_ROOMS_PER_CLIENT: int = 50
    MAX_MESSAGE_SIZE: int = 1024 * 1024  # 1MB

    # Timeouts
    HEARTBEAT_INTERVAL: int = 30  # seconds
    CONNECTION_TIMEOUT: int = 60  # seconds
    RECONNECT_WINDOW: int = 300  # seconds

    # Performance thresholds
    PERFORMANCE_THRESHOLDS: Dict[str, Dict[str, int]] = {
        'LATENCY': {
            'WARNING': 100,  # ms
            'CRITICAL': 300  # ms
        },
        'MESSAGE_RATE': {
            'WARNING': 500,  # messages per minute
            'CRITICAL': 1000
        },
        'ERROR_RATE': {
            'WARNING': 5,    # errors per minute
            'CRITICAL': 15
        },
        'RECONNECT_RATE': {
            'WARNING': 3,    # reconnects per minute
            'CRITICAL': 10
        }
    }

    # State recovery
    ENABLE_STATE_RECOVERY: bool = True
    STATE_CACHE_SIZE: int = 1000
    STATE_CACHE_TTL: int = 3600  # seconds

    class Config:
        case_sensitive = True

# Create settings instance
settings = WebSocketSettings()
