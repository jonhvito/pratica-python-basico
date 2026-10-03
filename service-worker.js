const cacheName = "python-de-cabeca-v9";
const cachePrefix = "python-de-cabeca-v";
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
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  // Os arquivos de uma versão permanecem juntos; a instalação seguinte troca o conjunto.
  event.respondWith(caches.open(cacheName).then(cache => cache.match(event.request)).then(cached => cached || fetch(event.request)).catch(() => new Response("Este recurso não está disponível sem internet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })));
});
