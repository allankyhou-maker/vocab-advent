const CACHE_NAME = 'vocab-adventure-v5.4'; // 💡 升級到 v5，確保舊的快取被清除
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// 1. 安裝魔法陣 (快取 App 外殼)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. 啟動魔法陣 (清除以前 V4, V3 的舊垃圾)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// 3. 攔截請求策略
self.addEventListener('fetch', (e) => {
  // 💡 規則 A：絕對不要干涉 Firebase 的 API 請求 (firestore, auth 等)
  // 交給剛才我們在 HTML 寫的 enableIndexedDbPersistence 去處理離線資料
  if (e.request.url.includes('firestore.googleapis.com') || 
      e.request.url.includes('securetoken.googleapis.com')) {
      return; 
  }

  // 💡 規則 B：網頁外殼 (HTML, 特效) 採用「網路優先 (Network First)」
  // 有網路就抓最新版畫面並備份；沒網路就從快取金庫拿備份出來用
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        let responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        return response;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});

// 💡 當收到 'skipWaiting' 訊息時，強制捨棄舊版，立刻啟用新版
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});