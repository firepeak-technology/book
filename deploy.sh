#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying Book Collection App..."

curl -O https://raw.githubusercontent.com/firepeak-technology/book/main/deploy.sh
curl -O https://raw.githubusercontent.com/firepeak-technology/book/main/docker-compose.yml


# Load environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

source .env

echo "📥 Pulling latest images..."
docker compose pull

echo "🛑 Stopping existing containers..."
docker compose down

echo "▶️ Starting PostgreSQL..."
docker compose up -d postgres

# Wait for postgres
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

echo "▶️ Starting all services..."
docker compose up -d

echo "⏳ Waiting for services..."
sleep 5

echo "📋 Service status:"
docker compose ps

echo "📊 Backend logs:"
docker compose logs --tail=30 backend

echo "✅ Deployment complete!"
echo "View logs: docker compose logs -f backend"
