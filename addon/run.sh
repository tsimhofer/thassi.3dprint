#!/bin/sh
set -e
echo "[Thassi Sidebar Proxy] Starting 3D Druck (3d-print)..."
exec node --no-warnings /app/proxy.mjs
