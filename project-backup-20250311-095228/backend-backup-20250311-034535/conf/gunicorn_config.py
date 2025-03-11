# Gunicorn configuration for Harmonic Universe

# Binding
bind = "127.0.0.1:8000"  # Only listen locally - Nginx will proxy to this

# Worker Processes
workers = 3  # Rule of thumb: (2 x CPU cores) + 1
worker_class = "sync"
threads = 2
timeout = 60

# Logging
accesslog = "/var/log/harmonic-universe/gunicorn-access.log"
errorlog = "/var/log/harmonic-universe/gunicorn-error.log"
loglevel = "info"
capture_output = True
enable_stdio_inheritance = True

# Process Naming
proc_name = "harmonic_backend"

# Server Mechanics
daemon = False  # We'll use systemd to manage as a daemon

# Django specific settings
django_settings = "backend.settings"  # Adjust to your actual settings module
