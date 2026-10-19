# Docker Setup for Audio Marker

This document provides instructions for running the Audio Marker application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and set your environment variables:
   ```env
   DATABASE_URL="file:/app/data/db.sqlite"
   AUTH_URL="http://localhost:3000"
   AUTH_SECRET="your-secure-secret-here"
   AUTH_AUTHENTIK_ID="your-authentik-id"
   AUTH_AUTHENTIK_SECRET="your-authentik-secret"
   AUTH_AUTHENTIK_ISSUER="your-authentik-issuer"
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose -f docker/docker-compose.yml up --build
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Docker Configuration

### Volumes

The application uses two persistent volumes:

- **`audio_uploads`**: Stores uploaded audio files (`/app/data/uploads`)
- **`database_data`**: Stores the SQLite database and other data (`/app/data`)

### Environment Variables

**Runtime Environment Variables** (set in docker-compose.yml or passed to `docker run`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:/app/data/db.sqlite` |
| `AUTH_URL` | Public application URL for authentication; also defines the passkey domain | `http://localhost:3000` |
| `AUTH_PASSKEY_DISABLED` | Set to `true` to disable passkey sign-in | `false` |
| `AUTH_SECRET` | Secret key for NextAuth.js | Required |
| `AUTH_AUTHENTIK_ID` | Authentik OAuth client ID | Required |
| `AUTH_AUTHENTIK_SECRET` | Authentik OAuth client secret | Required |
| `AUTH_AUTHENTIK_ISSUER` | Authentik issuer URL | Required |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for server-side error tracking | Optional |

**Build-time Arguments** (must be set when building the Docker image):

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking (baked into build) | Optional |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for uploading source maps | Optional |
| `GIT_VERSION_LABEL` | Git version label to display in app footer | `unknown` |

> **Important**: Variables prefixed with `NEXT_PUBLIC_` must be set at **build time** as they are baked into the JavaScript bundle. Setting them at runtime will not work.

## Docker Commands

### Build the image
```bash
# Build with current git version (tag or commit hash) and Sentry
docker build -f docker/Dockerfile -t audio-marker \
  --build-arg GIT_VERSION_LABEL=$(git describe --tags --always) \
  --build-arg NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn" \
  --build-arg SENTRY_AUTH_TOKEN="your-sentry-auth-token" \
  .

# Build with specific version tag
docker build -f docker/Dockerfile -t audio-marker --build-arg GIT_VERSION_LABEL=v0.2.3 .

# Build without version label (will show 'dev' in footer)
docker build -f docker/Dockerfile -t audio-marker .
```

### Run with Docker Compose
```bash
# Start in foreground
docker-compose -f docker/docker-compose.yml up

# Start in background
docker-compose -f docker/docker-compose.yml up -d

# Build and start
docker-compose -f docker/docker-compose.yml up --build

# Stop the application
docker-compose -f docker/docker-compose.yml down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose -f docker/docker-compose.yml down -v
```

### Run manually with Docker
```bash
# Create volumes
docker volume create audio_uploads
docker volume create database_data

# Run the container
docker run -d \
  --name audio-marker \
  -p 3000:3000 \
  -v audio_uploads:/app/data/uploads \
  -v database_data:/app/data \
  -e DATABASE_URL="file:/app/data/db.sqlite" \
  -e AUTH_URL="http://localhost:3000" \
  -e AUTH_SECRET="your-secret-here" \
  audio-marker
```

## Database Migrations

Database migrations are automatically executed when the container starts. The startup script (`docker/docker-entrypoint.sh`) handles:

1. Creating necessary directories
2. Running Prisma migrations (`prisma migrate deploy`)
3. Generating Prisma client
4. Starting the application

## Admin User Management

You can create or promote users to admin status directly in the Docker container:

```bash
# Using docker exec
docker exec -it audio-marker npm run admin:create admin@example.com

# Using docker-compose
docker-compose -f docker/docker-compose.yml exec audio-marker npm run admin:create admin@example.com
```

This command will:
- Create a new admin user if the email doesn't exist
- Promote an existing user to admin if they already exist
- Provide clear feedback about the operation

For more details, see [scripts/README.md](../scripts/README.md).

## Data Persistence

### Audio Files
All uploaded audio files are stored in the `audio_uploads` volume, which maps to `/app/public/uploads` inside the container. Files are immediately available without container restart.

### Database
The SQLite database is stored in the `database_data` volume, which maps to `/app/data` inside the container.

### Backup and Restore

To backup your data:
```bash
# Backup audio files
docker run --rm -v audio_uploads:/data -v $(pwd):/backup alpine tar czf /backup/audio_backup.tar.gz -C /data .

# Backup database
docker run --rm -v database_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz -C /data .
```

To restore your data:
```bash
# Restore audio files
docker run --rm -v audio_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/audio_backup.tar.gz -C /data

# Restore database
docker run --rm -v database_data:/data -v $(pwd):/backup alpine tar xzf /backup/db_backup.tar.gz -C /data
```

## Troubleshooting

### Container won't start
1. Check the logs: `docker-compose logs`
2. Ensure all required environment variables are set
3. Verify that ports are not already in use

### Database issues
1. Check if migrations ran successfully in the logs
2. Ensure the database volume has proper permissions
3. Try recreating the database volume (WARNING: This will delete all data)

### Audio upload issues
1. Verify the uploads volume is properly mounted
2. Check container logs for permission errors
3. Ensure the uploads directory has write permissions

## Development

For development with Docker:

```bash
# Use the development docker-compose file (if you create one)
docker-compose -f docker/docker-compose.dev.yml up

# Or run in development mode
docker run -it --rm \
  -v $(pwd):/app \
  -v /app/node_modules \
  -p 3000:3000 \
  -e NODE_ENV=development \
  audio-marker npm run dev
```

## Security Considerations

1. **Change default secrets**: Always use strong, unique values for `AUTH_SECRET`
2. **Use HTTPS in production**: Update `AUTH_URL` to use HTTPS
3. **Passkeys**: Passkeys require HTTPS (except on `localhost`) and are bound to the hostname of `AUTH_URL`. `AUTH_URL` must match the public URL behind your reverse proxy, otherwise passkey registration and sign-in fail. Changing the domain later invalidates all registered passkeys; users can still sign in via email or Authentik and add new ones. Passkeys are disabled when `AUTH_URL` is not set
4. **Secure your Authentik instance**: Ensure your OAuth provider is properly configured
5. **Regular backups**: Implement regular backup procedures for your data
6. **Update regularly**: Keep the Docker image updated with security patches

## Production Deployment

For production deployment:

1. Use a reverse proxy (nginx, Traefik, etc.)
2. Enable HTTPS/TLS
3. Set up proper logging and monitoring
4. Configure automated backups
5. Use Docker secrets for sensitive environment variables
6. Consider using a managed database instead of SQLite for better performance and reliability

### GitHub Actions Setup

If you're building images via GitHub Actions (as configured in `.github/workflows/`), you need to add these secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN URL
   - `SENTRY_AUTH_TOKEN`: Your Sentry auth token for uploading source maps

The workflows are already configured to pass these as build arguments. When you push a new tag (e.g., `v1.0.0`), the workflows will automatically:
- Build Docker images with Sentry enabled
- Push to both GitHub Container Registry and Docker Hub (if configured)
- Upload source maps to Sentry for better error tracking