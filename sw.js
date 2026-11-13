// Service worker de Código Infarto.
// Página y archivos propios: primero la red (siempre la versión más nueva) y, sin señal, la copia guardada.
// Bibliotecas externas (docx, jQuery, select2...): se guardan la primera vez y se reutilizan.
// Los envíos a Google (POST) nunca pasan por la caché.
const CACHE = "codigo-infarto-v1";
const CDN = ["unpkg.com", "cdnjs.cloudflare.com", "code.jquery.com", "cdn.jsdelivr.net"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./manifest.webmanifest"]).catch(() => {})));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (CDN.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
        return res;
      }))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
  }
});
