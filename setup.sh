#!/bin/bash

set -e

echo "🚀 Setting up Company Info Finder Project..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration (especially GOOGLE_PLACES_API_KEY and SECRET_KEY)"
fi

# Setup backend
echo "📦 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Setup frontend
echo "📦 Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi
cd ..

echo "✅ Setup complete!"
echo ""
echo "To run the project:"
echo "  - Local development: ./run.sh"
echo "  - Docker: docker-compose up"
echo ""
echo "Don't forget to:"
echo "  1. Edit .env file with your Google Places API key"
echo "  2. Set a strong SECRET_KEY in .env"

