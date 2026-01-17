const CACHE_NAME = "treino-pwa-v99";


// Arquivos “do app” (shell) — cache-first
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
];
function renderTabs(){
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";
  Object.keys(WORKOUTS).forEach(k=>{
    const wk = WORKOUTS[k];
    const btn = document.createElement("button");
    btn.className = "tabbtn" + (state.activeWorkout===k ? " active" : "");
    btn.textContent = wk.tabLabel ?? k; // <<< aqui muda o que aparece na aba
    btn.onclick = ()=>{ state.activeWorkout = k; saveState(state); render(); };
    tabs.appendChild(btn);
  });
}
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Só tratamos GET
  if (req.method !== "GET") return;

  // 1) Imagens: network-first (atualiza sempre que houver internet)
  if (url.pathname.includes("/images/")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 2) Demais arquivos: cache-first (rápido e offline)
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      });
    })
  );
});




