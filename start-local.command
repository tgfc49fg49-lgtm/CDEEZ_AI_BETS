#!/usr/bin/env zsh
set +e

cd "$(dirname "$0")"

LOG_FILE="$PWD/local-start.log"
PORTS=(3006 3005 3000 3010 5173 8080)

exec > >(tee "$LOG_FILE") 2>&1

echo "Starting Cdeez AI Bets..."
echo "Project: $PWD"
echo "Log: $LOG_FILE"
echo ""

run_next() {
  local node_path="$1"

  for port in "${PORTS[@]}"; do
    echo ""
    echo "Trying port $port ..."

    if [ -n "$node_path" ]; then
      PATH="$(dirname "$node_path"):$PATH" ./node_modules/.bin/next dev --hostname 0.0.0.0 --port "$port"
    else
      ./node_modules/.bin/next dev --hostname 0.0.0.0 --port "$port"
    fi

    status=$?
    echo "Server stopped or failed on port $port with exit code $status."
  done
}

if command -v npm >/dev/null 2>&1; then
  echo "Found npm: $(command -v npm)"
  echo "Node version: $(node --version 2>/dev/null)"
  echo "npm version: $(npm --version 2>/dev/null)"

  if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
      echo "npm install failed."
      echo "Check the error above, then send me this log file:"
      echo "$LOG_FILE"
      read "?Press Enter to close..."
      exit 1
    fi
  fi

  run_next ""
fi

BUNDLED_NODE="${BUNDLED_NODE:-}"

if [ -x "$BUNDLED_NODE" ] && [ -x "./node_modules/.bin/next" ]; then
  echo "npm was not found, using bundled Node runtime."
  echo "Node version: $($BUNDLED_NODE --version)"
  run_next "$BUNDLED_NODE"
fi

echo ""
echo "Could not get the server running."
echo "Send me this log file and I can see the exact failure:"
echo "$LOG_FILE"
read "?Press Enter to close..."
