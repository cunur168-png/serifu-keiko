// オフラインでも開けるようにするためのキャッシュ
const CACHE = "serifu-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // ページ本体は最新を優先、だめならキャッシュ
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c => c.put("index.html", res.clone())); return res; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // それ以外（フォント・ライブラリ・アイコン）はキャッシュ優先
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
