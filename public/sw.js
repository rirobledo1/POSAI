const CACHE_NAME = 'ferreai-v1.0.0'
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/icon-192x192.png',
  '/manifest.json'
]

// Instalación del service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto')
        return cache.addAll(urlsToCache)
      })
  )
})

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  // Solo interceptar requests GET
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - devolver respuesta desde cache
        if (response) {
          return response
        }

        // No está en cache, hacer fetch
        return fetch(event.request).then(response => {
          // Verificar si recibimos una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clonar la respuesta para cache
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })

          return response
        }).catch(() => {
          // Error de red - devolver página offline si existe
          if (event.request.destination === 'document') {
            return caches.match('/offline')
          }
        })
      }
    )
  )
})

// Activación del service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Manejar mensajes desde la aplicación
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Sincronización en background (para futuras funcionalidades offline)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // Aquí implementaremos la sincronización de datos offline
  console.log('Background sync ejecutado')
}