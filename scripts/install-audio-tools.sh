#!/usr/bin/env bash

# Install audio processing tools (ffmpeg and audiowaveform) for local development
# This script detects the OS and installs the tools using the appropriate package manager

set -e

echo "🔊 Installing audio processing tools (ffmpeg and audiowaveform)..."

# Detect OS
OS="$(uname -s)"

case "$OS" in
    Linux*)
        # Detect Linux distribution
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            DISTRO=$ID
        else
            DISTRO="unknown"
        fi

        case "$DISTRO" in
            ubuntu|debian)
                echo "📦 Detected Debian/Ubuntu - installing ffmpeg via apt..."
                sudo apt-get update
                sudo apt-get install -y ffmpeg
                
                # audiowaveform needs to be built from source on Debian/Ubuntu
                if ! command -v audiowaveform &> /dev/null; then
                    echo "📦 Building audiowaveform from source..."
                    sudo apt-get install -y git make cmake gcc g++ libmad0-dev libid3tag0-dev libsndfile1-dev libgd-dev libboost-filesystem-dev libboost-program-options-dev libboost-regex-dev
                    
                    # Clone and build in /tmp
                    TEMP_DIR=$(mktemp -d)
                    ORIGINAL_DIR=$(pwd)
                    cd "$TEMP_DIR"
                    git clone https://github.com/bbc/audiowaveform.git
                    cd audiowaveform
                    git checkout master
                    mkdir build
                    cd build
                    cmake -D ENABLE_TESTS=0 ..
                    make
                    sudo make install
                    sudo ldconfig
                    cd "$ORIGINAL_DIR"
                    rm -rf "$TEMP_DIR"
                    echo "✅ audiowaveform built and installed"
                fi
                ;;
            alpine)
                echo "📦 Detected Alpine Linux - installing via apk..."
                sudo apk add --no-cache ffmpeg audiowaveform
                ;;
            fedora|rhel|centos)
                echo "📦 Detected Fedora/RHEL/CentOS - installing via dnf/yum..."
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y ffmpeg audiowaveform
                else
                    sudo yum install -y ffmpeg audiowaveform
                fi
                ;;
            arch|manjaro)
                echo "📦 Detected Arch Linux - installing via pacman..."
                sudo pacman -S --noconfirm ffmpeg audiowaveform
                ;;
            *)
                echo "❌ Unsupported Linux distribution: $DISTRO"
                echo "Please install audio tools manually:"
                echo "  - ffmpeg: https://ffmpeg.org/download.html"
                echo "  - audiowaveform: https://github.com/bbc/audiowaveform"
                exit 1
                ;;
        esac
        ;;
    Darwin*)
        echo "📦 Detected macOS - installing via Homebrew..."
        if ! command -v brew &> /dev/null; then
            echo "❌ Homebrew not found. Please install it from https://brew.sh"
            exit 1
        fi
        brew install ffmpeg audiowaveform
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "📦 Detected Windows"
        echo "Please download and install the following tools:"
        echo "  - ffmpeg: https://ffmpeg.org/download.html"
        echo "  - audiowaveform: https://github.com/bbc/audiowaveform/releases"
        echo ""
        echo "Or use WSL2 with Ubuntu and run this script inside WSL."
        exit 1
        ;;
    *)
        echo "❌ Unsupported operating system: $OS"
        echo "Please install audio tools manually:"
        echo "  - ffmpeg: https://ffmpeg.org/download.html"
        echo "  - audiowaveform: https://github.com/bbc/audiowaveform"
        exit 1
        ;;
esac

# Verify installation
echo ""
echo "✅ Verifying installation..."

SUCCESS=true

if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n 1)
    echo "✅ ffmpeg: $FFMPEG_VERSION"
else
    echo "❌ ffmpeg not found"
    SUCCESS=false
fi

if command -v audiowaveform &> /dev/null; then
    AUDIOWAVEFORM_VERSION=$(audiowaveform --version 2>&1 | head -n 1)
    echo "✅ audiowaveform: $AUDIOWAVEFORM_VERSION"
else
    echo "❌ audiowaveform not found"
    SUCCESS=false
fi

if [ "$SUCCESS" = false ]; then
    echo ""
    echo "❌ Installation incomplete - some tools are missing"
    exit 1
fi

echo ""
echo "🎉 All audio processing tools are ready to use!"
