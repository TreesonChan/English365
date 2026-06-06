const CACHE_VERSION = 'english365-cache-v1-1-2-statistics-2026-06-05';
const CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/icons/icon.svg',
  './js/config.js',
  './js/storage.js',
  './js/corpus-loader.js',
  './js/stats.js',
  './js/store.js',
  './js/tts.js',
  './js/ui/cards.js',
  './js/ui/buttons.js',
  './js/ui/toast.js',
  './js/ui/home.js',
  './js/modes/sentence-mode.js',
  './js/modes/conversation-mode.js',
  './js/modes/listening-mode.js',
  './js/modes/listening-challenge-mode.js',
  './js/modes/statistics-mode.js',
  './js/modes/favorites-mode.js',
  './js/modes/mistakes-mode.js',
  './data/scenes.js',
  './data/daily-life.js',
  './data/daily-life-v2.js',
  './data/hotel.js',
  './data/hotel-v2.js',
  './data/travel.js',
  './data/travel-v2.js',
  './data/transportation.js',
  './data/transportation-v2.js',
  './data/restaurant.js',
  './data/restaurant-v2.js',
  './data/office.js',
  './data/office-v2.js',
  './data/meeting.js',
  './data/meeting-v2.js',
  './data/business.js',
  './data/business-v2.js',
  './data/sports.js',
  './data/sports-v2.js',
  './data/entertainment.js',
  './data/entertainment-v2.js',
  './data/conversations.js',
  './data/conversations-v2.js',
  './data/index.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.endsWith('/js/config.js')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
