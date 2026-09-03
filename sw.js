const CACHE = 'casa-shell-59168c69'
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./assets/index-CFhUlM0i.css","./assets/index-DQloXof2.js"]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const stale = []
      for (const key of keys) {
        if (key !== CACHE) stale.push(caches.delete(key))
      }
      return Promise.all(stale)
    }).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          return response
        })
        .catch(() => cached)
      return cached || fetched
    }),
  )
})
