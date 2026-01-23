// sw.js  (Service Worker) — NÃO coloque HTML/DOM aqui
// Não altera nomes de séries nem imagens do app.
// Ajuste o CACHE_NAME quando quiser forçar atualização.

const CACHE_NAME = "treino-pwa-v1";

// Arquivos do app (shell)
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
];

// Instala: salva o shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativa: limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch:
// - imagens: network-first (pega versão nova quando tiver internet)
// - demais: cache-first (rápido/offline)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Só tratamos GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Imagens: network-first
  if (url.pathname.includes("/images/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Só cacheia respostas OK (evita cachear 404/opaque)
          if (!res || res.status !== 200 || res.type === "opaque") return res;

          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Demais arquivos: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((res) => {
        // Só cacheia respostas OK (evita cachear 404/opaque)
        if (!res || res.status !== 200 || res.type === "opaque") return res;

        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});
