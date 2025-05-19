#!/bin/bash
# Stop all running containers
docker-compose down

# Prune Docker resources (unused containers, networks, volumes)
docker system prune -f

# Remove node_modules and build directories
rm -rf frontend/node_modules frontend/dist
rm -rf backend/node_modules backend/dist

# Rebuild and restart containers with no cache
docker-compose build --no-cache
docker-compose up -d

# Follow logs to monitor startup
docker-compose logs -f
