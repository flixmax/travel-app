// Ao alterar arquivos do app, aumente a versão para forçar a limpeza do cache antigo.
const CACHE_NAME = 'viagens-app-v44';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Com sinal fraco na estrada, não espera a rede para sempre: depois deste tempo usa o cache.
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Remove caches de versões anteriores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro, com tempo limite: busca a versão mais nova e atualiza o cache.
// Se a rede demorar mais que NETWORK_TIMEOUT_MS (ou falhar), usa o que estiver em cache.
// Se não houver cache, continua esperando a rede.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const sameOrigin = new URL(request.url).origin === self.location.origin;

  const networkFetch = fetch(request).then(response => {
    if (response.ok && sameOrigin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  });
  networkFetch.catch(() => {}); // evita erro não tratado quando a resposta já veio do cache

  const timeout = new Promise(resolve => setTimeout(resolve, NETWORK_TIMEOUT_MS));

  event.respondWith(
    Promise.race([networkFetch, timeout])
      .then(response => response || caches.match(request).then(cached => cached || networkFetch))
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
