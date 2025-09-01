#!/bin/bash

echo "🚀 Starting local DynamoDB for workout tracker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start DynamoDB Local
echo "📦 Starting DynamoDB Local container..."
docker-compose up -d

# Wait for DynamoDB to be ready
echo "⏳ Waiting for DynamoDB to be ready..."
sleep 5

# Check if DynamoDB is responding
if curl -s http://localhost:8000/shell > /dev/null; then
    echo "✅ DynamoDB Local is running on http://localhost:8000"
    
    # Setup tables
    echo "🔧 Setting up DynamoDB tables..."
    npm run setup-dynamodb
    
    echo ""
    echo "🎉 Local DynamoDB is ready!"
    echo "   - Endpoint: http://localhost:8000"
    echo "   - Tables: workouts, users"
    echo ""
    echo "📝 Useful commands:"
    echo "   - View logs: npm run dynamodb:logs"
    echo "   - Stop: npm run dynamodb:stop"
    echo "   - Restart: npm run dynamodb:restart"
    echo ""
    echo "🌐 Test the connection: http://localhost:3000/api/test-dynamodb"
else
    echo "❌ DynamoDB Local failed to start properly"
    echo "📋 Check logs with: npm run dynamodb:logs"
    exit 1
fi
