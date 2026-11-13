/* ME & YOU — اعلان‌ها: Web Push (پس‌زمینه) + بررسی دوره‌ای هنگام باز بودن صفحه + سالگرد/ماهگرد محلی */
(() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const push = window.PUSH_CONFIG || {};
  const base = String(cfg.url || "").replace(/\/$/, "");
  if (!base || base.includes("YOUR_PROJECT_ID")) return;
  const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const ls = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const hdr = () => { const h = { apikey: cfg.anonKey, "Content-Type": "application/json" }; if (/^eyJ/.test(cfg.anonKey)) h.Authorization = "Bearer " + cfg.anonKey; return h; };
  const rpc = (name, body) => fetch(`${base}/rest/v1/rpc/${name}`, { method: "POST", headers: hdr(), body: JSON.stringify(body || {}) }).then((r) => { if (!r.ok) throw Error(name); return r.json(); });
  const creds = () => ({ code: (window.P2x && window.P2x.getCode && window.P2x.getCode()) || "", who: ls.get("who") });
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const canNotify = "Notification" in window;
  const SEEN_KEY = "nf-shown-ids";
  const shown = new Set((() => { try { return JSON.parse(ls.get(SEEN_KEY) || "[]"); } catch (e) { return []; } })());
  const remember = (id) => { shown.add(id); ls.set(SEEN_KEY, JSON.stringify([...shown].slice(-120))); };

  /* ---------- Service worker ---------- */
  let regPromise = null;
  const getReg = () => {
    if (!("serviceWorker" in navigator)) return Promise.resolve(null);
    if (!regPromise) regPromise = navigator.serviceWorker.register("sw.js?v=20", { updateViaCache: "none" }).then(() => navigator.serviceWorker.ready).catch(() => null);
    return regPromise;
  };
  getReg();

  /* ---------- UI ---------- */
  const bell = el("button", "", ""); bell.id = "nfBell"; bell.type = "button"; bell.setAttribute("aria-label", "اعلان‌ها");
  const bellIco = el("span", "", "🔔"); const dot = el("span", "nf-dot"); bell.append(bellIco, dot);
  const panel = el("div", ""); panel.id = "nfPanel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "اعلان‌ها");
  const toasts = el("div", ""); toasts.id = "nfToasts"; toasts.setAttribute("aria-live", "polite");
  document.body.append(bell, panel, toasts);

  const toast = (title, body, onClick) => {
    const t = el("div", "nf-toast"); t.append(el("b", "", title)); if (body) t.append(el("span", "", body));
    t.onclick = () => { t.remove(); if (onClick) onClick(); };
    toasts.append(t); setTimeout(() => t.remove(), 9000);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    bell.classList.remove("ring"); void bell.offsetWidth; bell.classList.add("ring");
  };

  const setBadge = (n) => { dot.textContent = n > 99 ? "۹۹+" : fa(n); dot.classList.toggle("on", n > 0); };
  const ago = (iso) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); if (m < 1) return "همین الان"; if (m < 60) return fa(m) + " دقیقه پیش"; const h = Math.round(m / 60); if (h < 24) return fa(h) + " ساعت پیش"; return fa(Math.round(h / 24)) + " روز پیش"; };

  /* ---------- Push subscription ---------- */
  const b64 = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4), r = (s + p).replace(/-/g, "+").replace(/_/g, "/"), raw = atob(r), out = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out; };
  const buf2b64url = (buf) => { let s = ""; new Uint8Array(buf).forEach((c) => (s += String.fromCharCode(c))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };

  async function subscribe() {
    const { code, who } = creds();
    if (!supported || !push.vapidPublicKey || !code || !who) return false;
    const reg = await getReg(); if (!reg) return false;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(push.vapidPublicKey) });
    const ok = await rpc("save_push_subscription", { p_access_code: code, p_who: who, p_endpoint: sub.endpoint, p_p256dh: buf2b64url(sub.getKey("p256dh")), p_auth: buf2b64url(sub.getKey("auth")) });
    if (ok === true) ls.set("nf-sub-who", who);
    return ok === true;
  }
  async function unsubscribe() {
    const { code } = creds(); const reg = await getReg(); if (!reg) return;
    const sub = await reg.pushManager.getSubscription(); if (!sub) return;
    try { if (code) await rpc("remove_push_subscription", { p_access_code: code, p_endpoint: sub.endpoint }); } catch (e) {}
    await sub.unsubscribe(); ls.set("nf-sub-who", "");
  }

  async function systemNotify(n) {
    if (!canNotify || Notification.permission !== "granted") return;
    try {
      const reg = await getReg();
      const opts = { body: n.body || "", tag: n.id, icon: "assets/icons/icon-192.png", badge: "assets/icons/badge-96.png", dir: "rtl", lang: "fa", data: { url: n.url || "./" } };
      if (reg) await reg.showNotification(n.title, opts); else new Notification(n.title, opts);
    } catch (e) {}
  }

  /* ---------- Polling ---------- */
  let list = [], busy = false, first = true;
  async function poll(manual) {
    const { code, who } = creds(); if (!code || !who || busy) return;
    busy = true;
    try {
      const rows = await rpc("get_notifications", { p_access_code: code, p_who: who, p_limit: 30 });
      list = rows || [];
      const unseen = list.filter((n) => !n.seen_at);
      setBadge(unseen.length);
      const fresh = unseen.filter((n) => !shown.has(n.id));
      fresh.slice(0, 4).reverse().forEach((n) => { toast(n.title, n.body, openPanel); if (!document.hidden) systemNotify(n); });
      fresh.forEach((n) => remember(n.id));
      if (panel.classList.contains("open")) renderPanel();
    } catch (e) { if (manual) console.warn("notifications:", e.message); }
    finally { busy = false; first = false; }
  }

  /* ---------- Panel ---------- */
  function perm() { return canNotify ? Notification.permission : "unsupported"; }
  function renderPanel() {
    panel.innerHTML = "";
    const { who } = creds();
    panel.append(el("h4", "", "🔔 اعلان‌ها" + (who ? " — " + who : "")));
    const acts = el("div", "nf-actions"); panel.append(acts);
    const msg = el("div", "nf-msg"); panel.append(msg);
    const p = perm();
    const subWho = ls.get("nf-sub-who");
    if (!supported || !push.vapidPublicKey) {
      msg.textContent = /iphone|ipad|ipod/i.test(navigator.userAgent) ? "برای اعلان در آیفون: صفحه را با «Add to Home Screen» به صفحهٔ اصلی اضافه کن و از همان‌جا باز کن." : "این مرورگر از اعلان پس‌زمینه پشتیبانی نمی‌کند؛ تا وقتی صفحه باز است اعلان‌ها را می‌بینی.";
    } else if (p === "denied") {
      msg.textContent = "اعلان‌ها در تنظیمات مرورگر بسته شده‌اند؛ از تنظیمات سایت اجازه بده.";
    } else if (p !== "granted" || subWho !== who) {
      const on = el("button", "p2-btn", "🔔 فعال‌سازی اعلان‌ها"); on.type = "button";
      on.onclick = async () => {
        on.disabled = true; msg.textContent = "";
        try {
          let c = creds();
          if ((!c.code || !c.who) && window.P2x && window.P2x.askAccess) { await window.P2x.askAccess(); c = creds(); }
          if (!c.code || !c.who) { msg.textContent = "اول رمز مشترک و نامت را انتخاب کن."; on.disabled = false; return; }
          const r = await Notification.requestPermission();
          if (r !== "granted") { msg.textContent = "اجازهٔ اعلان داده نشد."; renderPanel(); return; }
          const ok = await subscribe();
          msg.textContent = ok ? "اعلان‌ها فعال شد 🤍" : "فعال‌سازی کامل نشد؛ دوباره تلاش کن.";
          await poll(true); renderPanel(); if (ok) msg.textContent = "اعلان‌ها فعال شد 🤍";
        } catch (e) { msg.textContent = "فعال‌سازی ممکن نشد."; on.disabled = false; }
      };
      acts.append(on);
    } else {
      msg.textContent = "اعلان‌ها روی این دستگاه فعال است ✓";
      const off = el("button", "p2-btn secondary", "خاموش کردن"); off.type = "button";
      off.onclick = async () => { await unsubscribe(); renderPanel(); };
      acts.append(off);
    }
    if (window.Themes) { const tb = el("button", "p2-btn secondary", "🎨 تم‌ها"); tb.type = "button"; tb.onclick = () => { panel.classList.remove("open"); window.Themes.openPicker(); }; acts.append(tb); }
    if (window.__installPrompt) { const ins = el("button", "p2-btn secondary", "📲 نصب سایت مثل اپ"); ins.type = "button"; ins.onclick = async () => { try { window.__installPrompt.prompt(); await window.__installPrompt.userChoice; } catch (e) {} window.__installPrompt = null; renderPanel(); }; acts.append(ins); }
    const { code } = creds();
    if (!code || !who) {
      const login = el("button", "p2-btn secondary", "🔐 ورود با رمز مشترک"); login.type = "button";
      login.onclick = async () => { if (window.P2x && window.P2x.askAccess) { await window.P2x.askAccess(); renderPanel(); poll(true); } };
      acts.append(login); return;
    }
    if (!list.length) { panel.append(el("div", "nf-msg", "هنوز اعلانی نیست 🤍")); return; }
    list.forEach((n) => {
      const it = el("div", "nf-item" + (n.seen_at ? "" : " new")); it.append(el("b", "", n.title));
      if (n.body) it.append(el("p", "", n.body)); it.append(el("small", "", ago(n.created_at))); panel.append(it);
    });
  }
  async function openPanel() {
    renderPanel(); panel.classList.add("open"); await poll(true);
    const { code, who } = creds();
    if (code && who && list.some((n) => !n.seen_at)) {
      try { await rpc("mark_notifications_seen", { p_access_code: code, p_who: who }); setTimeout(() => { setBadge(0); }, 1500); } catch (e) {}
    }
  }
  bell.onclick = () => { if (panel.classList.contains("open")) { panel.classList.remove("open"); poll(); } else openPanel(); };
  document.addEventListener("click", (e) => { if (panel.classList.contains("open") && !panel.contains(e.target) && !bell.contains(e.target)) { panel.classList.remove("open"); poll(); } });

  /* ---------- سالگرد / ماهگرد (محلی؛ مکمل سرور) ---------- */
  function localAnniversary() {
    try {
      const iso = window.CLOUD_START_DATE || (typeof START_DATE !== "undefined" ? START_DATE : "");
      const J = window.JDate; if (!iso || !J) return;
      const sj = J.isoToJalali(iso); if (!sj) return;
      const z = new Date(Date.now() + 3.5 * 3600000), gy = z.getUTCFullYear(), gm = z.getUTCMonth() + 1, gd = z.getUTCDate();
      const tj = J.toJalali(gy, gm, gd), len = J.jalaliMonthLength(tj.jy, tj.jm);
      if (tj.jd !== Math.min(sj.jd, len)) return;
      const months = (tj.jy - sj.jy) * 12 + (tj.jm - sj.jm); if (months <= 0) return;
      const key = "nf-anniv-" + gy + "-" + gm + "-" + gd; if (ls.get(key)) return; ls.set(key, "1");
      if (months % 12 === 0) toast("🎉 سالگرد ما مبارک!", `امروز ${fa(months / 12)} سالگی ماست 💞`);
      else toast("💞 ماهگرد ما مبارک!", `امروز ${fa(months)} ماه از شروع ما می‌گذرد 🤍`);
    } catch (e) {}
  }

  /* ---------- راه‌اندازی ---------- */
  const syncVisibility = () => { const gate = document.getElementById("gate"); bell.classList.toggle("show", !gate || document.body.classList.contains("locked") === false); };
  const iv = setInterval(() => { syncVisibility(); if (!document.getElementById("gate")) clearInterval(iv); }, 400); syncVisibility();

  async function boot() {
    const { code, who } = creds();
    if (code && who) {
      await poll();
      if (supported && push.vapidPublicKey && perm() === "granted") { try { await subscribe(); } catch (e) {} }
    }
    setTimeout(localAnniversary, 3500); setTimeout(localAnniversary, 11000);
  }
  boot();
  setInterval(() => { if (!document.hidden) poll(); }, 45000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
  window.addEventListener("storage", (e) => { if (e.key === "acode" || e.key === "who") poll(); });
  window.addEventListener("p2-auth", async () => { await poll(true); if (supported && push.vapidPublicKey && perm() === "granted") { try { await subscribe(); } catch (e) {} } });
  window.NF = { poll, openPanel };
  // وقتی کاربر رمز را وارد می‌کند (modal)، کمی بعد اعلان‌ها را بخوان
  const mo = new MutationObserver(() => { if (creds().code && creds().who && first) poll(); });
  mo.observe(document.body, { childList: true });
})();
