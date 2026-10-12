/* ==========================================================================
   sw.js — Service Worker NutriKala
   Strategi: cache-first untuk app shell. Naikkan VERSI bila ada file berubah.
   Semua path RELATIF agar jalan di http://localhost/Bmi-Calc/.
   ========================================================================== */

const VERSI = 'nutrikala-shell-v1';

/** Berkas inti aplikasi yang harus bisa dibuka tanpa jaringan. */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/bmi.js',
  './assets/js/data.js',
  './assets/js/hydration.js',
  './assets/js/storage.js',
  './assets/js/ui.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

/* --------------------------------------------------------------------------
   Install: simpan app shell ke cache bernama
   -------------------------------------------------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSI)
      .then((cache) =>
        // allSettled agar satu berkas gagal tidak membatalkan instalasi.
        Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

/* --------------------------------------------------------------------------
   Activate: buang cache versi lama
   -------------------------------------------------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nama) =>
        Promise.all(
          nama.filter((kunci) => kunci !== VERSI).map((kunci) => caches.delete(kunci))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* --------------------------------------------------------------------------
   Fetch: cache-first, lalu jaringan (respons baru ikut disimpan)
   -------------------------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Hanya urus permintaan GET (POST dll dibiarkan ke jaringan).
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request, { ignoreSearch: false }).then((cacheBos) => {
      if (cacheBos) return cacheBos;

      return fetch(request)
        .then((respons) => {
          // Simpan salinan hanya untuk URL same-origin agar cache tetap bersih.
          const urlAsli = new URL(request.url);
          const sameOrigin = urlAsli.origin === self.location.origin;
          if (sameOrigin && respons.ok) {
            const salinan = respons.clone();
            caches.open(VERSI).then((cache) => cache.put(request, salinan));
          }
          return respons;
        })
        .catch(() =>
          // Jaringan mati & belum ada di cache: kembalikan halaman utama.
          caches.match('./index.html')
        );
    })
  );
});
