const cacheName = 'scratch-labor-7-v5';
const core = ['./', './labor.css', './labor.js', './mission.js', './scratch.js', './assets/start.sb3',
  './assets/byte.svg', './vendor/dist/scratch-gui-standalone.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(core)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('scratch-labor-7-') && key !== cacheName)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const saved = await cache.match(request);
    if (saved) return saved;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === 'navigate') return (await cache.match('./')) ?? Response.error();
      throw error;
    }
  })());
});
