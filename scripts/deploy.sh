#!/bin/bash
# Homy Deployment Script for Ubuntu

set -e

echo "=== Homy Deployment ==="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "Don't run as root. Run as regular user."
  exit 1
fi

# Install Node.js 20+ if not installed
if ! command -v node &> /dev/null; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Install build tools for node-pty
echo "Installing build dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential python3

# Install Claude CLI if not installed
if ! command -v claude &> /dev/null; then
  echo "Installing Claude CLI..."
  npm install -g @anthropic-ai/claude-code
  echo "Run 'claude' once to authenticate before starting Homy"
fi

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Build Next.js
echo "Building Next.js..."
npm run build

# Compile server.ts
echo "Compiling server..."
npx tsc --project tsconfig.server.json

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "To start Homy:"
echo "  npm run start:prod"
echo ""
echo "To run as service:"
echo "  sudo cp scripts/homly.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable homly"
echo "  sudo systemctl start homly"
echo ""
