#!/bin/bash
# ===========================================
# Post-Start Script
# Runs every time the container starts
# ===========================================

set -e

echo "🔄 Starting development services..."

# Wait for database
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U webstudio 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Wait for PostgREST
echo "⏳ Waiting for PostgREST..."
until curl -s http://postgrest:3000/ > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgREST is ready"

echo ""
echo "🎉 All services are ready!"
echo ""
echo "🚀 To start development:"
echo "   Webstudio:  cd /workspace/autobuilder-suite/builder/webstudio && pnpm dev"
echo "   Strapi:     cd /workspace/cms && npm run develop"
echo ""
echo "🌐 URLs:"
echo "   Webstudio Builder: http://localhost:5173"
echo "   Strapi CMS:        http://localhost:1337"
echo "   PostgREST API:     http://localhost:3000"
echo ""
