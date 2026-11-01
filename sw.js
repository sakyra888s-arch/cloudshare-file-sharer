const CACHE_NAME = 'filesharer-cache-v3';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/css/style.css',
    '/js/script.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) 
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('download.php')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response; 
                }
                return fetch(event.request);
            })
            .catch(function() {
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});
