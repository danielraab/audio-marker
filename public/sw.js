/// <reference lib="webworker" />
// @ts-check

const CACHE_NAME = 'audio-marker-v1';
const AUDIO_CACHE_NAME = 'audio-marker-audio-v1';
const STATIC_CACHE_NAME = 'audio-marker-static-v1';
const AUDIO_API_REGEX = /^\/api\/audio\/[^\/]+\/file$/;

// Check if we're in production mode (enable caching only in production)
// Read from URL parameter passed during registration
let IS_PRODUCTION = false;

try {
  const url = new URL(self.location.href);
  const env = url.searchParams.get('env');
  IS_PRODUCTION = env === 'production';
} catch (e) {
  // Fallback: assume production if we can't determine
  console.warn('[Service Worker] Could not determine environment, defaulting to production');
  IS_PRODUCTION = true;
}

const isProduction = () => IS_PRODUCTION;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/audio-marker-logo.svg',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', isProduction() ? '(Production Mode)' : '(Development Mode)');
  
  if (isProduction()) {
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
    );
  } else {
    console.log('[Service Worker] Development mode - skipping cache');
  }
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== AUDIO_CACHE_NAME &&
            cacheName !== STATIC_CACHE_NAME
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip caching in development mode - just fetch normally
  if (!isProduction()) {
    event.respondWith(fetch(request));
    return;
  }

  // Audio files - Cache First strategy with network fallback
  if (isAudioRequest(request)) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving audio from cache:', url.pathname);
            return cachedResponse;
          }

          console.log('[Service Worker] Fetching and caching audio:', url.pathname);
          return fetch(request).then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              cache.put(request, responseClone);
            }
            return networkResponse;
          }).catch((error) => {
            console.error('[Service Worker] Audio fetch failed:', error);
            throw error;
          });
        });
      })
    );
    return;
  }

  // Static assets - Cache First strategy
  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Auth endpoints - Never cache, always fetch from network
  if (isAuthRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // API and dynamic content - Network First strategy
  if (isApiRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response('Network error', { status: 503 });
          });
        })
    );
    return;
  }

  // Default - Network First with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Network error', { status: 503 });
        });
      })
  );
});

// Helper functions
function isAudioRequest(request) {
  const url = new URL(request.url);
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
  const pathname = url.pathname.toLowerCase();
  
  // Check if it's the audio API endpoint
  if (pathname.match(AUDIO_API_REGEX)) {
    return true;
  }
  
  // Check file extension
  if (audioExtensions.some(ext => pathname.endsWith(ext))) {
    return true;
  }
  
  // Check content-type header if available
  const contentType = request.headers.get('accept');
  if (contentType && contentType.includes('audio/')) {
    return true;
  }
  
  return false;
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  const pathname = url.pathname.toLowerCase();
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

function isApiRequest(request) {
  const url = new URL(request.url);
  // Exclude audio file API and auth API from general API handling
  if (url.pathname.match(AUDIO_API_REGEX)) {
    return false;
  }
  if (url.pathname.startsWith('/api/auth/')) {
    return false;
  }
  return url.pathname.startsWith('/api/');
}

function isAuthRequest(request) {
  const url = new URL(request.url);
  // Never cache authentication endpoints
  return url.pathname.startsWith('/api/auth/');
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  const data = event.data;
  
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data && data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[Service Worker] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});