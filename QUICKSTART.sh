#!/bin/bash

# TeamAI Quick Start Script
# This script sets up and starts TeamAI locally

set -e

echo "================================"
echo "  TeamAI Quick Start Setup"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent
echo "✅ Dependencies installed"
echo ""

# Check .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  You need to configure .env with your API keys:"
    echo "   - ANTHROPIC_API_KEY (from anthropic.com)"
    echo "   - BREVO_API_KEY (from brevo.com)"
    echo "   - BREVO_LIST_ID (your Brevo contact list)"
    echo "   - BUSINESS_EMAIL (your business email)"
    echo ""
    echo "After configuring, run: npm run dev"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Check if API keys are configured
if grep -q "sk-ant-your-key\|xkeysib-your-key" .env; then
    echo "⚠️  API keys not configured yet!"
    echo ""
    echo "Please update .env with:"
    echo "  ANTHROPIC_API_KEY=sk-ant-xxxx"
    echo "  BREVO_API_KEY=xkeysib-xxxx"
    echo ""
else
    echo "✅ API keys appear to be configured"
    echo ""
    echo "🚀 Ready to start!"
    echo ""
    echo "Run one of:"
    echo "  npm run dev     (Development with auto-reload)"
    echo "  npm start       (Production mode)"
    echo ""
fi

echo "================================"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Full feature overview"
echo "  - INTEGRATION_GUIDE.md - Testing guide"
echo "  - ARCHITECTURE.md - Technical details"
echo ""
echo "🌐 Once running, visit: http://localhost:3001"
echo "💡 Need help? Check BUILD_COMPLETE.md"
echo ""
