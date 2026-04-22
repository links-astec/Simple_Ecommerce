const CACHE = 'bels-haven-v2';
const STATIC = [
  '/',
  '/manage',
  '/manifest.json',
  '/manage.webmanifest',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Skip non-GET and API calls — always fresh
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(match => {
          if (match) return match;
          if (e.request.mode === 'navigate') return caches.match('/');
          return new Response('', { status: 504, statusText: 'Offline' });
        })
      )
  );
});
