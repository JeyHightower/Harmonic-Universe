"""Utility functions package."""

from .common import (
    random_string,
    random_email,
    format_datetime,
    parse_datetime,
    assert_dates_equal,
    dict_exclude,
    safe_divide,
    truncate_string,
    flatten_dict
)

from .validation import (
    is_valid_email,
    is_valid_password,
    is_valid_username,
    validate_date_range,
    validate_required_fields,
    validate_field_length,
    validate_numeric_range
)

from .file_handling import (
    get_file_mime_type,
    get_file_hash,
    ensure_directory,
    safe_filename,
    get_file_size,
    create_temp_copy,
    delete_file_safely,
    list_files_with_extension,
    get_relative_path,
    move_file_safely,
    backup_file,
    clean_temp_files
)

from .db import (
    create_db_item,
    update_db_item,
    delete_db_item,
    get_db_item,
    get_db_items,
    get_db_items_by_field,
    execute_raw_sql,
    bulk_create_db_items,
    bulk_update_db_items,
    get_or_create_db_item,
    soft_delete_db_item,
    restore_soft_deleted_item
)

from .security import (
    verify_password,
    get_password_hash,
    generate_token,
    generate_api_key,
    create_jwt_token,
    verify_jwt_token,
    generate_secure_password,
    sanitize_input,
    encrypt_data,
    decrypt_data,
    generate_encryption_key,
    hash_data,
    constant_time_compare,
    generate_nonce,
    mask_sensitive_data
)

from .logging import (
    setup_logger,
    log_exception,
    rotate_logs,
    log_to_json,
    log_performance,
    sanitize_log_data,
    create_audit_log,
    log_request,
    setup_error_email_handler
)

from .error_handling import (
    ErrorSeverity,
    ErrorCategory,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    handle_exceptions,
    validate_or_raise,
    format_error_response,
    aggregate_errors,
    safe_execute,
    retry_on_error
)

from .config import (
    load_config,
    merge_configs,
    load_env_vars,
    get_env_var,
    parse_bool_env_var,
    parse_list_env_var,
    parse_dict_env_var,
    validate_config,
    save_config,
    get_config_value,
    set_config_value,
    flatten_config
)

from .caching import (
    Cache,
    FileCache,
    cache_key,
    memoize,
    cache_result
)

from .rate_limiting import (
    RateLimit,
    RateLimitExceeded,
    RateLimiter,
    TokenBucket,
    SlidingWindowRateLimiter,
    rate_limit,
    ip_rate_limit
)

from .monitoring import (
    RequestMetrics,
    ResourceMetrics,
    PerformanceMonitor,
    monitor_performance,
    log_slow_requests
)

from .testing import (
    random_string as test_random_string,
    random_email as test_random_email,
    random_password as test_random_password,
    random_phone,
    random_date,
    mock_datetime,
    create_test_db,
    drop_test_db,
    MockResponse,
    TestClient,
    assert_json_response,
    assert_error_response,
    TestLogger
)

__all__ = [
    # Common utilities
    'random_string', 'random_email', 'format_datetime', 'parse_datetime',
    'assert_dates_equal', 'dict_exclude', 'safe_divide', 'truncate_string',
    'flatten_dict',

    # Validation utilities
    'is_valid_email', 'is_valid_password', 'is_valid_username',
    'validate_date_range', 'validate_required_fields', 'validate_field_length',
    'validate_numeric_range',

    # File handling utilities
    'get_file_mime_type', 'get_file_hash', 'ensure_directory', 'safe_filename',
    'get_file_size', 'create_temp_copy', 'delete_file_safely',
    'list_files_with_extension', 'get_relative_path', 'move_file_safely',
    'backup_file', 'clean_temp_files',

    # Database utilities
    'create_db_item', 'update_db_item', 'delete_db_item', 'get_db_item',
    'get_db_items', 'get_db_items_by_field', 'execute_raw_sql',
    'bulk_create_db_items', 'bulk_update_db_items', 'get_or_create_db_item',
    'soft_delete_db_item', 'restore_soft_deleted_item',

    # Security utilities
    'verify_password', 'get_password_hash', 'generate_token', 'generate_api_key',
    'create_jwt_token', 'verify_jwt_token', 'generate_secure_password',
    'sanitize_input', 'encrypt_data', 'decrypt_data', 'generate_encryption_key',
    'hash_data', 'constant_time_compare', 'generate_nonce', 'mask_sensitive_data',

    # Logging utilities
    'setup_logger', 'log_exception', 'rotate_logs', 'log_to_json',
    'log_performance', 'sanitize_log_data', 'create_audit_log', 'log_request',
    'setup_error_email_handler',

    # Error handling utilities
    'ErrorSeverity', 'ErrorCategory', 'AppError', 'ValidationError',
    'AuthenticationError', 'AuthorizationError', 'DatabaseError',
    'handle_exceptions', 'validate_or_raise', 'format_error_response',
    'aggregate_errors', 'safe_execute', 'retry_on_error',

    # Configuration utilities
    'load_config', 'merge_configs', 'load_env_vars', 'get_env_var',
    'parse_bool_env_var', 'parse_list_env_var', 'parse_dict_env_var',
    'validate_config', 'save_config', 'get_config_value', 'set_config_value',
    'flatten_config',

    # Caching utilities
    'Cache', 'FileCache', 'cache_key', 'memoize', 'cache_result',

    # Rate limiting utilities
    'RateLimit', 'RateLimitExceeded', 'RateLimiter', 'TokenBucket',
    'SlidingWindowRateLimiter', 'rate_limit', 'ip_rate_limit',

    # Monitoring utilities
    'RequestMetrics', 'ResourceMetrics', 'PerformanceMonitor',
    'monitor_performance', 'log_slow_requests',

    # Testing utilities
    'test_random_string', 'test_random_email', 'test_random_password',
    'random_phone', 'random_date', 'mock_datetime', 'create_test_db',
    'drop_test_db', 'MockResponse', 'TestClient', 'assert_json_response',
    'assert_error_response', 'TestLogger'
]
