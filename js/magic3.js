/* ME & YOU — magic3: چت، بازی، فیلم خاطرات، شمارندهٔ دلتنگی، فصل‌ها، پیشرفت آرزوها */
(() => {
  "use strict";
  const doc = document;
  const $ = (s, r = doc) => r.querySelector(s);
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mob = matchMedia("(max-width:700px), (pointer:coarse)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const ls = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const el = (t, c, x) => { const e = doc.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const cfg = window.SUPABASE_CONFIG || {};
  const base = String(cfg.url || "").replace(/\/$/, ""), key = cfg.anonKey || "";
  const hdr = () => { const h = { apikey: key, "Content-Type": "application/json" }; if (/^eyJ/.test(key)) h.Authorization = "Bearer " + key; return h; };
  const read = (table, q) => fetch(`${base}/rest/v1/${table}?${q}`, { headers: hdr() }).then((r) => { if (!r.ok) throw Error(table); return r.json(); });
  const rpc = (n, b) => fetch(`${base}/rest/v1/rpc/${n}`, { method: "POST", headers: hdr(), body: JSON.stringify(b || {}) }).then((r) => { if (!r.ok) throw Error(n); return r.json(); });
  const who = () => ls.get("who");
  const other = (w) => (w === "ماجی" ? "محمد" : "ماجی");
  const vibe = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const code = () => (window.P2x && P2x.getCode && P2x.getCode()) || "";
  const login = async () => { try { if (window.P2x && P2x.askAccess) await P2x.askAccess(); } catch (e) {} return code(); };
  const emit = (e, p) => { try { window.LiveBus && LiveBus.emit(e, p); } catch (x) {} };
  const partnerOn = () => { try { return !!(window.LiveBus && LiveBus.partnerOn()); } catch (e) { return false; } };
  const whenEl = (sel, cb) => { const f = $(sel); if (f) return cb(f); const mo = new MutationObserver(() => { const e = $(sel); if (e) { mo.disconnect(); cb(e); } }); mo.observe(doc.body, { childList: true, subtree: true }); };
  const place = (sec) => { const main = $("main"); if (!main) return; const a = $("#finalSection") || $(".ending"); a ? main.insertBefore(sec, a) : main.append(sec); if (window.EmojiFix) sec.querySelectorAll(".section-title").forEach((h) => EmojiFix.wrap(h)); };
  const mkSection = (id, title, sub) => { const s = el("section", "phase2-section reveal show"); s.id = id; s.append(el("h2", "section-title", title), el("p", "section-sub", sub)); return s; };

  /* ================= آتش‌بازی ================= */
  function fireworks(n = 4) {
    if (rm) return;
    let cv = $("#fwCanvas"); if (!cv) { cv = el("canvas"); cv.id = "fwCanvas"; doc.body.append(cv); }
    const ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; const P = [];
    const cols = ["#ff7aa2", "#F6D9A8", "#ffffff", "#ef5b7c", "#d4c1ff"];
    for (let k = 0; k < n; k++) setTimeout(() => {
      const x = rand(.2, .8) * cv.width, y = rand(.18, .5) * cv.height, c = cols[k % cols.length], cnt = mob ? 36 : 60;
      for (let i = 0; i < cnt; i++) { const a = i / cnt * 6.283, v = rand(2, 6) * dpr; P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c }); }
    }, k * 380);
    if (cv._run) return; cv._run = true;
    const loop = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx; p.y += p.vy; p.vy += .06 * dpr; p.vx *= .985; p.l -= .014; if (p.l <= 0) { P.splice(i, 1); continue; } ctx.globalAlpha = p.l; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * dpr, 0, 6.3); ctx.fill(); }
      if (P.length || performance.now() < cv._until) requestAnimationFrame(loop); else { cv._run = false; cv.remove(); }
    };
    cv._until = performance.now() + n * 380 + 400; requestAnimationFrame(loop);
  }
  window.MagicFx = Object.assign(window.MagicFx || {}, { fireworks });

  /* ================= پیشرفت آرزوها ================= */
  let wishDone = -1, wishRaf = 0;
  function decorateWishes() {
    wishRaf = 0;
    const lis = [...doc.querySelectorAll("li")].filter((li) => li.querySelector(":scope > .wish-hearts"));
    if (!lis.length) return;
    lis.forEach((li) => {
      const ticks = li.querySelectorAll(".wish-h.on").length, pct = li.classList.contains("done") ? 100 : ticks * 50;
      let bar = li.querySelector(":scope > .wish-bar");
      if (!bar) { bar = el("div", "wish-bar"); bar.append(el("i")); li.append(bar); }
      const i = bar.firstChild; if (i.style.width !== pct + "%") i.style.width = pct + "%";
    });
    const done = lis.filter((li) => li.classList.contains("done")).length;
    if (wishDone >= 0 && done > wishDone) { fireworks(4); vibe([40, 60, 40, 60, 80]); }
    wishDone = done;
  }
  new MutationObserver(() => { if (!wishRaf) wishRaf = requestAnimationFrame(decorateWishes); }).observe(doc.body, { childList: true, subtree: true });

  /* ================= فصل‌ها ================= */
  function seasons() {
    if (rm || !window.JDate) return;
    const z = new Date(Date.now() + 3.5 * 3600000), tj = JDate.toJalali(z.getUTCFullYear(), z.getUTCMonth() + 1, z.getUTCDate());
    const s = tj.jm <= 3 ? "spring" : tj.jm <= 6 ? "summer" : tj.jm <= 9 ? "autumn" : "winter";
    const cv = el("canvas"); cv.id = "seasonFx"; doc.body.append(cv); const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1; const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const N = mob ? 20 : 42, col = { spring: ["#ffc2d4", "#ffdce6", "#fff"], autumn: ["#d9822b", "#b5502a", "#e8b04a", "#9c3d1e"], winter: ["#ffffff", "#e6f0ff"], summer: ["#ffe08a", "#fff3b0"] }[s];
    const mk = (init) => ({ x: rand(0, W), y: init ? rand(0, H) : rand(-40, -5), v: rand(.5, 1.6), s: rand(4, 10), r: rand(0, 6), vr: rand(-.03, .03), sw: rand(0, 6), c: col[Math.floor(Math.random() * col.length)], p: rand(0, 6) });
    const P = Array.from({ length: N }, () => mk(true)); let last = 0, run = true;
    const draw = (t) => {
      if (!run) return; requestAnimationFrame(draw); if (doc.hidden || t - last < 33) return; last = t; ctx.clearRect(0, 0, W, H);
      P.forEach((p, i) => {
        p.sw += .02; p.r += p.vr;
        if (s === "summer") { p.x += Math.sin(p.sw) * .5; p.y += Math.cos(p.sw * .7) * .4; const a = .25 + .6 * Math.abs(Math.sin(t / 900 + p.p)); ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.shadowColor = "#ffe08a"; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, 6.3); ctx.fill(); ctx.shadowBlur = 0; return; }
        p.y += p.v * (s === "winter" ? .8 : 1); p.x += Math.sin(p.sw) * (s === "winter" ? .6 : 1);
        if (p.y > H + 20) P[i] = mk(false);
        ctx.save(); ctx.globalAlpha = .8; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (s === "winter") { ctx.beginPath(); ctx.arc(0, 0, p.s / 3, 0, 6.3); ctx.fill(); }
        else if (s === "spring") { ctx.beginPath(); ctx.ellipse(0, 0, p.s * .8, p.s * .45, 0, 0, 6.3); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.quadraticCurveTo(p.s, 0, 0, p.s); ctx.quadraticCurveTo(-p.s, 0, 0, -p.s); ctx.fill(); }
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    };
    requestAnimationFrame(draw);
  }

  /* ================= شمارندهٔ دلتنگی ================= */
  function buildMiss() {
    const sec = mkSection("missStats", "📊 شمارندهٔ دلتنگی", "هر بار دلتنگ شدی بزن؛ ببین این ماه چند بار دلتنگ هم بوده‌اید.");
    const body = el("div"); sec.append(body); place(sec);
    const month = () => { const z = new Date(Date.now() + 3.5 * 3600000); const j = JDate.toJalali(z.getUTCFullYear(), z.getUTCMonth() + 1, z.getUTCDate()); return j; };
    const jm = (iso) => { const z = new Date(new Date(iso).getTime() + 3.5 * 3600000); return JDate.toJalali(z.getUTCFullYear(), z.getUTCMonth() + 1, z.getUTCDate()); };
    async function render() {
      body.innerHTML = "";
      if (!code() || !who()) { const b = el("div", "ms-act"); const bt = el("button", "", "🔐 ورود با رمز مشترک"); bt.type = "button"; bt.onclick = async () => { await login(); render(); }; b.append(bt); body.append(b); return; }
      let rows = []; try { rows = await rpc("get_miss_you", { p_access_code: code() }); } catch (e) { body.append(el("div", "ms-note", "بارگیری نشد.")); return; }
      const t = month(), cnt = { "ماجی": [0, 0, 0], "محمد": [0, 0, 0] }, today = new Date().toDateString();
      rows.forEach((r) => { const c = cnt[r.author]; if (!c) return; c[2]++; const j = jm(r.created_at); if (j.jy === t.jy && j.jm === t.jm) c[0]++; if (new Date(r.created_at).toDateString() === today) c[1]++; });
      const g = el("div", "ms-grid");
      ["ماجی", "محمد"].forEach((n) => { const c = el("div", "ms-card"); c.append(el("small", "", n + (n === who() ? " (تو)" : "")), el("b", "", fa(cnt[n][0])), el("small", "", "این ماه · امروز " + fa(cnt[n][1]))); g.append(c); });
      const act = el("div", "ms-act"), bt = el("button", "", "💗 دلتنگ شدم"); bt.type = "button"; const note = el("div", "ms-note");
      bt.onclick = async () => { bt.disabled = true; try { const ok = await rpc("send_miss_you", { p_access_code: code(), p_who: who() }); note.textContent = ok ? `برای ${other(who())} فرستاده شد 💗` : "همین الان فرستادی؛ یک دقیقه صبر کن 🤍"; if (ok) { vibe([40, 80, 40]); if (window.MagicFx && MagicFx.confetti) MagicFx.confetti(1800); setTimeout(render, 900); } } catch (e) { note.textContent = "ارسال نشد."; } setTimeout(() => (bt.disabled = false), 1500); };
      act.append(bt); body.append(g, act, note);
    }
    render(); window.addEventListener("p2-auth", render);
  }

  /* ================= فیلم خاطرات ================= */
  function buildMovie() {
    read("gallery_photos", "select=id,title,storage_path,created_at&order=created_at.asc&limit=80").then((rows) => {
      const url = (p) => `${base}/storage/v1/object/public/gallery/${String(p).split("/").map(encodeURIComponent).join("/")}`;
      let ph = rows.filter((r) => r.storage_path).map((r) => ({ u: url(r.storage_path), t: r.title || "" }));
      if (!ph.length) return;
      if (ph.length > 30) { const st = ph.length / 30; ph = Array.from({ length: 30 }, (_, i) => ph[Math.floor(i * st)]); }
      const sec = mkSection("movieSection", "🎬 فیلم خاطرات ما", "عکس‌هایمان یکی‌یکی، مثل یک فیلم کوتاه از قصهٔ ما.");
      const b = el("button", "mv-start", "▶️ پخش فیلم"); b.type = "button"; sec.append(b); place(sec);
      b.onclick = () => play(ph);
    }).catch(() => {});
    function play(ph) {
      const o = el("div", ""); o.id = "movie";
      const imgs = [el("img", "mv-img"), el("img", "mv-img")]; imgs.forEach((i) => { i.alt = ""; i.decoding = "async"; });
      const shade = el("div", "mv-shade"), cap = el("div", "mv-cap"), bar = el("div", "mv-bar"), fill = el("i"); bar.append(fill);
      const x = el("button", "mv-x", "✕"); x.type = "button"; const pp = el("button", "mv-p", "⏸"); pp.type = "button";
      const end = el("div", "mv-end"); const h = el("h3", "", "دوستت دارم ♥"); const days = (() => { const iso = window.CLOUD_START_DATE || (typeof START_DATE !== "undefined" ? START_DATE : ""); if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return Math.max(0, Math.round((Date.now() - new Date(y, m - 1, d)) / 86400000)); })();
      end.append(h, el("p", "", days !== "" ? `${fa(days)} روز با هم، و ادامه دارد…` : "و ادامه دارد…"));
      o.append(...imgs, shade, cap, bar, x, pp, end); doc.body.append(o);
      let i = 0, cur = 0, paused = false, timer = 0, closed = false; const DUR = 4800;
      const show = () => {
        if (closed) return; if (i >= ph.length) { end.classList.add("on"); if (window.MagicFx) { MagicFx.confetti(5000); } fill.style.width = "100%"; return; }
        const im = imgs[cur], prev = imgs[1 - cur]; im.style.setProperty("--mx", rand(-18, 18) + "px"); im.style.setProperty("--my", rand(-14, 14) + "px");
        im.classList.remove("show"); void im.offsetWidth; im.src = ph[i].u;
        const go = () => { im.classList.add("show"); prev.classList.remove("show"); cap.textContent = ph[i].t; fill.style.width = ((i + 1) / ph.length * 100) + "%"; i++; cur = 1 - cur; timer = setTimeout(() => { if (!paused) show(); else wait(); }, DUR); };
        if (im.complete && im.naturalWidth) go(); else { im.onload = go; im.onerror = () => { i++; show(); }; }
      };
      const wait = () => { if (closed) return; if (paused) setTimeout(wait, 300); else show(); };
      pp.onclick = () => { paused = !paused; pp.textContent = paused ? "▶️" : "⏸"; };
      const close = () => { closed = true; clearTimeout(timer); o.remove(); };
      x.onclick = close; end.onclick = close; show();
    }
  }

  /* ================= پیوند به صفحه‌های جدا (چت و فضای مشترک) ================= */
  function buildNav() {
    const mk = (id, href, ico, label) => { const a = el("a"); a.id = id; a.href = href; a.setAttribute("aria-label", label); a.append(el("span", "", ico)); doc.body.append(a); return a; };
    const chat = mk("chatBtn", "chat.html", "💬", "چت"), tg = mk("togetherBtn", "together.html", "🎮", "فضای مشترک");
    const dot = el("span", "nf-dot"); chat.append(dot);
    setInterval(() => { const ok = !$("#gate") && !!who(); chat.classList.toggle("show", ok); tg.classList.toggle("show", ok); }, 500);
    async function unread() {
      if (!code() || !who()) return;
      try { const seen = +ls.get("chat-seen") || 0; const rows = await rpc("get_chat", { p_access_code: code(), p_limit: 30 }); const n = rows.filter((r) => r.author !== who() && !r.deleted_at && new Date(r.created_at).getTime() > seen).length; dot.textContent = n > 9 ? "۹+" : fa(n); dot.classList.toggle("on", n > 0); } catch (e) {}
    }
    window.addEventListener("p2-auth", unread); setInterval(() => { if (!doc.hidden) unread(); }, 60000);
  }

  /* ================= راه‌اندازی ================= */
  seasons();
  whenEl("main", () => setTimeout(() => { buildMiss(); buildMovie(); }, 1300));
  buildNav();
})();
