#!/bin/bash

# Build Pre-check Script
# This script validates the build environment before deployment

set -e

echo "=== Build Pre-Check ==="
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "  Node.js: $NODE_VERSION"

# Check npm version
echo "✓ Checking npm version..."
NPM_VERSION=$(npm -v)
echo "  npm: $NPM_VERSION"

# Check if dependencies are installed
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "  Dependencies installed: YES"
else
  echo "  Dependencies installed: NO"
  echo "  Installing dependencies..."
  npm ci
fi

# Check if build files are present
echo "✓ Checking build configuration..."
if [ -f "vite.config.ts" ]; then
  echo "  vite.config.ts: FOUND"
else
  echo "  vite.config.ts: NOT FOUND"
  exit 1
fi

if [ -f "tsconfig.json" ]; then
  echo "  tsconfig.json: FOUND"
else
  echo "  tsconfig.json: NOT FOUND"
  exit 1
fi

# Check environment files
echo "✓ Checking environment files..."
if [ -f ".env.production" ]; then
  echo "  .env.production: FOUND"
else
  echo "  .env.production: NOT FOUND (optional)"
fi

echo ""
echo "=== Pre-Check Complete ==="
echo "Ready for build!"
