# Harmonic Universe Troubleshooting Guide

## Diagnosing Common Issues

### 1. Blank Pages / 0-Byte Responses

**Symptoms:**

- Browser shows a blank page
- Response has 200 status code but 0 bytes
- Console shows no errors

**Troubleshooting Steps:**

1. Check static file contents:

   ```bash
   ls -la static/
   cat static/index.html | wc -c
   ```

2. Verify the content is properly served:

   ```bash
   curl -v http://localhost:10000/
   ```

3. Check application logs:

   ```bash
   tail -f logs/app.log
   ```

4. Verify Flask is properly serving static files:

   ```python
   # Add debug logging to app.py
   @app.route('/')
   def index():
       app.logger.debug(f"Serving index.html from {os.path.join(app.static_folder, 'index.html')}")
       # Rest of your code
   ```

5. Emergency fix:
   ```bash
   ./fix.sh
   ```

### 2. Database Connection Issues

**Symptoms:**

- Error logs show database connection failures
- Health check endpoint reports database issues
- Application works intermittently

**Troubleshooting Steps:**

1. Verify database connection string:

   ```bash
   printenv DATABASE_URL
   ```

2. Check if database is reachable:

   ```bash
   pg_isready -h hostname -p port
   ```

3. Test database connection:

   ```bash
   psql -h hostname -p port -U username -d dbname -c "SELECT 1"
   ```

4. Check connection pool settings:

   ```bash
   grep -r "pool_size" .
   ```

5. Restart the application:
   ```bash
   supervisorctl restart harmonic-universe
   ```

### 3. Memory Issues

**Symptoms:**

- Application crashes under load
- Error logs show "MemoryError" or "Killed"
- Health check shows high memory usage

**Troubleshooting Steps:**

1. Check memory usage:

   ```bash
   free -h
   ps aux | grep python
   ```

2. Look for memory leaks:

   ```bash
   pip install memory-profiler
   # Add to your app.py
   from memory_profiler import profile
   @profile
   def problematic_function():
       # Function code
   ```

3. Adjust Gunicorn worker settings:

   ```bash
   # Reduce number of workers
   vi gunicorn.conf.py
   # Change workers = 2
   ```

4. Restart the application:
   ```bash
   supervisorctl restart harmonic-universe
   ```

### 4. Slow Response Times

**Symptoms:**

- Pages take a long time to load
- API endpoints are slow to respond
- Monitoring shows high response times

**Troubleshooting Steps:**

1. Check CPU usage:

   ```bash
   top
   ```

2. Look for slow database queries:

   ```bash
   # Add to your PostgreSQL config
   log_min_duration_statement = 200  # Log queries taking more than 200ms
   ```

3. Check application logs for slow operations:

   ```bash
   grep "took longer than" logs/app.log
   ```

4. Enable profiling:

   ```bash
   pip install werkzeug-profiler
   # Add to your app.py
   from werkzeug.middleware.profiler import ProfilerMiddleware
   app.wsgi_app = ProfilerMiddleware(app.wsgi_app, restrictions=[30])
   ```

5. Optimize database queries and add caching as needed.

## Emergency Recovery Procedures

### 1. Rollback to Last Known Good Version

```bash
cd /opt/deployments
./rollback.sh
```

### 2. Emergency Database Recovery

```bash
# Restore from the latest backup
./restore_db.sh $(ls -t /opt/backups/harmonic-universe/db_backup_*.sql.gz | head -1)
```

### 3. Quick Fix for Static Files

```bash
# Copy emergency static files
cp -r /opt/backups/static-emergency/* static/
# Restart the application
supervisorctl restart harmonic-universe
```

## Contact Information

- **Primary DevOps Contact**: devops@example.com (555-123-4567)
- **Database Administrator**: dba@example.com (555-123-4568)
- **Application Developer**: dev@example.com (555-123-4569)
