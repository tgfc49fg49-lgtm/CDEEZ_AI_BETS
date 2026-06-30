#!/bin/zsh

PROJECT_DIR="/Users/cylerd/Documents/Codex/2026-06-17/agents-md-project-sports-betting-analytics"
NODE_BIN="/Users/cylerd/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
LOG_FILE="$PROJECT_DIR/local-start.log"

cd "$PROJECT_DIR" || exit 1

export PATH="$NODE_BIN:$PATH"
export PORT=3011
export HOST=127.0.0.1

{
  echo "Starting Cdeez AI Bets..."
  echo "Project: $PROJECT_DIR"
  echo "Local link: http://127.0.0.1:3011/"
  echo ""

  if [ ! -d node_modules ]; then
    echo "Installing app dependencies..."
    npm install || exit 1
  fi

  echo "Clearing old local build files..."
  /bin/rm -rf .next .next-dev

  echo ""
  echo "Ready. Open this link after the app says ready:"
  echo "http://127.0.0.1:3011/"
  echo ""

  ./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3011
} 2>&1 | tee "$LOG_FILE"

echo ""
echo "The local server stopped."
echo "If this failed, send Codex this file:"
echo "$LOG_FILE"
read "?Press Enter to close..."
