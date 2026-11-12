/* ME & YOU — extra sections (timeline, reasons, wishes, songs, voice, funny, learned,
   coupons, promises, "when you're sad", game, guestbook, final surprise). Public reads only. */
(() => {
  const P = window.P2;
  if (!P || !document.querySelector("main")) return;
  const { section, read, fa, apiHeaders, base, ready, envelope } = P;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const burst = (x, y, n) => { try { window.MY && window.MY.burst && window.MY.burst(x, y, n); } catch (e) {} };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const jalali = (iso) => { try { const j = window.JDate.isoToJalali(iso); return j ? window.JDate.formatJalali(j) : ""; } catch (e) { return ""; } };
  const audioUrl = (path) => `${base}/storage/v1/object/public/videos/${String(path).split("/").map(encodeURIComponent).join("/")}`;

  /* ---------- sections (hidden until they have content) ---------- */
  const defs = {
    timeline: ["timelineSection", "🕰️ خط زمانی ما", "لحظه‌هایی که قصه‌ی ما را ساختند."],
    reason: ["reasonsSection", "💕 دلیل‌های دوست داشتنت", "روی دکمه بزن تا یک دلیل دیگر باز شود."],
    wish: ["wishesSection", "🌠 آرزوها و برنامه‌های ما", "کارهایی که با هم می‌کنیم؛ هر کدام که شد، تیک می‌خورد."],
    song: ["songsSection", "🎶 آهنگ‌های ما", "هر آهنگ، یک خاطره."],
    voice: ["voiceSection", "🎙️ صدای من", "بزن و گوش کن؛ این بار من حرف می‌زنم."],
    funny: ["funnySection", "😂 لحظه‌های خنده‌دار", "چیزهایی که فقط ما می‌فهمیم."],
    learned: ["learnedSection", "🌱 چیزهایی که از تو یاد گرفتم", "تو بدون اینکه بدانی، معلم من بودی."],
    coupon: ["couponsSection", "🎟️ کوپن‌های عشق", "یکی را انتخاب کن؛ قولش با من."],
    promise: ["promisesSection", "🤝 قول‌های من", "چیزهایی که به تو قول می‌دهم."],
    whenever: ["wheneverSection", "🫂 اگر دلت گرفت", "هر پاکت را برای یک حال خاص نوشته‌ایم."],
    album: ["albumSection", "📷 آلبوم مشترک", "عکس‌هایی که هر دو جمع کرده‌ایم."]
  };
  const secs = {};
  Object.entries(defs).forEach(([k, [id, t, s]]) => { const e = section(id, t, s); e.hidden = true; secs[k] = e; });
  const gameSec = section("gameSection", "🧩 بازی خاطره‌ها", "کارت‌های هم‌جفت را پیدا کن.");
  const guestSec = section("guestbookSection", "📖 دفترچه مشترک ما", "جایی که هر دو می‌توانیم برای هم بنویسیم.");
  const finalSec = section("finalSection", "🎁 سورپرایز نهایی", "");
  finalSec.hidden = true;

  /* ---------- identity + shared access code ---------- */
  const NAMES = ["ماجی", "محمد"];
  const other = (w) => (w === "ماجی" ? "محمد" : "ماجی");
  const ls = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { localStorage.removeItem(k); } catch (e) {} } };
  const getWho = () => ls.get("who");
  ls.del("acode");
  const ss = { get: (k) => { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} } };
  let codeCache = ss.get("acode"); // فقط در همین نشست؛ با خروج فراموش می‌شود (session.js)
  const openers = []; const reopenAll = (force) => openers.forEach((f) => f(force));
  const rpc = (name, body) => fetch(`${base}/rest/v1/rpc/${name}`, { method: "POST", headers: apiHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(body || {}) }).then((r) => { if (!r.ok) throw Error(name); return r.json(); });
  const ago = (iso) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); if (m < 1) return "همین الان"; if (m < 60) return fa(m) + " دقیقه پیش"; const h = Math.round(m / 60); if (h < 24) return fa(h) + " ساعت پیش"; return fa(Math.round(h / 24)) + " روز پیش"; };
  const tehranDay = (offset = 0) => new Date(Date.now() + 3.5 * 3600000 - offset * 86400000).toISOString().slice(0, 10);
  const by = (r) => (r.extra && r.extra.author ? el("small", "by", "✍️ " + r.extra.author) : null);

  function askAccess() {
    if (codeCache && getWho()) return Promise.resolve({ code: codeCache, who: getWho() });
    return new Promise((resolve) => {
      const who = getWho();
      const ov = el("div", "code-modal"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
      const box = el("div", "code-box");
      const lock = el("div", "lock-heart"); lock.innerHTML = '<span class="lh-shackle"></span><span class="lh-body">♥</span>';
      const input = el("input", "p2-input"); input.type = "password"; input.placeholder = "رمز مشترک"; input.autocomplete = "current-password";
      const msg = el("div", "code-msg"); const ok = el("button", "p2-btn", "تأیید"); ok.type = "button"; const no = el("button", "p2-btn secondary", "بعداً"); no.type = "button";
      const close = (v) => { ov.remove(); resolve(v); };
      const go = async () => {
        if (!who) { msg.textContent = "اول از صفحهٔ اصلی نقشت را انتخاب کن."; return; }
        if (codeCache) { return close({ code: codeCache, who }); }
        if (!input.value) { msg.textContent = "رمز را بنویس."; return; }
        ok.disabled = true; msg.textContent = "در حال بررسی…";
        try {
          const good = (await rpc("verify_access_code", { p_access_code: input.value })) === true;
          if (good) { codeCache = input.value; ss.set("acode", codeCache); window.dispatchEvent(new Event("p2-auth")); lock.classList.add("open"); setTimeout(() => { close({ code: codeCache, who }); reopenAll(); }, 450); }
          else { msg.textContent = "رمز درست نیست."; lock.classList.add("shake"); setTimeout(() => lock.classList.remove("shake"), 600); ok.disabled = false; }
        } catch (e) { msg.textContent = "بررسی ممکن نشد."; ok.disabled = false; }
      };
      ok.onclick = go; no.onclick = () => close(null);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); if (e.key === "Escape") close(null); });
      box.append(lock, el("p", "code-t", "این بخش مخصوص ما دو نفر است"), el("small", "p2-muted", who ? "ورود به‌عنوان " + who : ""));
      if (!codeCache) box.append(input);
      const act = el("div", "p2-row"); act.append(ok, no); box.append(msg, act); ov.append(box); document.body.appendChild(ov);
      (codeCache ? ok : input).focus();
    });
  }
  function askWho() { return Promise.resolve(getWho()); }
  function idBar() { const b = el("span"); b.hidden = true; return b; }

  /* ---------- renderers ---------- */
  const R = {};
  R.timeline = (rows, s) => {
    rows.sort((a, b) => String(a.extra?.date || "").localeCompare(String(b.extra?.date || "")));
    const wrap = el("div", "tl");
    rows.forEach((r) => {
      const it = el("div", "tl-item"); const dot = el("span", "tl-dot", "♥"); const c = el("div", "tl-card");
      const d = r.extra?.date ? jalali(r.extra.date) : ""; if (d) c.append(el("small", "tl-date", "📅 " + d));
      c.append(el("h3", "", r.title || "")); if (r.body) c.append(el("p", "", r.body)); const b = by(r); if (b) c.append(b);
      it.append(dot, c); wrap.append(it);
    });
    s.append(wrap);
  };
  R.reason = (rows, s) => {
    const groups = {}; rows.forEach((r) => { const a = r.extra?.author || "محمد"; (groups[a] = groups[a] || []).push(r); });
    const names = NAMES.filter((n) => groups[n]); let cur = names[0];
    const box = el("div", "rsn"); const chipRow = el("div", "p2-row"); const count = el("div", "rsn-count"); const bar = el("div", "p2-progress"); const fill = el("i"); bar.append(fill);
    const text = el("div", "rsn-text", "💗"); text.setAttribute("aria-live", "polite");
    const btn = el("button", "p2-btn", "یک دلیل دیگه 💗"); btn.type = "button"; let i = 0;
    const upd = () => { const l = groups[cur]; count.textContent = `دلیل‌های ${cur} · ${fa(i)} از ${fa(l.length)}`; fill.style.width = (i / l.length * 100) + "%"; };
    names.forEach((n) => { if (names.length < 2) return; const c = el("button", "p2-chip" + (n === cur ? " on" : ""), "از طرف " + n); c.type = "button"; c.onclick = () => { cur = n; i = 0; text.textContent = "💗"; btn.textContent = "یک دلیل دیگه 💗"; [...chipRow.children].forEach((x) => x.classList.toggle("on", x === c)); upd(); }; chipRow.append(c); });
    btn.onclick = () => {
      const l = groups[cur];
      if (i >= l.length) { i = 0; text.textContent = "💗"; btn.textContent = "یک دلیل دیگه 💗"; upd(); return; }
      const r = l[i++]; text.classList.remove("pop"); void text.offsetWidth; text.textContent = r.body || r.title; text.classList.add("pop");
      const b = btn.getBoundingClientRect(); burst(b.left + b.width / 2, b.top, 8); upd(); if (i >= l.length) btn.textContent = "از اول بخوانم 🔁";
    };
    upd(); box.append(chipRow, count, bar, text, btn); s.append(box);
  };
  R.wish = (rows, s) => {
    const head = el("div", "wish-head"); const bar = el("div", "p2-progress"); const f = el("i"); bar.append(f);
    const ul = el("ul", "wish-list"); const note = el("div", "p2-muted tk-note");
    const isDone = (r) => r.done || (r.extra?.ticks?.["ماجی"] && r.extra?.ticks?.["محمد"]);
    const render = () => {
      const d = rows.filter(isDone).length; head.textContent = rows.length ? `${fa(d)} از ${fa(rows.length)} انجام شده` : "هنوز آرزویی ثبت نشده؛ اولینش را تو بنویس 🌠"; f.style.width = (rows.length ? d / rows.length * 100 : 0) + "%"; ul.innerHTML = "";
      rows.forEach((r) => {
        const t = r.extra?.ticks || {}; const li = el("li", isDone(r) ? "done" : ""); li.append(el("span", "wish-t", r.title || r.body));
        const hs = el("span", "wish-hearts");
        NAMES.forEach((n) => {
          const b = el("button", "wish-h" + (t[n] ? " on" : ""), t[n] ? "♥" : "♡"); b.type = "button"; b.setAttribute("aria-label", `${n}: ${t[n] ? "انجام شد" : "هنوز نه"}`); b.title = n;
          const cap = el("small", "", n); const w = el("span", "wish-who"); w.append(b, cap); hs.append(w);
          b.onclick = async () => {
            const a = await askAccess(); if (!a) return;
            if (a.who !== n) { note.textContent = "هر کس فقط قلب خودش را می‌زند 🤍"; return; }
            try { const val = !t[n]; const res = await rpc("tick_wish", { p_access_code: a.code, p_id: r.id, p_who: n, p_value: val }); if (!res) throw Error("x"); r.extra = { ...(r.extra || {}), ticks: { ...t, [n]: val } }; r.done = !!res.done; note.textContent = ""; render(); if (res.done) { const rc = ul.getBoundingClientRect(); burst(rc.left + rc.width / 2, rc.top, 22); } }
            catch (e) { note.textContent = "ثبت نشد؛ دوباره تلاش کن."; }
          };
        });
        li.append(hs); ul.append(li);
      });
    };
    const form = el("div", "wish-add"); const inp = el("input", "p2-input"); inp.placeholder = "یک آرزوی تازه…"; inp.maxLength = 200; const add = el("button", "p2-btn", "➕ اضافه کن"); add.type = "button";
    add.onclick = async () => {
      if (!inp.value.trim()) return; const a = await askAccess(); if (!a) return; add.disabled = true;
      try { const id = await rpc("add_wish", { p_access_code: a.code, p_who: a.who, p_title: inp.value }); if (!id) throw Error("x"); rows.push({ id, kind: "wish", title: inp.value.trim(), extra: { author: a.who }, done: false }); inp.value = ""; note.textContent = ""; render(); }
      catch (e) { note.textContent = "ثبت نشد."; } finally { add.disabled = false; }
    };
    form.append(inp, add); render(); s.append(head, bar, ul, form, note);
  };
  R.song = (rows, s) => {
    const g = el("div", "p2-grid");
    rows.forEach((r) => {
      const c = el("article", "p2-card song"); c.append(el("div", "disc", "🎵"), el("h3", "", r.title), el("p", "", r.body || "")); const b = by(r); if (b) c.append(b);
      const u = r.extra?.url; if (u && /^https?:\/\//i.test(u)) { const a = el("a", "p2-btn", "گوش بده ▶"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; c.append(a); }
      g.append(c);
    });
    s.append(g);
  };
  R.voice = (rows, s) => {
    const g = el("div", "p2-grid");
    rows.forEach((r) => {
      if (!r.extra?.path) return;
      const c = el("article", "p2-card voice"); c.append(el("div", "voice-ico", "🎙️"), el("h3", "", r.title || "یک پیام صوتی"));
      if (r.body) c.append(el("p", "", r.body));
      const a = document.createElement("audio"); a.controls = true; a.preload = "none"; a.src = audioUrl(r.extra.path); c.append(a); g.append(c);
    });
    s.append(g);
  };
  R.funny = (rows, s) => {
    const g = el("div", "funny-wall");
    rows.forEach((r, i) => { const b = el("div", "bubble"); b.style.setProperty("--r", (i % 2 ? 0.8 : -0.8) + "deg"); if (r.title) b.append(el("b", "", r.title)); b.append(el("p", "", r.body || "")); const a = by(r); if (a) b.append(a); g.append(b); });
    s.append(g);
  };
  R.learned = (rows, s) => {
    const g = el("div", "learn-grid");
    rows.forEach((r) => { const c = el("div", "learn"); c.append(el("span", "learn-ico", "✨"), el("p", "", r.body || r.title)); g.append(c); });
    s.append(g);
  };
  R.promise = (rows, s) => {
    const ol = el("ol", "vows");
    rows.forEach((r) => { const li = el("li", "", r.body || r.title); const a = by(r); if (a) li.append(a); ol.append(li); });
    s.append(ol);
  };
  R.whenever = (rows, s) => {
    const g = el("div", "p2-grid");
    rows.forEach((r) => g.append(envelope(r.title, r.extra?.author ? "✍️ از طرف " + r.extra.author : "", r.body, "بزن و بازش کن 🫂", null)));
    s.append(g);
  };
  R.album = (rows, s) => {
    const g = el("div", "album");
    rows.forEach((r) => {
      if (!r.extra?.path) return;
      const f = el("figure", "al-item"); const im = document.createElement("img"); im.loading = "lazy"; im.alt = r.title || "عکس"; im.src = audioUrl(r.extra.path);
      const cap = el("figcaption", ""); if (r.title) cap.append(el("span", "", r.title)); const a = by(r); if (a) { a.textContent = "📷 " + r.extra.author; cap.append(a); }
      f.append(im, cap); f.onclick = () => { const ov = el("div", "code-modal"); const big = document.createElement("img"); big.src = im.src; big.alt = im.alt; big.className = "al-big"; ov.append(big); ov.onclick = () => ov.remove(); document.body.appendChild(ov); }; g.append(f);
    });
    s.append(g);
  };
  R.coupon = (rows, s) => {
    const g = el("div", "tickets"); const note = el("div", "p2-muted tk-note");
    rows.forEach((r) => {
      const from = r.extra?.from || "محمد", to = other(from);
      const t = el("article", "ticket" + (r.done ? " used" : "")); const stub = el("div", "tk-stub", "🎟️"); const main = el("div", "tk-main");
      main.append(el("small", "by", `🎁 از ${from} برای ${to}`), el("h3", "", r.title), el("p", "", r.body || ""));
      if (r.done) main.append(el("div", "tk-stamp", "استفاده شد ✓"));
      else {
        const b = el("button", "p2-btn", "استفاده می‌کنم 💌"); b.type = "button";
        b.onclick = async () => {
          const a = await askAccess(); if (!a) return;
          if (a.who === from) { note.textContent = `این کوپن را خودت ساخته‌ای؛ برای ${to} است 🤍`; return; }
          b.disabled = true;
          try {
            const ok = await rpc("claim_coupon", { p_id: r.id, p_access_code: a.code, p_who: a.who });
            if (ok) { t.classList.add("used"); b.replaceWith(el("div", "tk-stamp", "استفاده شد ✓")); const rc = t.getBoundingClientRect(); burst(rc.left + rc.width / 2, rc.top + rc.height / 2, 24); note.textContent = `ثبت شد! ${from} خبردار می‌شود 🤍`; }
            else { note.textContent = "این کوپن قبلاً استفاده شده یا ثبت نشد."; b.disabled = false; }
          } catch (e) { note.textContent = "ثبت ممکن نشد. دوباره تلاش کن."; b.disabled = false; }
        };
        main.append(b);
      }
      t.append(stub, main); g.append(t);
    });
    s.append(g, note);
  };

  /* ---------- load all list content with one request ---------- */
  async function loadItems() {
    const kinds = Object.keys(defs).join(",");
    try {
      const rows = await read("site_items", `select=id,kind,title,body,extra,done,sort_order,created_at&kind=in.(${kinds})&order=sort_order.asc,created_at.asc`);
      Object.keys(defs).forEach((k) => {
        const list = rows.filter((r) => r.kind === k); if (!list.length && k !== "wish") return;
        try { R[k](list, secs[k]); secs[k].hidden = false; } catch (e) { console.warn("section", k, e); }
      });
    } catch (e) { console.warn("extra sections unavailable:", e.message); }
  }
  if (ready) loadItems();

  /* ---------- memory game ---------- */
  (function game() {
    const wrap = el("div", "mg"); const info = el("div", "mg-info"); const grid = el("div", "mg-grid"); const again = el("button", "p2-btn", "شروع دوباره"); again.type = "button";
    gameSec.append(info, grid, again);
    const emojis = ["💗", "🌹", "🍓", "🌙", "⭐", "🕊️", "🍫", "🎀"];
    let open = [], lock = false, moves = 0, found = 0, pairs = 0;
    const setInfo = () => { info.textContent = `حرکت‌ها: ${fa(moves)} · جفت‌های پیدا شده: ${fa(found)} از ${fa(pairs)}`; };
    function start() {
      const imgs = [...document.querySelectorAll("#photos .photo img")].map((i) => i.src).filter(Boolean).slice(0, 6);
      const faces = imgs.length >= 3 ? imgs.map((u) => ({ img: u })) : emojis.slice(0, 6).map((e) => ({ txt: e }));
      pairs = faces.length; const deck = [...faces, ...faces].map((f, i) => ({ ...f, k: i % pairs })).sort(() => Math.random() - 0.5);
      grid.innerHTML = ""; open = []; lock = false; moves = 0; found = 0; setInfo(); grid.style.setProperty("--cols", deck.length > 8 ? 4 : 3);
      deck.forEach((c) => {
        const card = el("button", "mg-card"); card.type = "button"; card.setAttribute("aria-label", "کارت");
        const inner = el("span", "mg-in"); const back = el("span", "mg-back", "♥"); const face = el("span", "mg-face");
        if (c.img) { const im = document.createElement("img"); im.src = c.img; im.alt = ""; face.append(im); } else face.textContent = c.txt;
        inner.append(back, face); card.append(inner);
        card.onclick = () => {
          if (lock || card.classList.contains("flip") || card.classList.contains("ok")) return;
          card.classList.add("flip"); open.push({ card, k: c.k });
          if (open.length === 2) {
            moves++; setInfo(); lock = true; const [a, b] = open;
            if (a.k === b.k) { a.card.classList.add("ok"); b.card.classList.add("ok"); found++; setInfo(); open = []; lock = false; if (found === pairs) { info.textContent = `🎉 همه را پیدا کردی با ${fa(moves)} حرکت! 🤍`; const r = grid.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 30); } }
            else setTimeout(() => { a.card.classList.remove("flip"); b.card.classList.remove("flip"); open = []; lock = false; }, reduce ? 300 : 800);
          }
        };
        grid.append(card);
      });
    }
    again.onclick = start;
    if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); start(); } }, { threshold: .05 }); io.observe(gameSec); } else start();
  })();

  /* ---------- guestbook ---------- */
  (function guestbook() {
    const body = el("div", "gb"); guestSec.append(body);
    const lockBtn = el("button", "p2-btn", "🔐 باز کردن دفترچه"); lockBtn.type = "button"; body.append(lockBtn);
    async function show(code, me) {
      body.innerHTML = ""; const list = el("div", "gb-list"); const form = el("div", "gb-form");
      const who = { value: me || getWho() };
      const ta = el("textarea", "p2-input"); ta.rows = 3; ta.maxLength = 2000; ta.placeholder = "یک جمله برای دفترچه…";
      const send = el("button", "p2-btn", "ثبت در دفترچه 💌"); send.type = "button"; const msg = el("div", "p2-muted");
      form.append(ta, send, msg); body.append(list, form);
      const load = async () => {
        try {
          const rows = await rpc("get_guestbook", { p_access_code: code }); list.innerHTML = "";
          if (!rows.length) list.append(el("p", "p2-muted", "هنوز چیزی نوشته نشده؛ اولین نفر باش 🤍"));
          rows.forEach((r) => { const b = el("div", "gb-msg " + (r.author === "ماجی" ? "maji" : "mohammad")); b.append(el("b", "", r.author), el("p", "", r.body), el("small", "p2-muted", new Date(r.created_at).toLocaleDateString("fa-IR"))); list.append(b); });
          list.scrollTop = list.scrollHeight;
        } catch (e) { list.textContent = "دفترچه در دسترس نیست؛ migration را بررسی کن."; }
      };
      send.onclick = async () => {
        if (!ta.value.trim()) return; send.disabled = true;
        try { const ok = await rpc("add_guestbook_entry", { p_access_code: code, p_author: who.value, p_body: ta.value }); if (ok) { ta.value = ""; msg.textContent = ""; await load(); const r = send.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 10); } else msg.textContent = "ثبت نشد."; }
        catch (e) { msg.textContent = "ثبت ممکن نشد."; } finally { send.disabled = false; }
      };
      await load();
    }
    lockBtn.onclick = async () => { const a = await askAccess(); if (a) show(a.code, a.who); };
    if (!ready) { body.textContent = "ابتدا اتصال Supabase را تنظیم کن."; }
  })();

  /* ---------- final surprise (released on the meeting date) ---------- */
  (async function finalSurprise() {
    if (!ready) return;
    let date = null;
    try { const r = await read("site_content", "select=value&key=eq.meeting_date"); const v = r[0] && r[0].value; if (v) { const d = new Date(v); if (!Number.isNaN(d.getTime())) date = d; } } catch (e) { return; }
    if (!date) return;
    const box = el("div", "final-box"); finalSec.append(box); finalSec.hidden = false;
    const lock = () => {
      const z = new Date(date.getTime() + 3.5 * 3600000);
      let when = ""; try { when = window.JDate.formatJalali(window.JDate.toJalali(z.getUTCFullYear(), z.getUTCMonth() + 1, z.getUTCDate())); } catch (e) {}
      box.innerHTML = ""; const l = el("div", "lock-heart"); l.innerHTML = '<span class="lh-shackle"></span><span class="lh-body">♥</span>'; box.append(l, el("p", "final-t", "این سورپرایز در روز دیدار باز می‌شود"), el("p", "p2-muted", when ? "📅 " + when : ""));
    };
    const tryOpen = async () => {
      if (Date.now() < date.getTime()) { lock(); return false; }
      try {
        const rows = await rpc("get_final_surprise");
        if (!rows.length) { finalSec.hidden = true; return true; }
        box.innerHTML = ""; const g = el("div", "p2-grid"); rows.forEach((r) => g.append(envelope(r.title || "برای تو", "", r.body, "امروز روز توست؛ بازش کن 🎁", null))); box.append(g);
        burst(); return true;
      } catch (e) { return true; }
    };
    if (await tryOpen()) return;
    const iv = setInterval(async () => { if (await tryOpen()) clearInterval(iv); }, 30000);
  })();

  /* =====================  TWO-WAY MODULES  ===================== */
  const missSec = section("missSection", "💗 دلتنگی", "اگر دلت تنگ شد، فقط یک لمس کافی است.");
  const dailySec = section("dailySection", "❓ سؤال امروز", "هر دو جدا جواب می‌دهیم؛ وقتی هر دو جواب دادیم، جواب‌ها باز می‌شود.");
  const moodSec = section("moodSection", "🌈 حال و هوای ما", "هر روز یک ایموجی؛ ببینیم حال دل‌هایمان چطور است.");
  const capSec = section("capsuleSection", "⏳ صندوقچهٔ زمانی", "پیامی بنویس و تا یک روز مشخص مهر و موم کن.");
  const aSec = (sec, build) => {
    const body = el("div", "tw"); sec.append(body);
    const lockBtn = el("button", "p2-btn", "🔐 ورود با رمز مشترک"); lockBtn.type = "button"; body.append(lockBtn);
    let opened = false;
    const open = async (a) => { opened = true; body.innerHTML = ""; try { await build(body, a); } catch (e) { body.textContent = "این بخش در دسترس نیست؛ migration دوطرفه را اجرا کن."; } };
    lockBtn.onclick = async () => { const a = await askAccess(); if (a && !opened) open(a); };
    openers.push((force) => { if (codeCache && getWho() && (force || !opened)) open({ code: codeCache, who: getWho() }); });
    if (codeCache && getWho()) { rpc("verify_access_code", { p_access_code: codeCache }).then((ok) => { if (ok === true) open({ code: codeCache, who: getWho() }); else { codeCache = ""; ss.del("acode"); } }).catch(() => {}); }
    return { body, open };
  };

  /* --- miss you --- */
  aSec(missSec, async (body, a) => {
    const info = el("div", "miss-info"); const note = el("div", "p2-muted tk-note");
    const btn = el("button", "miss-btn", "دلم برات تنگ شده 💗"); btn.type = "button";
    const me = a.who, you = other(me);
    const load = async () => {
      const rows = await rpc("get_miss_you", { p_access_code: a.code });
      const theirs = rows.filter((r) => r.author === you), mine = rows.filter((r) => r.author === me);
      const weekAgo = Date.now() - 7 * 86400000, cnt = theirs.filter((r) => new Date(r.created_at).getTime() > weekAgo).length;
      info.textContent = theirs.length ? `${you} ${ago(theirs[0].created_at)} گفت دلش برایت تنگ شده 💗 (${fa(cnt)} بار در این هفته)` : `${you} هنوز دلتنگی‌اش را نفرستاده؛ شاید زود بفرستد 🤍`;
      if (mine.length) note.textContent = `آخرین باری که تو فرستادی: ${ago(mine[0].created_at)}`;
      if (theirs.length && Date.now() - new Date(theirs[0].created_at).getTime() < 6 * 3600000) info.classList.add("fresh");
    };
    btn.onclick = async () => {
      btn.disabled = true;
      try { const ok = await rpc("send_miss_you", { p_access_code: a.code, p_who: me }); if (ok) { const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 26); note.textContent = `برای ${you} فرستاده شد 💗`; await load(); } else note.textContent = "همین الان فرستادی؛ یک دقیقه صبر کن 🤍"; }
      catch (e) { note.textContent = "ارسال نشد."; } finally { setTimeout(() => (btn.disabled = false), 1500); }
    };
    body.append(idBar(() => {}), info, btn, note); await load();
  });

  /* --- daily question --- */
  aSec(dailySec, async (body, a) => {
    const qs = await read("site_items", "select=id,body,sort_order,created_at&kind=eq.dquestion&order=sort_order.asc,created_at.asc");
    if (!qs.length) { body.textContent = "هنوز سؤالی ثبت نشده است."; return; }
    const q = qs[Math.floor((Date.now() + 3.5 * 3600000) / 86400000) % qs.length]; const me = a.who, you = other(me);
    const qEl = el("div", "dq-q", q.body); const ta = el("textarea", "p2-input"); ta.rows = 3; ta.maxLength = 1000; ta.placeholder = "جواب تو…";
    const save = el("button", "p2-btn", "ثبت جواب 💌"); save.type = "button"; const out = el("div", "dq-out"); const msg = el("div", "p2-muted tk-note");
    const hist = el("button", "p2-chip ghost", "📚 جواب‌های قبلی"); hist.type = "button"; const histBox = el("div", "dq-hist");
    const bubble = (n, text, mine) => { const b = el("div", "gb-msg " + (n === "ماجی" ? "maji" : "mohammad")); b.append(el("b", "", n + (mine ? " (تو)" : "")), el("p", "", text)); return b; };
    const load = async () => {
      const rows = await rpc("get_daily_answers", { p_access_code: a.code, p_qid: q.id, p_who: me }); out.innerHTML = "";
      const mine = rows.find((r) => r.author === me), theirs = rows.find((r) => r.author === you);
      if (mine && !ta.value) ta.value = mine.answer;
      if (mine) out.append(bubble(me, mine.answer, true));
      if (theirs) { out.append(bubble(you, theirs.answer, false)); }
      else out.append(el("p", "p2-muted", mine ? `منتظر جواب ${you} هستیم… وقتی او هم جواب بدهد، اینجا باز می‌شود 🤍` : "اول جواب خودت را بنویس؛ بعد جواب او باز می‌شود."));
    };
    save.onclick = async () => {
      if (!ta.value.trim()) return; save.disabled = true;
      try { const ok = await rpc("submit_daily_answer", { p_access_code: a.code, p_qid: q.id, p_who: me, p_answer: ta.value }); if (!ok) throw Error("x"); msg.textContent = "ثبت شد 🤍"; await load(); } catch (e) { msg.textContent = "ثبت نشد."; } finally { save.disabled = false; }
    };
    hist.onclick = async () => {
      histBox.innerHTML = "";
      try {
        const rows = await rpc("get_daily_history", { p_access_code: a.code }); if (!rows.length) { histBox.append(el("p", "p2-muted", "هنوز سؤالی با جواب هر دو نفر نداریم.")); return; }
        const by = {}; rows.forEach((r) => { (by[r.question_id] = by[r.question_id] || { q: r.question, a: [] }).a.push(r); });
        Object.values(by).forEach((g) => { const c = el("div", "dq-card"); c.append(el("b", "", g.q)); g.a.sort((x, y) => x.author.localeCompare(y.author)).forEach((r) => c.append(bubble(r.author, r.answer, r.author === me))); histBox.append(c); });
      } catch (e) { histBox.textContent = "در دسترس نیست."; }
    };
    body.append(idBar(), qEl, ta, save, msg, out, hist, histBox); await load();
  });

  /* --- mood diary --- */
  aSec(moodSec, async (body, a) => {
    const moods = ["😍", "🥰", "😊", "😐", "😴", "😔", "😢", "😡"]; const me = a.who; let pick = ""; const today = tehranDay(0);
    const row = el("div", "mood-pick"); const note = el("input", "p2-input"); note.placeholder = "یک جمله دربارهٔ امروز (اختیاری)"; note.maxLength = 300;
    const save = el("button", "p2-btn", "ثبت حال امروز"); save.type = "button"; const msg = el("div", "p2-muted tk-note"); const grid = el("div", "mood-grid");
    moods.forEach((m) => { const b = el("button", "mood-b", m); b.type = "button"; b.onclick = () => { pick = m; [...row.children].forEach((x) => x.classList.toggle("on", x === b)); }; row.append(b); });
    const load = async () => {
      const rows = await rpc("get_moods", { p_access_code: a.code, p_days: 14 }); const map = {}; rows.forEach((r) => { map[r.author + r.day] = r; });
      const mine = map[me + today]; if (mine && !pick) { pick = mine.mood; [...row.children].forEach((x) => x.classList.toggle("on", x.textContent === pick)); if (!note.value) note.value = mine.note || ""; }
      grid.innerHTML = ""; const days = []; for (let k = 13; k >= 0; k--) days.push(tehranDay(k));
      NAMES.forEach((n) => { const line = el("div", "mood-line"); line.append(el("b", "mood-name", n)); days.forEach((d) => { const r = map[n + d]; const c = el("span", "mood-cell" + (r ? "" : " empty"), r ? r.mood : "·"); let dn = ""; try { dn = fa(window.JDate.isoToJalali(d).jd); } catch (e) {} c.title = (dn ? dn + " · " : "") + (r && r.note ? r.note : ""); line.append(c); }); grid.append(line); });
    };
    save.onclick = async () => {
      if (!pick) { msg.textContent = "اول یک ایموجی انتخاب کن."; return; } save.disabled = true;
      try { const ok = await rpc("set_mood", { p_access_code: a.code, p_author: me, p_day: today, p_mood: pick, p_note: note.value }); if (!ok) throw Error("x"); msg.textContent = "ثبت شد 🌈"; await load(); } catch (e) { msg.textContent = "ثبت نشد."; } finally { save.disabled = false; }
    };
    body.append(idBar(), el("small", "p2-muted", "حال امروز تو چطور است؟"), row, note, save, msg, el("div", "mood-scroll")); body.lastChild.append(grid); await load();
  });

  /* --- time capsule --- */
  aSec(capSec, async (body, a) => {
    const JD = window.JDate; const me = a.who; const list = el("div", "p2-grid"); const msg = el("div", "p2-muted tk-note");
    const title = el("input", "p2-input"); title.placeholder = "عنوان پیام"; title.maxLength = 150; const text = el("textarea", "p2-input"); text.rows = 4; text.placeholder = "پیامی که می‌خواهی در آینده باز شود…";
    const mk = (opts, val) => { const s = document.createElement("select"); s.className = "p2-input"; opts.forEach(([v, t]) => { const o = document.createElement("option"); o.value = v; o.textContent = t; s.append(o); }); s.value = String(val); return s; };
    const z = new Date(Date.now() + 3.5 * 3600000 + 365 * 86400000); const j = JD.toJalali(z.getUTCFullYear(), z.getUTCMonth() + 1, z.getUTCDate());
    const ys = []; for (let y = j.jy - 1; y <= j.jy + 12; y++) ys.push([y, fa(y)]);
    const sy = mk(ys, j.jy), sm = mk(JD.monthNames.map((n, i) => [i + 1, n]), j.jm), sd = mk([[1, "۱"]], j.jd);
    const fill = (keep) => { const len = JD.jalaliMonthLength(+sy.value, +sm.value); const old = keep || +sd.value; sd.innerHTML = ""; for (let d = 1; d <= len; d++) { const o = document.createElement("option"); o.value = d; o.textContent = fa(d); sd.append(o); } sd.value = String(Math.min(old, len)); };
    fill(j.jd); sy.onchange = () => fill(); sm.onchange = () => fill();
    const dateRow = el("div", "cap-date"); dateRow.append(sd, sm, sy);
    const seal = el("button", "p2-btn", "🔒 مهر و موم کن"); seal.type = "button";
    const load = async () => {
      const rows = await rpc("get_time_capsules", { p_access_code: a.code }); list.innerHTML = "";
      if (!rows.length) list.append(el("p", "p2-muted", "هنوز صندوقچه‌ای نساخته‌ایم."));
      rows.forEach((r) => {
        const when = new Date(r.unlock_at); const zz = new Date(when.getTime() + 3.5 * 3600000); let ws = ""; try { ws = JD.formatJalali(JD.toJalali(zz.getUTCFullYear(), zz.getUTCMonth() + 1, zz.getUTCDate())); } catch (e) {}
        if (r.body) list.append(envelope(r.title, `✍️ از طرف ${r.author} · باز شد ${ws}`, r.body, "صندوقچه باز شده؛ بخوانش 💌", null));
        else { const c = el("article", "p2-card capsule"); const days = Math.max(1, Math.ceil((when.getTime() - Date.now()) / 86400000)); c.append(el("div", "voice-ico", "🔒"), el("h3", "", r.title), el("small", "p2-muted", `✍️ ${r.author}`), el("p", "", `باز می‌شود: ${ws}`), el("small", "p2-muted", `${fa(days)} روز دیگر`)); list.append(c); }
      });
    };
    seal.onclick = async () => {
      if (!title.value.trim() || !text.value.trim()) { msg.textContent = "عنوان و متن را بنویس."; return; }
      const iso = JD.jalaliToIso(+sy.value, +sm.value, +sd.value); const at = new Date(`${iso}T08:00:00+03:30`);
      if (at.getTime() < Date.now() + 2 * 3600000) { msg.textContent = "تاریخ باز شدن باید در آینده باشد."; return; }
      seal.disabled = true;
      try { const ok = await rpc("add_time_capsule", { p_access_code: a.code, p_author: me, p_title: title.value, p_body: text.value, p_unlock: at.toISOString() }); if (!ok) throw Error("x"); title.value = ""; text.value = ""; msg.textContent = "مهر و موم شد 🔒 تا روز موعود هیچ‌کس نمی‌تواند بخواندش."; const r = seal.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 16); await load(); }
      catch (e) { msg.textContent = "ثبت نشد."; } finally { seal.disabled = false; }
    };
    body.append(idBar(), title, text, el("small", "p2-muted", "باز شدن در تاریخ:"), dateRow, seal, msg, list); await load();
  });

  /* --- quiz scores (used by the quiz) --- */
  window.P2x = {
    askWho, askAccess, getCode: () => codeCache,
    async submitScore(score, total, btn) {
      const a = await askAccess(); if (!a) return; btn.disabled = true;
      try { const ok = await rpc("submit_quiz_score", { p_access_code: a.code, p_who: a.who, p_correct: score, p_total: total }); btn.textContent = ok ? "✓ امتیاز ثبت شد" : "ثبت نشد"; const box = btn.parentElement && btn.parentElement.querySelector(".quiz-board"); if (box) this.showScores(box); } catch (e) { btn.textContent = "ثبت نشد"; btn.disabled = false; }
    },
    async showScores(box) {
      box.innerHTML = "";
      if (!codeCache) { const b = el("button", "p2-chip ghost", "🏆 نمایش جدول امتیازها"); b.type = "button"; b.onclick = async () => { const a = await askAccess(); if (a) this.showScores(box); }; box.append(b); return; }
      try {
        const rows = await rpc("get_quiz_scores", { p_access_code: codeCache }); if (!rows.length) { box.append(el("p", "p2-muted", "هنوز امتیازی ثبت نشده.")); return; }
        const best = {}; rows.forEach((r) => { const p = r.correct / r.total; if (!best[r.author] || p > best[r.author].p) best[r.author] = { p, r }; });
        const t = el("div", "score-board"); NAMES.forEach((n) => { if (best[n]) t.append(el("div", "score", `${n}: ${fa(best[n].r.correct)} از ${fa(best[n].r.total)} 🏆`)); }); box.append(t);
      } catch (e) {}
    }
  };
})();
