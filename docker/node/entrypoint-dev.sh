#!/bin/sh
set -e

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules)" ]; then
    echo "Installing dependencies (npm ci)..."
    npm ci --no-audit --no-fund
fi

exec "$@"
