#!/usr/bin/env bash
set -e

echo "🔧 Setting up audio-marker dev environment..."

# Install system dependencies (ffmpeg + audiowaveform)
sudo apt-get update -q
sudo apt-get install -y --no-install-recommends ffmpeg software-properties-common

echo "📦 Installing audiowaveform..."
sudo add-apt-repository -y ppa:chris-needham/ppa
sudo apt-get update -q
sudo apt-get install -y --no-install-recommends audiowaveform

# Install Node dependencies
echo "📦 Installing npm dependencies..."
npm install

# Copy .env if it doesn't exist yet
if [ ! -f .env ]; then
  echo "📄 Copying .env.example to .env..."
  cp .env.example .env
fi

# Generate Prisma client and apply migrations
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma migrate deploy

echo "✅ Setup complete! Run 'npm run dev' to start the dev server."
