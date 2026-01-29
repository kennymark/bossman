#!/usr/bin/env bash
set -euo pipefail

echo "Setting up environment variables..."
cp .env.example .env
echo "Created .env file from .env.example"

echo "Generating app key..."
node ace generate:key

echo "Making temp folder"
mkdir -p tmp
touch tmp/db.sqlite3
echo "Created temp/db.sqlite3 file"

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
node ace migration:run

echo "Seeding database..."
node ace db:seed

echo "Setup complete."


