# Docker Setup for Frontend

## Current Temporary Setup

The frontend service in Docker is currently running a simple HTTP server instead of the full Vite development environment due to memory/stability issues encountered with esbuild in the Docker container.

### What's Working

- A basic HTTP server running on port 5173 that serves a placeholder page
- Connectivity between frontend and backend services
- Docker container stability

### Original Issue

When trying to run the full Vite development server in Docker, the following issues were encountered:

1. Missing dependencies (particularly `@vitejs/plugin-react`)
2. Memory exhaustion in the container (exiting with code 137)
3. esbuild service errors: `Error: The service was stopped: write EPIPE`

## How to Restore Full Development Environment

To restore the full Vite development environment when the issues are resolved, follow these steps:

1. Edit the `frontend/start.sh` script to use the full Vite setup:

```sh
#!/bin/sh
set -e

echo "Installing pnpm..."
npm install -g pnpm

echo "Configuring Node options to use more memory..."
export NODE_OPTIONS="--max_old_space_size=2048"

echo "Installing dependencies..."
pnpm install

echo "Starting Vite development server..."
exec pnpm run dev
```

2. Update the `docker-compose.yml` file to allocate more memory to the frontend container:

```yaml
frontend:
  image: node:18-alpine
  ports:
    - '5173:5173'
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules
  environment:
    - NODE_ENV=development
    - VITE_API_URL=http://localhost:5001
    - HOST=0.0.0.0
  depends_on:
    - backend
  working_dir: /app
  command: ./start.sh
  mem_limit: 2G
  restart: on-failure
```

3. Restart the Docker services:

```
docker-compose down && docker-compose up -d
```

## Troubleshooting

If you continue to experience issues with the Vite development server in Docker:

1. Try running the frontend directly on your host machine outside of Docker
2. Consider using a production build in Docker instead of a development server
3. Increase the memory allocation if needed
4. Simplify the build process by minimizing plugins and optimizations in `vite.config.js`
