#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying Book Collection App..."

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

# Wait for postgres using docker compose exec instead
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U ${DB_USER} -d ${DB_NAME} >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  echo "Waiting for database... ($i/30)"
  sleep 2
done

echo "🗄️ Running database migrations..."
docker compose run --rm \
  -e DATABASE_URL="${DATABASE_URL}" \
  backend \
  sh -c "npx prisma migrate deploy || npx prisma db push --skip-generate --accept-data-loss"

echo "▶️ Starting all services..."
docker compose up -d

echo "⏳ Waiting for services..."
sleep 5

echo "📋 Service status:"
docker compose ps

echo "✅ Deployment complete!"
echo "View logs: docker compose logs -f backend"
