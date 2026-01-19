// Whakapapa Service Worker
const CACHE_NAME = 'whakapapa-v1'
const OFFLINE_URL = '/offline.html'

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip API requests (let them fail normally)
  if (event.request.url.includes('/api/')) return

  // Skip Supabase requests
  if (event.request.url.includes('supabase')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone()

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }

        return response
      })
      .catch(async () => {
        // Try to get from cache
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }

        // For navigation requests, show offline page
        if (event.request.mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_URL)
          if (offlinePage) {
            return offlinePage
          }
        }

        // Return a basic offline response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      })
  )
})

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
