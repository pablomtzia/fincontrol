// Service Worker — FinControl PWA
// Caches all app files for offline use

const CACHE_NAME = 'fincontrol-v2.1';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/store.js',
    './js/utils.js',
    './js/quickAdd.js',
    './js/priceService.js',
    './js/syncService.js',
    './js/views/DashboardView.js',
    './js/views/IncomeView.js',
    './js/views/ExpensesView.js',
    './js/views/InvestmentsView.js',
    './js/views/SettingsView.js',
];

// Install: cache all assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (e) => {
    // Skip non-GET and API requests
    if (e.request.method !== 'GET' || e.request.url.includes('firebaseio') || e.request.url.includes('coingecko') || e.request.url.includes('yahoo') || e.request.url.includes('allorigins') || e.request.url.includes('corsproxy') || e.request.url.includes('er-api')) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((res) => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});
