#!/bin/bash

echo "🐳 AI Document Processing System - Docker Setup"
echo "================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed (try both old and new syntax)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    if [ -f env.docker ]; then
        cp env.docker .env
        echo "✅ .env file created. Please configure your OpenAI API key."
        echo "   Edit .env file and add your OPENAI_API_KEY"
    else
        echo "❌ env.docker template not found."
        exit 1
    fi
else
    echo "✅ .env file already exists."
fi

# Check if OpenAI API key is configured
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Warning: Please configure your OpenAI API key in .env file"
    echo "   Set OPENAI_API_KEY=your_actual_api_key"
fi

echo ""
echo "🚀 Ready to start the application!"
echo ""
echo "Choose your deployment option:"
echo ""
echo "1. Production (optimized, no hot reload):"
echo "   docker-compose up -d"
echo ""
echo "2. Development (with hot reload):"
echo "   docker-compose -f docker-compose.dev.yml up -d"
echo ""
echo "3. View logs:"
echo "   docker-compose logs -f app"
echo ""
echo "4. Stop services:"
echo "   docker-compose down"
echo ""
echo "📖 Access points:"
echo "   - API: http://localhost:3000"
echo "   - Swagger Docs: http://localhost:3000/api"
echo "   - Health Check: http://localhost:3000/health"
echo ""
echo "🎉 Happy coding!" 