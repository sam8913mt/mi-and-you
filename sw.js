/* Service worker: دریافت اعلان‌ها (Web Push) */
const CACHE = "me-and-you-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "css/romantic.css", "css/magic.css", "css/magic2.css", "css/magic3.css", "js/jdate.js", "js/supabase-config.js", "js/site.js", "js/phase2-public.js", "js/more-public.js", "js/romantic.js", "js/emoji-fix.js", "js/notify.js", "js/magic.js", "js/magic2.js", "js/magic3.js", "assets/icons/icon-192.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
/* همیشه اول شبکه (نسخهٔ تازه)، در صورت نبود اینترنت از حافظه */
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== self.location.origin || /music\.mp3$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then((res) => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r).then((m) => m || (r.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: "ME & YOU", body: event.data ? event.data.text() : "" }; }
  const title = d.title || "ME & YOU 💗";
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    tag: d.tag || undefined,
    icon: "assets/icons/icon-192.png",
    badge: "assets/icons/badge-96.png",
    dir: "rtl",
    lang: "fa",
    data: { url: d.url || "./" }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "./", self.registration.scope).href;
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) { if (c.url.startsWith(self.registration.scope) && "focus" in c) return c.focus(); }
    return self.clients.openWindow(target);
  })());
});
