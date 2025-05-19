#!/bin/sh
set -e

echo "Installing pnpm..."
npm install -g pnpm

echo "Configuring Node options to use optimized memory settings..."
export NODE_OPTIONS="--max_old_space_size=2048"

echo "Installing dependencies..."
pnpm install

echo "Starting Vite development server..."
exec pnpm run dev
