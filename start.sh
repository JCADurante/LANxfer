#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================"
echo "      PORTABLE LAN FILE TRANSFER - SERVER LAUNCHER"
echo "========================================================"
echo ""

NODE_BIN=""
if [ -x "$DIR/node" ]; then
  NODE_BIN="$DIR/node"
elif [ -x "$DIR/bin/node" ]; then
  NODE_BIN="$DIR/bin/node"
elif [ -x "$DIR/nodejs/bin/node" ]; then
  NODE_BIN="$DIR/nodejs/bin/node"
elif [ -x "$DIR/../node" ]; then
  NODE_BIN="$DIR/../node"
elif [ -x "$DIR/../bin/node" ]; then
  NODE_BIN="$DIR/../bin/node"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
  echo "[*] Found system Node.js: $NODE_BIN"
fi

if [ -z "$NODE_BIN" ]; then
  echo ""
  echo "========================================================"
  echo " [!] ERROR: Portable Node.js binary ('node') not found!"
  echo "========================================================"
  echo ""
  echo " To run this portable application:"
  echo " 1. Place your portable 'node' binary into this folder:"
  echo "    $DIR/node"
  echo "    or in $DIR/bin/node"
  echo " 2. Ensure execution permissions: chmod +x start.sh node"
  echo " 3. Run ./start.sh again!"
  echo ""
  echo "========================================================"
  exit 1
fi

if [ ! -f "$DIR/dist/server.cjs" ]; then
  echo ""
  echo "[!] ERROR: Compiled server bundle not found at dist/server.cjs!"
  echo "    Run 'npm run build' first if you are building from source."
  echo ""
  exit 1
fi

# Determine custom port from saved config, args or environment variable
APP_PORT=""
if [ -f "$DIR/port.conf" ]; then
  APP_PORT=$(cat "$DIR/port.conf" | tr -d '[:space:]')
fi
if [ -z "$APP_PORT" ] && [ -f "$DIR/uploads/_port.conf" ]; then
  APP_PORT=$(cat "$DIR/uploads/_port.conf" | tr -d '[:space:]')
fi
if [ -z "$APP_PORT" ]; then
  APP_PORT="${PORT:-3000}"
fi

if [ "$1" = "--port" ] || [ "$1" = "-p" ]; then
  if [ -n "$2" ]; then
    APP_PORT="$2"
  fi
elif [ -n "$1" ] && [ "$1" != "run" ]; then
  APP_PORT="$1"
fi

export NODE_ENV=production
export PORT="$APP_PORT"

echo "[*] Using Node runtime: $NODE_BIN"
echo "[*] Localhost Port Selected: $PORT"
echo "[*] (Tip: To use another port like 8080, run: ./start.sh 8080 or PORT=8080 ./start.sh)"
echo "[*] Initializing LAN File Transfer Server..."
echo ""

mkdir -p "$DIR/uploads"

# Auto-open browser in background if available
(sleep 2 && {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:${PORT}" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "http://localhost:${PORT}" >/dev/null 2>&1 &
  fi
}) >/dev/null 2>&1 &

echo "[*] Server running at http://localhost:${PORT}"
echo "[*] Press Ctrl+C to stop."
echo ""

exec "$NODE_BIN" "$DIR/dist/server.cjs" --port "$PORT"
