# Admin Scripts

## Install Audio Processing Tools

This script installs `ffmpeg` and `audiowaveform`, tools required for audio processing and waveform generation. It automatically detects your operating system and uses the appropriate package manager.

### Usage

```bash
./scripts/install-audio-tools.sh
```

### Supported Platforms

- **macOS**: Installs via Homebrew
- **Ubuntu/Debian**: Installs ffmpeg via apt, builds audiowaveform from source (takes a few minutes)
- **Fedora/RHEL/CentOS**: Installs via dnf/yum
- **Alpine Linux**: Installs via apk
- **Arch Linux**: Installs via pacman
- **Windows**: Manual installation required (see script output for download links)

### Notes

- The script requires sudo privileges for package installation
- For Docker deployments, both tools are already included in the container
- If your OS is not supported, install manually:
  - [ffmpeg downloads](https://ffmpeg.org/download.html)
  - [audiowaveform releases](https://github.com/bbc/audiowaveform/releases)

---

## Database Seeder

This script fills the database with test data for development and testing purposes. All dates are relative to the script execution time.

### Usage

#### Development
```bash
npm run db:seed
```

#### Production (Docker Container)
```bash
# Execute inside the running container
docker exec -it <container-name> npm run db:seed

# Or using docker-compose
docker-compose -f docker/docker-compose.yml exec audio-marker npm run db:seed
```

### What it creates

- **Users**: 4 users (1 admin, 2 regular, 1 disabled)
  - `admin@example.com` - Admin user
  - `user1@example.com` - Regular user (John Doe)
  - `user2@example.com` - Regular user (Jane Smith)
  - `disabled@example.com` - Disabled user
- **Audios**: 6 audio files (5 public, 1 private) with descriptions
- **Markers**: Various point markers and section markers with different colors
- **Playlists**: 3 playlists (2 public, 1 private) with descriptions
- **Listen Records**: Randomly distributed listen statistics over the past 2 weeks
- **Legal Information**: Impressum, Privacy Policy, and Terms of Service

### Notes

- The script uses `upsert` for most entities, so it's safe to run multiple times
- Listen records are regenerated on each run (deleted and recreated)
- Audio files are not created - only database records pointing to placeholder paths
- Users still need to sign in via the configured auth provider

---

## Migrate Audio Storage

This script updates the database to migrate from full file paths to filenames only.

### Usage

#### Development
```bash
npm run migrate:storage
```

#### Production (Docker Container)
```bash
# Execute inside the running container
docker exec -it <container-name> npm run migrate:storage

# Or using docker-compose
docker-compose -f docker/docker-compose.yml exec audio-marker npm run migrate:storage
```

### What it does

1. Updates all database records to store only filenames (e.g., `abc123.mp3` instead of `/uploads/abc123.mp3`)
2. Does NOT move or copy files - files stay in their current location
3. Docker volumes are mounted to the correct locations automatically

### Migration Context

This migration is necessary when upgrading from versions that stored full paths to the new system that uses:
- Database: stores only filenames
- API route: serves files from `/data/uploads` with permission checks
- Docker volumes: `audio_uploads` mounted at `/app/data/uploads`

---

## Create Admin User

This script allows you to create a new admin user or promote an existing user to admin status.

### Usage

#### Development
```bash
npm run admin:create <email>
```

#### Production (Standalone)
```bash
# Using tsx (recommended)
npx tsx scripts/create-admin.ts <email>

# Or using node with tsx loader
node --loader tsx scripts/create-admin.ts <email>
```

#### Production (Docker Container)
```bash
# Execute inside the running container
docker exec -it <container-name> npm run admin:create <email>

# Or using docker-compose
docker-compose -f docker/docker-compose.yml exec audio-marker npm run admin:create <email>

# Example with actual email
docker exec -it audio-marker npm run admin:create admin@example.com
```

### Examples

Create or promote a user to admin:
```bash
npm run admin:create admin@example.com
```

### Behavior

- **If the user exists**: The script will promote them to admin by setting `isAdmin = true`
- **If the user doesn't exist**: The script will create a new user with admin privileges
  - The user will still need to sign in via the configured authentication provider (Authentik or Email)
  - The email will be marked as verified

### Requirements

- Database must be accessible (check `DATABASE_URL` environment variable)
- Valid email address format

### Output

The script provides clear feedback:
- ✅ Success messages when user is created or promoted
- ℹ️  Information about the user's status
- ❌ Error messages if something goes wrong

### Notes

- The script uses Prisma Client to interact with the database
- It's safe to run multiple times on the same email
- The script will automatically disconnect from the database when finished