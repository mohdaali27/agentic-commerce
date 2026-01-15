#!/bin/bash

# Setup Chat Widget

set -e

echo "🎨 Setting up Chat Widget"
echo "========================="
echo ""

# Navigate to web-src
cd web-src

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Dependencies installed"
echo ""

# Build widget
echo "🔨 Building widget..."
npm run build

echo "✅ Widget built successfully"
echo ""

# Test file info
echo "📝 Test page created: web-src/test.html"
echo ""

echo "========================="
echo "✅ Widget Setup Complete!"
echo "========================="
echo ""
echo "To test the widget:"
echo ""
echo "Option 1: Direct HTML test"
echo "  1. Make sure App Builder is running: aio app run"
echo "  2. Open web-src/test.html in your browser"
echo ""
echo "Option 2: With a local server"
echo "  1. cd web-src"
echo "  2. npx serve ."
echo "  3. Open http://localhost:3000/test.html"
echo ""