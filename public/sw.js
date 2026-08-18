/* SILELO Neo-Connect Service Worker v1.12 - DUSTY UI v1.16 (fix stale cache) */
const CACHE = 'silelo-v13';
const SHELL = [
  '/',
  '/index.html',
  '/chat.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // API / เสียง / รูปภาพภายนอก -> network only (ไม่แคชของสด)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  if (req.method !== 'GET') return;

  // HTML app shell -> NETWORK-FIRST (ได้หน้าใหม่ทุก deploy แต่ยังสำรอง offline)
  if (SHELL.includes(url.pathname) || url.pathname === '/') {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // อย่างอื่น -> network-first แล้วเก็บแคชสำรอง
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
  );
});
