import multiprocessing

# Gunicorn configuration file
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "harmonic_universe"

# SSL (if needed)
# keyfile = "/etc/ssl/private/your-ssl.key"
# certfile = "/etc/ssl/certs/your-ssl.crt"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
