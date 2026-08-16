/* SILELO Neo-Connect Service Worker v1.10 */
const CACHE = 'silelo-v11';
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

  // GET เฉพาะ (POST/อื่น ๆ ข้ามไป)
  if (req.method !== 'GET') return;

  // App shell -> cache-first (โหลดไว ใช้ได้แม้ออฟไลน์)
  if (SHELL.includes(url.pathname) || url.pathname === '/') {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
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
