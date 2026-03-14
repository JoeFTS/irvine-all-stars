#!/usr/bin/env bash
set -a
source /var/www/irvineallstars/.env.local 2>/dev/null || true
set +a
PORT=3005 exec node /var/www/irvineallstars/.next/standalone/server.js
