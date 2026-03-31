#!/usr/bin/env bash
set -e

echo "🔧 Setting up audio-marker dev environment..."

# Install system dependencies
sudo apt-get update -q
sudo apt-get install -y --no-install-recommends ffmpeg wget

echo "📦 Installing audiowaveform..."
AUDIOWAVEFORM_VERSION="1.10.2"
ARCH=$(dpkg --print-architecture)
# Detect Debian major version (e.g. 13 for trixie)
DEBIAN_VERSION=$(. /etc/os-release && echo "$VERSION_ID")
wget -q -O /tmp/audiowaveform.deb \
  "https://github.com/bbc/audiowaveform/releases/download/${AUDIOWAVEFORM_VERSION}/audiowaveform_${AUDIOWAVEFORM_VERSION}-1-${DEBIAN_VERSION}_${ARCH}.deb"
sudo dpkg -i /tmp/audiowaveform.deb || sudo apt-get install -f -y
rm -f /tmp/audiowaveform.deb

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm

# Install Node dependencies
echo "📦 Installing pnpm dependencies..."
pnpm install

# Copy .env if it doesn't exist yet
if [ ! -f .env ]; then
  echo "📄 Copying .env.example to .env..."
  cp .env.example .env
fi

# Generate Prisma client and apply migrations
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma migrate deploy

echo "✅ Setup complete! Run 'pnpm dev' to start the dev server."
