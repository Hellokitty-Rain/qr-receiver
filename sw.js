// QR RX Service Worker v2.0
const CACHE = 'qr-rx-v2';

const ASSETS = [
  './',
  './qr_receiver_fountain.html',
  './zxing_reader.wasm',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@700;800&display=swap',
];

// 安装：缓存所有资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // 逐个缓存，失败的跳过（字体CDN可能被拦截）
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// 激活：清除旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 拦截请求：优先缓存，网络兜底
self.addEventListener('fetch', e => {
  // 只处理 GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // 缓存成功的网络响应
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        // 完全离线且无缓存时的回退
        return new Response('离线模式：资源不可用', {
          status: 503,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
      });
    })
  );
});
