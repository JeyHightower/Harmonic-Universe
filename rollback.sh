#!/bin/bash
set -e

echo "=== Starting Rollback Process ==="

# Get the current deployment
CURRENT_DEPLOYMENT=$(readlink -f current)
echo "Current deployment: $CURRENT_DEPLOYMENT"

# Get previous deployments
DEPLOYMENTS=($(ls -d deploy_* | sort -r))
echo "Available deployments:"
for i in "${!DEPLOYMENTS[@]}"; do
    echo "$i: ${DEPLOYMENTS[$i]}"
done

# Determine the previous deployment
PREV_INDEX=0
for i in "${!DEPLOYMENTS[@]}"; do
    if [ "$(readlink -f ${DEPLOYMENTS[$i]})" == "$CURRENT_DEPLOYMENT" ]; then
        PREV_INDEX=$((i+1))
        break
    fi
done

if [ $PREV_INDEX -ge ${#DEPLOYMENTS[@]} ]; then
    echo "No previous deployment found!"
    exit 1
fi

PREV_DEPLOYMENT=${DEPLOYMENTS[$PREV_INDEX]}
echo "Rolling back to previous deployment: $PREV_DEPLOYMENT"

# Update the symlink
echo "Updating symlink..."
ln -sfn $PREV_DEPLOYMENT current

# Restart the application
echo "Restarting application..."
if command -v supervisorctl &> /dev/null; then
    supervisorctl restart harmonic-universe
else
    cd current
    kill $(cat app.pid) 2>/dev/null || true
    nohup gunicorn wsgi:app --config=gunicorn.conf.py > app.log 2>&1 &
fi

# Verify rollback
echo "Verifying rollback..."
sleep 5
if curl -s http://localhost:10000/api/health | grep -q '"status":"ok"'; then
    echo "Rollback successful!"
else
    echo "Rollback verification failed!"
    echo "Check logs for errors:"
    cat current/logs/error.log | tail -20
    exit 1
fi

echo "=== Rollback Complete ==="
