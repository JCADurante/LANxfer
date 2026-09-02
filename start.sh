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

echo "[*] Using Node runtime: $NODE_BIN"
echo "[*] Initializing LAN File Transfer Server..."
echo ""

mkdir -p "$DIR/uploads"
export NODE_ENV=production
export PORT="${PORT:-3000}"

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

exec "$NODE_BIN" "$DIR/dist/server.cjs"
