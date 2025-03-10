#!/bin/bash
# Database connection test script with fallbacks

set -e
echo "Testing database connection..."

# Set up environment for PostgreSQL client
export PGCONNECT_TIMEOUT=10
export PGSSLMODE=require

# Parse DATABASE_URL to get connection details
if [[ -z "$DATABASE_URL" ]]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

# Extract connection details
DB_URL=${DATABASE_URL#*//}
DB_AUTH=${DB_URL%%@*}
DB_USER=${DB_AUTH%%:*}
DB_PASS=${DB_AUTH#*:}
DB_HOST_PORT_DB=${DB_URL#*@}
DB_HOST_PORT=${DB_HOST_PORT_DB%%/*}
DB_HOST=${DB_HOST_PORT%%:*}
DB_PORT=${DB_HOST_PORT#*:}
DB_NAME=${DB_HOST_PORT_DB#*/}

echo "Attempting connection to PostgreSQL database..."
echo "Host: $DB_HOST, Port: $DB_PORT, User: $DB_USER, Database: $DB_NAME"

# Try direct connection with psql
if command -v psql &> /dev/null; then
    echo "Trying psql connection..."
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
        echo "psql connection successful!"
        exit 0
    else
        echo "psql connection failed"
    fi
fi

# Try with Python fallback methods
echo "Trying Python fallback connections..."
python -c "
import sys
try:
    import psycopg2
    print(f'Using psycopg2 version: {psycopg2.__version__}')
    conn = psycopg2.connect('$DATABASE_URL')
    cur = conn.cursor()
    cur.execute('SELECT 1')
    print('psycopg2 connection successful!')
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f'psycopg2 connection failed: {e}')

try:
    import pg8000.native
    print('Trying pg8000...')
    conn = pg8000.native.Connection(
        user='$DB_USER',
        password='$DB_PASS',
        host='$DB_HOST',
        port=$DB_PORT,
        database='$DB_NAME'
    )
    cur = conn.cursor()
    cur.execute('SELECT 1')
    print('pg8000 connection successful!')
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f'pg8000 connection failed: {e}')

print('All connection attempts failed')
sys.exit(1)
"

# Check the exit code from the Python script
if [ $? -eq 0 ]; then
    echo "Database connection established"
    exit 0
else
    echo "All database connection attempts failed"
    exit 1
fi
