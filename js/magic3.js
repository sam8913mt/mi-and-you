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

  /* ================= بازی دوز ================= */
  function buildGame() {
    const sec = mkSection("gameSection", "🎮 بازی دونفره", "دوز عاشقانه: ماجی 🌸 و محمد 🌙. اگر او آنلاین باشد، زنده بازی می‌کنید؛ وگرنه با کامپیوتر.");
    const wrap = el("div", "g-wrap"), st = el("div", "g-status", "برای شروع «بازی جدید» را بزن"), bd = el("div", "g-board"), sc = el("div", "g-score");
    const tools = el("div", "m2-tools"), nb = el("button", "", "🎲 بازی جدید"); nb.type = "button"; tools.append(nb);
    wrap.append(st, bd, sc, tools); sec.append(wrap); place(sec);
    const MARK = { "ماجی": "🌸", "محمد": "🌙" }, L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let b = Array(9).fill(""), turn = "", live = false, over = true, winLine = [];
    const score = () => { try { return JSON.parse(ls.get("ttt-score") || "{}"); } catch (e) { return {}; } };
    const showScore = () => { const s = score(); sc.textContent = `بازی‌های زنده — ماجی ${fa(s["ماجی"] || 0)} · محمد ${fa(s["محمد"] || 0)} · مساوی ${fa(s.d || 0)}`; };
    const cells = Array.from({ length: 9 }, (_, i) => { const c = el("button", "g-cell"); c.type = "button"; c.onclick = () => tap(i); bd.append(c); return c; });
    const paint = () => {
      cells.forEach((c, i) => { c.textContent = b[i] ? MARK[b[i]] : ""; c.classList.toggle("win", winLine.includes(i)); });
      const me = who();
      if (over) return;
      st.textContent = turn === me ? "نوبت توست 💗" : (live ? `منتظر ${turn}…` : "کامپیوتر دل فکر می‌کند…");
    };
    const check = () => { for (const l of L) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return l; return b.every(Boolean) ? "draw" : null; };
    const finish = (res) => {
      over = true;
      if (res === "draw") { st.textContent = "مساوی شد 🤝"; winLine = []; }
      else { winLine = res; const w = b[res[0]]; st.textContent = w === who() ? "بردی! 🎉" : `${w} برد 🏆`; if (w === who()) { vibe([40, 60, 40]); if (window.MagicFx && MagicFx.confetti) MagicFx.confetti(2200); } }
      if (live) { const s = score(); const k = res === "draw" ? "d" : b[res[0]]; s[k] = (s[k] || 0) + 1; ls.set("ttt-score", JSON.stringify(s)); showScore(); }
      paint();
    };
    const play = (i, by) => { if (over || b[i] || turn !== by) return false; b[i] = by; const r = check(); if (r) finish(r); else { turn = other(by); paint(); } return true; };
    const ai = () => {
      if (over || live) return; const me = who(), cpu = other(me); if (turn !== cpu) return;
      const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      const find = (m) => { for (const l of L) { const v = l.map((i) => b[i]); if (v.filter((x) => x === m).length === 2 && v.includes("")) return l[v.indexOf("")]; } return -1; };
      let m = find(cpu); if (m < 0) m = find(me); if (m < 0 && !b[4]) m = 4; if (m < 0) m = free[Math.floor(Math.random() * free.length)];
      setTimeout(() => play(m, cpu), 600);
    };
    function tap(i) {
      if (over) return; const me = who(); if (!me || turn !== me) return;
      if (play(i, me)) { if (live) emit("ttt", { t: "move", i, by: me }); else ai(); }
    }
    function start(first, isLive) { b = Array(9).fill(""); winLine = []; over = false; live = isLive; turn = first; paint(); if (!live) ai(); }
    nb.onclick = () => {
      const me = who(); if (!me) { st.textContent = "اول نقشت را انتخاب کن"; return; }
      const isLive = partnerOn(); start(me, isLive); if (isLive) emit("ttt", { t: "new", first: me });
    };
    window.addEventListener("live:ttt", (e) => {
      const d = e.detail || {}; if (d.t === "new") start(d.first, true); else if (d.t === "move" && live && !over) play(d.i, d.by);
    });
    showScore(); paint();
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

  /* ================= چت ================= */
  function buildChat() {
    const btn = el("button", ""); btn.id = "chatBtn"; btn.type = "button"; btn.setAttribute("aria-label", "چت");
    const dot = el("span", "nf-dot"); btn.append(el("span", "", "💬"), dot);
    const p = el("div", ""); p.id = "chatPanel";
    const head = el("div", "ch-head"), st = el("span", "ch-dot"), ttl = el("div"); const tn = el("b", "", "چت"), ts = el("small", "", "");
    ttl.append(tn, ts); const cx = el("button", "ch-x", "✕"); cx.type = "button"; head.append(st, ttl, cx);
    const list = el("div", "ch-list"), typ = el("div", "ch-typing", ""), stk = el("div", "ch-stk");
    ["😘", "🥰", "💗", "😂", "🤗", "🌹", "✨", "😴", "🫂", "💋", "🥺", "💞"].forEach((e) => { const b = el("button", "", e); b.type = "button"; b.onclick = () => send(e); stk.append(b); });
    const inp = el("div", "ch-in"), ta = el("textarea"); ta.rows = 1; ta.maxLength = 1000; ta.placeholder = "پیامت را بنویس…";
    const sb = el("button", "", "➤"); sb.type = "button"; sb.setAttribute("aria-label", "ارسال"); inp.append(ta, sb);
    p.append(head, list, typ, stk, inp); doc.body.append(btn, p);
    let msgs = [], ids = new Set(), pollT = 0, lastDay = "", seenTs = +ls.get("chat-seen") || 0, openP = false, typeT = 0, lastType = 0;
    const me = () => who(), you = () => other(who() || "ماجی");
    const status = () => { const on = partnerOn(); st.classList.toggle("on", on); ts.textContent = on ? "آنلاین" : "آفلاین"; tn.textContent = you(); };
    const fit = () => { const v = window.visualViewport; p.style.height = (v ? v.height : innerHeight) + "px"; p.style.top = (v ? v.offsetTop : 0) + "px"; };
    if (window.visualViewport) { visualViewport.addEventListener("resize", () => { fit(); list.scrollTop = list.scrollHeight; }); visualViewport.addEventListener("scroll", fit); }
    const fmtT = (iso) => new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    const bubble = (m) => {
      const d = new Date(m.created_at).toLocaleDateString("fa-IR"); if (d !== lastDay) { lastDay = d; list.append(el("div", "ch-day", d)); }
      const isMe = m.author === me(), emo = /^(\p{Extended_Pictographic}|\ufe0f|\u200d|\s){1,6}$/u.test(m.body);
      const b = el("div", "ch-msg " + (isMe ? "me" : "you") + (emo ? " big" : "")); b.append(doc.createTextNode(m.body), el("small", "", fmtT(m.created_at))); list.append(b);
    };
    const render = (stick) => { const near = list.scrollHeight - list.scrollTop - list.clientHeight < 120; list.innerHTML = ""; lastDay = ""; if (!code() || !me()) { lock(); return; } msgs.forEach(bubble); if (stick || near) list.scrollTop = list.scrollHeight; };
    const lock = () => { const l = el("div", "ch-lock"); l.append(doc.createTextNode("برای چت، اول با رمز مشترک وارد شو 🔐")); const b = el("button", "", "ورود"); b.type = "button"; b.onclick = async () => { await login(); await load(true); }; l.append(el("br"), b); list.append(l); };
    const add = (m) => { if (ids.has(m.id)) return false; ids.add(m.id); msgs.push(m); msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); return true; };
    async function load(stick) {
      if (!code() || !me()) { render(); return; }
      try { const rows = await rpc("get_chat", { p_access_code: code(), p_limit: 80 }); let ch = false; rows.forEach((r) => { if (add(r)) ch = true; }); if (ch || stick) render(stick); markSeen(); }
      catch (e) { if (!msgs.length) { list.innerHTML = ""; list.append(el("div", "ch-day", "چت هنوز راه‌اندازی نشده (فایل SQL چت را اجرا کن)")); } }
    }
    const markSeen = () => { if (!openP) return; const last = msgs.length ? new Date(msgs[msgs.length - 1].created_at).getTime() : 0; if (last > seenTs) { seenTs = last; ls.set("chat-seen", String(seenTs)); } dot.classList.remove("on"); };
    async function checkUnread() {
      if (openP || !code() || !me()) return;
      try { const rows = await rpc("get_chat", { p_access_code: code(), p_limit: 30 }); const n = rows.filter((r) => r.author !== me() && new Date(r.created_at).getTime() > seenTs).length; dot.textContent = n > 9 ? "۹+" : fa(n); dot.classList.toggle("on", n > 0); } catch (e) {}
    }
    async function send(text) {
      const t = String(text == null ? ta.value : text).trim(); if (!t) return;
      if (!code()) { await login(); if (!code()) return; }
      if (text == null) { ta.value = ""; ta.style.height = ""; }
      const tmp = "tmp" + Date.now(), m = { id: tmp, author: me(), body: t, created_at: new Date().toISOString() }; add(m); render(true);
      try {
        const r = await rpc("send_chat", { p_access_code: code(), p_who: me(), p_body: t }); const row = Array.isArray(r) ? r[0] : r;
        if (row && row.id) { ids.delete(tmp); msgs = msgs.filter((x) => x.id !== tmp); const real = { id: row.id, author: me(), body: t, created_at: row.created_at }; add(real); render(true); emit("chat", { id: row.id, body: t, ts: row.created_at }); }
        else throw Error("x");
      } catch (e) { msgs = msgs.filter((x) => x.id !== tmp); ids.delete(tmp); render(true); ta.value = t; }
    }
    sb.onclick = () => send(); ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !mob) { e.preventDefault(); send(); } });
    ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(120, ta.scrollHeight) + "px"; const n = Date.now(); if (n - lastType > 2000) { lastType = n; emit("typing", {}); } });
    window.addEventListener("live:chat", (e) => { const d = e.detail || {}; if (!d.id) return; if (add({ id: d.id, author: you(), body: d.body, created_at: d.ts || new Date().toISOString() })) { if (openP) { render(); markSeen(); } else { dot.textContent = "۱"; dot.classList.add("on"); } vibe(30); } });
    window.addEventListener("live:typing", () => { typ.textContent = `${you()} در حال نوشتن…`; clearTimeout(typeT); typeT = setTimeout(() => (typ.textContent = ""), 3000); });
    window.addEventListener("live:presence", status);
    function open() { openP = true; p.classList.add("open"); fit(); status(); load(true); clearInterval(pollT); pollT = setInterval(() => { if (!doc.hidden) load(); }, 7000); doc.body.style.overflow = "hidden"; setTimeout(() => (list.scrollTop = list.scrollHeight), 60); }
    function close() { openP = false; p.classList.remove("open"); clearInterval(pollT); doc.body.style.overflow = ""; }
    btn.onclick = open; cx.onclick = close;
    window.addEventListener("p2-auth", () => { if (openP) load(true); else checkUnread(); });
    const iv = setInterval(() => { btn.classList.toggle("show", !$("#gate") && !!me()); }, 500);
    setInterval(() => { if (!doc.hidden) checkUnread(); }, 60000);
    window.Chat = { open, close };
  }

  /* ================= راه‌اندازی ================= */
  seasons();
  whenEl("main", () => setTimeout(() => { buildGame(); buildMiss(); buildMovie(); }, 1300));
  buildChat();
})();
