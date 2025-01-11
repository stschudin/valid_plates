self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('license-plate-cache').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './script.js',
        './valid_plates.json',
        'https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
