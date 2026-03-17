#!/usr/bin/env bash
set -a
source /var/www/irvineallstars/.env.local 2>/dev/null || true
set +a

# Copy static assets into standalone output (required after each build)
cp -r /var/www/irvineallstars/.next/static /var/www/irvineallstars/.next/standalone/.next/static 2>/dev/null
cp -r /var/www/irvineallstars/public /var/www/irvineallstars/.next/standalone/public 2>/dev/null

PORT=3005 exec node /var/www/irvineallstars/.next/standalone/server.js
