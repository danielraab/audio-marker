##### DEPENDENCIES

FROM --platform=linux/amd64 node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl ffmpeg
WORKDIR /app

# Install Prisma Client - remove if not using Prisma

COPY prisma ./

# Install dependencies based on the preferred package manager

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml\* ./

RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm i; \
    else echo "Lockfile not found." && exit 1; \
    fi

##### AUDIOWAVEFORM BUILDER
# Build audiowaveform from source since it's not available in Alpine repos

FROM --platform=linux/amd64 alpine:3.19 AS audiowaveform-builder
RUN apk add --no-cache git make cmake gcc g++ libmad-dev libid3tag-dev libsndfile-dev \
    gd-dev boost-dev libgd libpng-dev zlib-dev
RUN git clone https://github.com/bbc/audiowaveform.git /tmp/audiowaveform && \
    cd /tmp/audiowaveform && \
    mkdir build && \
    cd build && \
    cmake -D ENABLE_TESTS=0 -D CMAKE_BUILD_TYPE=Release .. && \
    make && \
    make install

##### BUILDER

FROM --platform=linux/amd64 node:20-alpine AS builder
ARG GIT_VERSION_LABEL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_ENVIRONMENT
ARG SENTRY_AUTH_TOKEN
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ENV NEXT_TELEMETRY_DISABLED 1

RUN \
    if [ -f yarn.lock ]; then SKIP_ENV_VALIDATION=1 NEXT_PUBLIC_GIT_VERSION_LABEL=${GIT_VERSION_LABEL} NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT} SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} yarn build; \
    elif [ -f package-lock.json ]; then SKIP_ENV_VALIDATION=1 NEXT_PUBLIC_GIT_VERSION_LABEL=${GIT_VERSION_LABEL} NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT} SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} npm run build; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && SKIP_ENV_VALIDATION=1 NEXT_PUBLIC_GIT_VERSION_LABEL=${GIT_VERSION_LABEL} NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT} SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

##### RUNNER

FROM --platform=linux/amd64 node:20-alpine3.19 AS runner
# Install runtime dependencies for audiowaveform and ffmpeg
RUN apk add --no-cache openssl ffmpeg libmad libid3tag libsndfile libgd libpng boost-libs
WORKDIR /app

# Copy audiowaveform binary from builder stage
COPY --from=audiowaveform-builder /usr/local/bin/audiowaveform /usr/local/bin/audiowaveform

ENV NODE_ENV production

# ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create data directories for uploads and database
RUN mkdir -p data/uploads

# Copy Prisma files and full node_modules for CLI access
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Copy scripts directory for admin CLI commands
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/lib ./src/lib

# Copy the entrypoint script
COPY docker/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD HOSTNAME="0.0.0.0" node server.js