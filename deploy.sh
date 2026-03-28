#!/bin/bash
set -e

echo "🚀 Deploying TC Wallet to DigitalOcean..."

# Ensure we have the latest code
git pull origin main

# Build and start services in the background using prod overrides
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run Prisma schema migration (deploy mode) inside the running app container
echo "🗄️ Running database migrations..."
docker compose exec app npx prisma@^5.22.0 migrate deploy

# Optionally seed the database (uncomment if needed on fresh deploy)
# echo "🌱 Seeding database..."
# docker compose exec app npm run seed

echo "✅ Deployment complete! App is running."
