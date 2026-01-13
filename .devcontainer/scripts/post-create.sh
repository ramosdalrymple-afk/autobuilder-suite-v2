#!/bin/bash
# ===========================================
# Post-Create Script
# Runs after the container is first created
# ===========================================

set -e

echo "🚀 Setting up ABS Development Environment..."

# ===========================================
# Install Webstudio dependencies
# ===========================================
echo "📦 Installing Webstudio dependencies..."
cd /workspace/autobuilder-suite/builder/webstudio

# Configure pnpm
pnpm config set store-dir /home/node/.local/share/pnpm/store

# Install dependencies
pnpm install --frozen-lockfile || pnpm install

# ===========================================
# Setup Prisma
# ===========================================
echo "🗄️ Setting up Prisma..."
cd /workspace/autobuilder-suite/builder/webstudio

# Wait for database
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U webstudio; do
  sleep 2
done

# Generate Prisma client
pnpm --filter=@webstudio-is/prisma-client generate

# Run migrations
pnpm --filter=@webstudio-is/prisma-client db:push || true

# ===========================================
# Install CMS dependencies
# ===========================================
echo "📦 Installing Strapi CMS dependencies..."
cd /workspace/cms
npm install

# ===========================================
# Copy .env files if they don't exist
# ===========================================
echo "📝 Setting up environment files..."

# Webstudio .env
if [ ! -f /workspace/autobuilder-suite/builder/webstudio/apps/builder/.env ]; then
  cat > /workspace/autobuilder-suite/builder/webstudio/apps/builder/.env << 'EOF'
# Database
DATABASE_URL=postgresql://webstudio:password@postgres:5432/webstudio?schema=public
DIRECT_URL=postgresql://webstudio:password@postgres:5432/webstudio?schema=public

# PostgREST
POSTGREST_URL=http://postgrest:3000
POSTGREST_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTc2ODEyNDM2OSwiZXhwIjoxNzk5NjYwMzY5fQ.I4k6_w5D6XO6WFrdY1M3hsjkmtX8wLpjA8erjIAnSR0

# Auth
DEV_LOGIN=true
AUTH_SECRET=dev-secret-key

# System
NODE_ENV=development
MAX_ASSETS_PER_PROJECT=50

# Strapi Integration
STRAPI_URL=http://strapi:1337
STRAPI_API_TOKEN=
EOF
  echo "✅ Created Webstudio .env"
fi

# Strapi .env
if [ ! -f /workspace/cms/.env ]; then
  cat > /workspace/cms/.env << 'EOF'
HOST=0.0.0.0
PORT=1337
APP_KEYS="key1,key2,key3,key4"
API_TOKEN_SALT=dev-api-token-salt
ADMIN_JWT_SECRET=dev-admin-jwt-secret
TRANSFER_TOKEN_SALT=dev-transfer-salt
JWT_SECRET=dev-jwt-secret
EOF
  echo "✅ Created Strapi .env"
fi

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📋 Quick Commands:"
echo "   ws     - Go to Webstudio directory"
echo "   cms    - Go to CMS directory"
echo "   dev    - Run pnpm dev"
echo ""
