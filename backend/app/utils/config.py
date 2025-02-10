"""Configuration utility functions."""

import os
import json
from typing import Any, Dict, Optional, Union
from pathlib import Path
import yaml
from dotenv import load_dotenv

def load_config(config_path: Union[str, Path]) -> Dict[str, Any]:
    """Load configuration from a file."""
    config_path = Path(config_path)

    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    if config_path.suffix == '.json':
        with open(config_path) as f:
            return json.load(f)
    elif config_path.suffix in ['.yaml', '.yml']:
        with open(config_path) as f:
            return yaml.safe_load(f)
    else:
        raise ValueError(f"Unsupported config file format: {config_path.suffix}")

def merge_configs(*configs: Dict[str, Any]) -> Dict[str, Any]:
    """Merge multiple configuration dictionaries."""
    merged = {}
    for config in configs:
        _deep_merge(merged, config)
    return merged

def _deep_merge(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> None:
    """Deep merge two dictionaries."""
    for key, value in dict2.items():
        if key in dict1 and isinstance(dict1[key], dict) and isinstance(value, dict):
            _deep_merge(dict1[key], value)
        else:
            dict1[key] = value

def load_env_vars(env_file: Optional[Union[str, Path]] = None) -> Dict[str, str]:
    """Load environment variables from .env file."""
    if env_file:
        load_dotenv(env_file)
    return dict(os.environ)

def get_env_var(key: str, default: Any = None, required: bool = False) -> Any:
    """Get environment variable with optional default value."""
    value = os.getenv(key, default)
    if required and value is None:
        raise ValueError(f"Required environment variable not set: {key}")
    return value

def parse_bool_env_var(key: str, default: bool = False) -> bool:
    """Parse boolean environment variable."""
    value = os.getenv(key, str(default)).lower()
    return value in ['true', '1', 'yes', 'y', 'on']

def parse_list_env_var(key: str, separator: str = ',', default: Optional[list] = None) -> list:
    """Parse list environment variable."""
    value = os.getenv(key)
    if value is None:
        return default if default is not None else []
    return [item.strip() for item in value.split(separator)]

def parse_dict_env_var(key: str, separator: str = ',',
                      key_value_separator: str = '=',
                      default: Optional[dict] = None) -> dict:
    """Parse dictionary environment variable."""
    value = os.getenv(key)
    if value is None:
        return default if default is not None else {}

    result = {}
    pairs = value.split(separator)
    for pair in pairs:
        if key_value_separator in pair:
            k, v = pair.split(key_value_separator, 1)
            result[k.strip()] = v.strip()
    return result

def validate_config(config: Dict[str, Any], required_fields: Dict[str, type]) -> None:
    """Validate configuration against required fields."""
    for field, field_type in required_fields.items():
        if field not in config:
            raise ValueError(f"Missing required config field: {field}")
        if not isinstance(config[field], field_type):
            raise TypeError(f"Invalid type for config field {field}. "
                          f"Expected {field_type.__name__}, got {type(config[field]).__name__}")

def save_config(config: Dict[str, Any], config_path: Union[str, Path],
                format: str = 'json', indent: int = 2) -> None:
    """Save configuration to a file."""
    config_path = Path(config_path)

    # Create directory if it doesn't exist
    config_path.parent.mkdir(parents=True, exist_ok=True)

    if format == 'json':
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=indent)
    elif format == 'yaml':
        with open(config_path, 'w') as f:
            yaml.dump(config, f, indent=indent)
    else:
        raise ValueError(f"Unsupported config format: {format}")

def get_config_value(config: Dict[str, Any], path: str, default: Any = None) -> Any:
    """Get a value from nested configuration using dot notation."""
    keys = path.split('.')
    current = config

    for key in keys:
        if isinstance(current, dict):
            current = current.get(key, default)
        else:
            return default

    return current

def set_config_value(config: Dict[str, Any], path: str, value: Any) -> None:
    """Set a value in nested configuration using dot notation."""
    keys = path.split('.')
    current = config

    for key in keys[:-1]:
        if key not in current:
            current[key] = {}
        current = current[key]

    current[keys[-1]] = value

def flatten_config(config: Dict[str, Any], separator: str = '.') -> Dict[str, Any]:
    """Flatten nested configuration into single level dictionary."""
    flattened = {}

    def _flatten(current: Dict[str, Any], prefix: str = ''):
        for key, value in current.items():
            new_key = f"{prefix}{separator}{key}" if prefix else key
            if isinstance(value, dict):
                _flatten(value, new_key)
            else:
                flattened[new_key] = value

    _flatten(config)
    return flattened
