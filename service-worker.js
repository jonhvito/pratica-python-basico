const cacheName = "python-de-cabeca-v7";
const shell = [
  "./",
  "./index.html",
  "./styles.css",
  "./exercicios.js",
  "./curriculo.js",
  "./professor.js",
  "./python.js",
  "./aprendizagem.js",
  "./progresso.js",
  "./editor.js",
  "./treinador.js",
  "./manifest.webmanifest",
  "./icone.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(shell)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== cacheName).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => {
    const network = fetch(event.request).then(response => {
      if (response.ok) caches.open(cacheName).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || network;
  }));
});
