#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
if [ "$NODE_ENV" = "production" ]; then
  node dist/main
else
  # Run both the application and proto watcher in development mode
  concurrently "npm run start:dev" "npm run proto:watch"
fi 