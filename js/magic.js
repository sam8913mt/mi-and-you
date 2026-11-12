/* ME & YOU — magic layer */
(() => {
  "use strict";
  const doc = document, root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s);
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mob = matchMedia("(max-width:700px), (pointer:coarse)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const ls = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const el = (t, c, x) => { const e = doc.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const cfg = window.SUPABASE_CONFIG || {};
  const base = String(cfg.url || "").replace(/\/$/, "");
  const key = cfg.anonKey || "";
  const hdr = () => { const h = { apikey: key }; if (/^eyJ/.test(key)) h.Authorization = "Bearer " + key; return h; };
  const read = (table, q) => fetch(`${base}/rest/v1/${table}?${q}`, { headers: hdr() }).then((r) => { if (!r.ok) throw Error(table); return r.json(); });
  const other = (w) => (w === "ماجی" ? "محمد" : "ماجی");
  const getWho = () => ls.get("who");
  const vibe = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const heartbeat = () => vibe([60, 110, 60, 420, 60, 110, 60]);
  const startIso = () => window.CLOUD_START_DATE || (typeof START_DATE !== "undefined" ? START_DATE : "2026-06-28");
  const startParts = () => startIso().split("-").map(Number);
  const daysTogether = () => { const [y, m, d] = startParts(); const now = new Date(); return Math.max(0, Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(y, m - 1, d)) / 86400000)); };
  const whenEl = (sel, cb) => { const f = $(sel); if (f) return cb(f); const mo = new MutationObserver(() => { const e = $(sel); if (e) { mo.disconnect(); cb(e); } }); mo.observe(doc.body, { childList: true, subtree: true }); };
  if (mob) root.classList.add("mob");

  /* ---------- صدا ---------- */
  let ac = null;
  const audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; } catch (e) { return null; } };
  const rustle = () => {
    const c = audio(); if (!c) return;
    const n = c.sampleRate * 0.55, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6) * (0.6 + 0.4 * Math.sin(i / 380));
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3200; f.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = 0.16;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  };
  const chime = () => {
    const c = audio(); if (!c) return;
    [660, 880, 1318].forEach((fq, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = fq;
      const t = c.currentTime + i * 0.13; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 1);
    });
  };
  doc.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".env-btn")) rustle(); }, true);

  /* ---------- زمان روز ---------- */
  const tod = () => { const h = new Date().getHours(); return h >= 5 && h < 11 ? "morning" : h < 17 ? (h >= 11 ? "day" : "night") : h < 20 ? "evening" : "night"; };
  const GREET = { morning: ["☀️", "صبح‌بخیر"], day: ["🌤️", "روزت قشنگ"], evening: ["🌇", "عصربخیر"], night: ["🌙", "شب‌بخیر"] };
  const applyTod = () => { root.dataset.tod = tod(); const g = $(".tod-greet"); if (g) { const [i, t] = GREET[tod()]; const w = getWho(); g.textContent = `${i} ${t}${w ? "، " + w : ""} 🤍`; } };
  applyTod(); setInterval(applyTod, 600000);
  whenEl(".hero-card", (card) => { const g = el("div", "tod-greet"); card.prepend(g); applyTod(); });

  /* ---------- نقش در ورودی ---------- */
  const gate = $("#gate");
  const gateCard = gate && $(".gate-card", gate);
  const setGateTexts = (w) => {
    const t = $(".gate-title", gate), s = $(".gate-sub", gate);
    if (t) { t.textContent = w === "ماجی" ? "برای تو، ماجی 🤍" : "برای تو، محمد 🤍"; if (window.EmojiFix) EmojiFix.wrap(t); }
    if (s) s.textContent = w === "ماجی" ? "هدیه‌ی روز دختر، از طرف محمد" : "خانه‌ی مشترک ما، با عشق ماجی و محمد";
  };
  function chooseRole(w) {
    ls.set("who", w); window.MY_WHO = w; setGateTexts(w); applyTod();
    gateCard.classList.remove("await-role");
        vibe(20); Live.start();
    window.dispatchEvent(new Event("role-chosen"));
  }
  if (gate && gateCard) {
    const last = getWho();
    if (last) {
      // نقش فقط یک بار انتخاب می‌شود؛ بعد از آن در همین دستگاه می‌ماند
      setGateTexts(last); window.MY_WHO = last; setTimeout(() => Live.start(), 0);
    } else {
      gateCard.classList.add("await-role");
      const step = el("div", "role-step");
      step.append(el("div", "role-q", "تو کی هستی؟ 🤍"));
      const row = el("div", "role-row");
      [["ماجی", "🌸", "ماجده"], ["محمد", "🌙", "محمد"]].forEach(([w, ico, sub]) => {
        const b = el("button", "role-btn"); b.type = "button";
        b.append(el("span", "role-ico", ico), el("span", "", w), el("small", "", sub === w ? "ورود به‌عنوان " + w : sub));
        b.onclick = () => { b.classList.add("pick"); setTimeout(() => chooseRole(w), 180); };
        row.append(b);
      });
      step.append(row);
      const title = $(".gate-title", gateCard); title.after(step);
      $(".gate-sub", gateCard).textContent = "";
    }
  }
  window.MY_WHO = getWho();

  /* ---------- ورود سینمایی ---------- */
  const LINES = [
    "هر روز کنار تو، یک خاطرهٔ تازه است.", "فاصله‌ها فقط عددند؛ دل‌ها که نزدیک‌اند.", "دوستت دارم، امروز هم مثل دیروز، اما کمی بیشتر.",
    "تو بهانهٔ قشنگ همهٔ لبخندهای من‌ای.", "هر جای دنیا که باشی، خانهٔ من همان‌جاست.", "با تو، حتی انتظار هم شیرین است.",
    "دلم برای صدایت همیشه جا دارد.", "تو را در هر ثانیه‌ام نگه می‌دارم.", "عشق یعنی نام تو، وقتی به خودم فکر می‌کنم.",
    "امروز هم به تو فکر کردم؛ بی‌دلیل و بی‌وقفه.", "قشنگ‌ترین اتفاق زندگی‌ام، پیدا کردن توست.", "قلبم یک کلمه بیشتر بلد نیست: تو.",
    "هر شب ستاره‌ها را می‌شمارم، همه شبیه تو می‌درخشند.", "کنار تو بودن، آرام‌ترین جای دنیاست.", "تو همان آرزویی هستی که برآورده شد.",
    "هر روز بیشتر از دیروز دلتنگ‌تر و دلبسته‌ترم.", "دستانت را که به یاد می‌آورم، دنیا کوچک و گرم می‌شود.", "ما یک قصهٔ بلندیم، با پایانی که هیچ‌وقت نمی‌رسد.",
    "هر لحظه‌ای که به تو فکر می‌کنم، یک گلبرگ تازه باز می‌شود.", "خوشبختی یعنی همین: ما دو نفر، یک دل.", "به تو که فکر می‌کنم، دلم آرام می‌شود.",
    "نامت را که می‌شنوم، قلبم یک ضرب بیشتر می‌زند.", "دنیا بدون تو رنگ ندارد، با تو پر از رنگ است.", "قول می‌دهم همیشه برایت بمانم.",
    "عشق ما بی‌صدا بزرگ شد و حالا همهٔ دنیاست.", "تو شعر نیمه‌تمام من را کامل کردی.", "بودنت، بهترین هدیهٔ همین روز است.",
    "هر روز با تو، یک روز طلایی است.", "دوست داشتنت عادت نیست؛ هر روز دوباره اتفاق می‌افتد.", "تو را از همین حالا برای فردا هم دوست دارم."
  ];
  let introShown = false;
  function showIntro() {
    if (introShown || rm) { window.dispatchEvent(new Event("intro-done")); return; }
    introShown = true;
    const w = getWho() || "ماجی", names = w === "ماجی" ? ["محمد", "ماجی"] : ["ماجی", "محمد"];
    const it = el("div", ""); it.id = "intro"; it.setAttribute("role", "presentation");
    for (let i = 0; i < (mob ? 28 : 60); i++) { const s = el("i", "i-star"); const z = rand(1.4, 3); s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;width:${z}px;height:${z}px;--d:${rand(2, 5)}s;--dl:${rand(0, 3)}s`; it.append(s); }
    const wrap = el("div", "i-wrap");
    wrap.append(el("div", "i-heart", "💗"));
    const nm = el("div", "i-names"); const full = names[0] + " ♥ " + names[1];
    [...full].forEach((ch, i) => { const s = el("i", "", ch === " " ? "\u00a0" : ch); s.style.animationDelay = (0.5 + i * 0.12) + "s"; nm.append(s); });
    wrap.append(nm);
    const dd = el("div", "i-days"); dd.innerHTML = ""; dd.append(doc.createTextNode("امروز "), el("b", "", fa(daysTogether())), doc.createTextNode(" روز است که با هم‌ایم"));
    const day = Math.floor(Date.now() / 86400000);
    const line = el("div", "i-line", LINES[day % LINES.length]);
    wrap.append(dd, line); it.append(wrap, el("div", "i-skip", "برای ادامه لمس کن"));
    doc.body.append(it); heartbeat();
    let done = false;
    const end = () => { if (done) return; done = true; it.classList.add("out"); setTimeout(() => { it.remove(); window.dispatchEvent(new Event("intro-done")); }, 900); };
    it.addEventListener("click", end); setTimeout(end, 7800);
  }
  if (gate) {
    new MutationObserver(() => { if (gate.classList.contains("hide")) showIntro(); }).observe(gate, { attributes: true, attributeFilter: ["class"] });
  } else setTimeout(() => window.dispatchEvent(new Event("intro-done")), 1200);

  /* ---------- شمارندهٔ زنده + ضربان ---------- */
  whenEl(".counter", (sec) => {
    const days = $("#days", sec); if (days && !rm) days.classList.add("beat");
    const tick = el("div", "live-tick"); const bd = $("#breakdown", sec);
    (bd || days).after(tick);
    const upd = () => {
      const [y, m, d] = startParts(); const secs = Math.max(0, Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 1000));
      const beats = Math.round(secs * 1.2);
      tick.innerHTML = "";
      const a = el("div"); a.append(doc.createTextNode("ثانیه‌هایی که با هم‌ایم: "), el("b", "", secs.toLocaleString("fa-IR")));
      const b = el("div"); b.append(doc.createTextNode("قلب‌هایمان تا امروز حدود "), el("b", "", beats.toLocaleString("fa-IR")), doc.createTextNode(" بار با هم تپیده 💗"));
      tick.append(a, b);
    };
    upd(); setInterval(() => { if (!doc.hidden) upd(); }, 1000);
    sec.addEventListener("click", (e) => { heartbeat(); if (window.MY && MY.burst) MY.burst(e.clientX, e.clientY, 10); });
  });

  /* ---------- افکت‌های بزرگ (کنفتی/قلب) ---------- */
  function confetti(ms = 7000) {
    if (rm) return;
    const cv = el("canvas"); cv.id = "fxCanvas"; doc.body.append(cv);
    const ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const N = mob ? 90 : 190, cols = ["#ef5b7c", "#ff9bb8", "#F6D9A8", "#C2607F", "#ffffff"], P = [];
    for (let i = 0; i < N; i++) P.push({ x: rand(0, W), y: rand(-H, 0), v: rand(1.6, 4.2) * dpr, s: rand(10, 26) * dpr, r: rand(0, 6), vr: rand(-.06, .06), sw: rand(0, 6), c: cols[i % cols.length], h: Math.random() > .45 });
    const t0 = performance.now(); let alive = true;
    const loop = (t) => {
      if (!alive) return; ctx.clearRect(0, 0, W, H);
      const fade = Math.max(0, Math.min(1, (ms - (t - t0)) / 1200));
      P.forEach((p) => {
        p.y += p.v; p.r += p.vr; p.sw += .04; p.x += Math.sin(p.sw) * 1.2 * dpr; if (p.y > H + 30 && t - t0 < ms - 1500) { p.y = -20; p.x = rand(0, W); }
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.h) { ctx.font = p.s + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText("♥", 0, 0); } else ctx.fillRect(-p.s / 4, -p.s / 2, p.s / 2, p.s);
        ctx.restore();
      });
      if (t - t0 < ms) requestAnimationFrame(loop); else { alive = false; cv.remove(); }
    };
    requestAnimationFrame(loop);
  }
  function specialCard(icon, title, text) {
    const o = el("div", ""); o.id = "spCard"; const i = el("div", "sp-in");
    i.append(el("div", "sp-ico", icon), el("h3", "", title), el("p", "", text));
    const b = el("button", "", "💗 ممنون"); b.type = "button"; b.onclick = () => { o.remove(); }; i.append(b); o.append(i); doc.body.append(o);
    confetti(); heartbeat(); chime();
    if (window.MY && MY.burst) setTimeout(() => MY.burst(), 300);
  }
  async function specials() {
    const J = window.JDate; if (!J) return;
    const z = new Date(Date.now() + 3.5 * 3600000), gy = z.getUTCFullYear(), gm = z.getUTCMonth() + 1, gd = z.getUTCDate();
    const tj = J.toJalali(gy, gm, gd), todayKey = `${gy}-${gm}-${gd}`;
    const w = getWho() || "";
    const found = [];
    const iso = startIso(), sj = J.isoToJalali(iso);
    if (sj) {
      const len = J.jalaliMonthLength(tj.jy, tj.jm), months = (tj.jy - sj.jy) * 12 + (tj.jm - sj.jm);
      if (tj.jd === Math.min(sj.jd, len) && months > 0) {
        if (months % 12 === 0) found.push(["anniv", "🎉", "سالگرد ما مبارک!", `امروز ${fa(months / 12)} سالگی ماست؛ ${fa(months / 12)} سال با تو بودن، بهترین قصهٔ زندگی‌ام.`]);
        else found.push(["month", "💞", "ماهگرد ما مبارک!", `امروز ${fa(months)} ماه از شروع قصهٔ ماست؛ دوستت دارم، هر ماه بیشتر.`]);
      }
      const days = daysTogether(); if (days > 0 && days % 100 === 0) found.push(["d" + days, "✨", `${fa(days)} روز با هم`, `امروز روز ${fa(days)}ام ماست؛ ${fa(days)} روز عشق، و ادامه دارد.`]);
    }
    if (tj.jm === 1 && tj.jd === 1) found.push(["nowruz", "🌷", "نوروزت مبارک", "سال نو، دوباره با تو و عشقمان؛ امسال هم کنار هم."]);
    if (tj.jm === 12 && tj.jd === 5) found.push(["esfand", "💝", "روز عشق مبارک", "امروز روز عشق است و عشق من، تو هستی."]);
    if (gm === 2 && gd === 14) found.push(["valentine", "💘", "ولنتاین مبارک", "امروز روز عاشقانه‌هاست؛ ولی برای من هر روز با تو ولنتاین است."]);
    if (tj.jm === 9 && tj.jd === 30) found.push(["yalda", "🍉", "شب یلدا مبارک", "بلندترین شب سال، با گرم‌ترین یاد تو سپری می‌شود."]);
    try {
      const rows = await read("site_content", "select=key,value&key=in.(birthday_maji,birthday_mohammad,meeting_date)");
      const m = Object.fromEntries(rows.map((r) => [r.key, String(r.value || "")]));
      [["birthday_maji", "ماجی"], ["birthday_mohammad", "محمد"]].forEach(([k, name]) => {
        const v = m[k]; const mm = /^(\d{1,4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(v || ""); if (!mm) return;
        let jm, jd; if (+mm[1] >= 1700) { const j = J.toJalali(+mm[1], +mm[2], +mm[3]); jm = j.jm; jd = j.jd; } else { jm = +mm[2]; jd = +mm[3]; }
        if (jm === tj.jm && jd === tj.jd) found.push(["bday" + name, "🎂", w === name ? "تولدت مبارک!" : `تولد ${name} مبارک!`, w === name ? "امروز روز توست؛ تو بهترین هدیهٔ زندگی منی. 🎁" : `امروز روز ${name} است؛ بهش بگو چقدر دوستش داری 🤍`]);
      });
      if (m.meeting_date) { const d = new Date(m.meeting_date); if (!Number.isNaN(d.getTime())) { const q = new Date(d.getTime() + 3.5 * 3600000); if (q.getUTCFullYear() === gy && q.getUTCMonth() + 1 === gm && q.getUTCDate() === gd) found.push(["meet", "🤍", "امروز روز دیدار است", "امروز همدیگر را می‌بینیم؛ دلم می‌خواهد زمان را تند کنم!"]); }}
    } catch (e) {}
    const ev = found.find((f) => !ls.get("sp-" + f[0] + "-" + todayKey)); if (!ev) return;
    ls.set("sp-" + ev[0] + "-" + todayKey, "1"); specialCard(ev[1], ev[2], ev[3]);
  }
  let spDone = false; const runSpecials = () => { if (spDone) return; spDone = true; setTimeout(specials, 900); };
  window.addEventListener("intro-done", runSpecials); if (!gate) setTimeout(runSpecials, 2500);
  window.MagicFx = { confetti, specialCard };

  /* ---------- آسمان مشترک ---------- */
  const KIND = { timeline: ["🕰️", "لحظه", "#F6D9A8", 3.4], wish: ["🌠", "آرزو", "#ffb3c8", 3.2], reason: ["💕", "دلیل", "#ff8fb0", 2.8], album: ["📷", "عکس", "#d4c1ff", 3], song: ["🎶", "آهنگ", "#9fd8ff", 2.8], funny: ["😂", "خنده", "#ffe08a", 2.8], learned: ["🌱", "یادگیری", "#b6f0c0", 2.6], promise: ["🤝", "قول", "#F6D9A8", 3.2], voice: ["🎙️", "صدا", "#9fd8ff", 2.8], coupon: ["🎟️", "کوپن", "#ffb3c8", 2.6], whenever: ["🫂", "پاکت", "#d4c1ff", 2.6], letter: ["💌", "نامه", "#ffd0dd", 3.6], photo: ["🖼️", "عکس", "#d4c1ff", 3] };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
  async function buildSky() {
    const main = $("main"); if (!main || $("#skySection")) return;
    const sec = el("section", "phase2-section reveal show"); sec.id = "skySection";
    sec.append(el("h2", "section-title", "🌌 آسمان مشترک ما"), el("p", "section-sub", "هر خاطره، هر آرزو و هر ماه با هم بودن، یک ستاره است. ستاره‌ها را لمس کن."));
    const box = el("div", "sky-box"), cv = el("canvas"), pop = el("div", "sky-pop"); box.append(cv, pop); sec.append(box);
    const anchor = $("#finalSection") || $(".ending"); anchor ? main.insertBefore(sec, anchor) : main.append(sec);
    if (window.EmojiFix) sec.querySelectorAll(".section-title").forEach((h) => EmojiFix.wrap(h));
    const stars = [];
    const [sy, sm, sd] = startParts(); const now = new Date();
    const months = Math.min(48, (now.getFullYear() - sy) * 12 + (now.getMonth() - (sm - 1)));
    for (let i = 1; i <= months; i++) stars.push({ id: "m" + i, kind: "month", label: "💞 ماه " + fa(i) + " با هم", sub: "", t: i, c: "#F6D9A8", sz: 3.6 });
    const add = (id, kind, title, sub, t) => { const k = KIND[kind]; if (!k) return; stars.push({ id, kind, label: k[0] + " " + (title || k[1]), sub: sub || k[1], t, c: k[2], sz: k[3] }); };
    try {
      const [items, photos, letters] = await Promise.all([
        read("site_items", "select=id,kind,title,created_at&order=created_at.asc&limit=200").catch(() => []),
        read("gallery_photos", "select=id,title,created_at&order=created_at.asc&limit=80").catch(() => []),
        read("love_letters", "select=id,title,created_at&order=created_at.asc&limit=60").catch(() => [])
      ]);
      const dt = (x) => new Date(x).toLocaleDateString("fa-IR");
      items.forEach((r) => add(r.id, r.kind, r.title, dt(r.created_at), new Date(r.created_at).getTime()));
      photos.forEach((r) => add(r.id, "photo", r.title || "یک عکس", dt(r.created_at), new Date(r.created_at).getTime()));
      letters.forEach((r) => add(r.id, "letter", r.title, dt(r.created_at), new Date(r.created_at).getTime()));
    } catch (e) {}
    const ctx = cv.getContext("2d"); let W = 0, H = 0, dpr = 1, vis = false, raf = 0;
    const dust = Array.from({ length: mob ? 50 : 90 }, () => ({ x: Math.random(), y: Math.random(), r: rand(.4, 1.3), p: rand(0, 6) }));
    const place = () => { stars.forEach((s) => { s.x = 0.07 + hash(String(s.id) + "x") * 0.86; s.y = 0.1 + hash(String(s.id) + "y") * 0.76; }); };
    place();
    const order = stars.filter((s) => s.kind !== "month").slice(0, 30);
    let shoot = null, nextShoot = performance.now() + 3000, sel = null;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = box.clientWidth; H = box.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const draw = (t) => {
      raf = 0; if (!vis || doc.hidden) return;
      ctx.clearRect(0, 0, W, H);
      dust.forEach((d) => { ctx.globalAlpha = .25 + .45 * Math.abs(Math.sin(t / 1400 + d.p)); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, 6.3); ctx.fill(); });
      ctx.globalAlpha = .22; ctx.strokeStyle = "#F6D9A8"; ctx.lineWidth = 1; ctx.beginPath();
      order.forEach((s, i) => { const x = s.x * W, y = s.y * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      stars.forEach((s) => {
        const x = s.x * W, y = s.y * H, tw = .75 + .25 * Math.sin(t / 700 + hash(String(s.id)) * 9), r = s.sz * tw * (s === sel ? 1.6 : 1);
        ctx.globalAlpha = .18; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.3); ctx.fill();
        ctx.globalAlpha = 1; ctx.beginPath();
        for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * .45 : r * 1.25, a = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        ctx.closePath(); ctx.fillStyle = s.c; ctx.fill();
      });
      if (!rm && !shoot && t > nextShoot) { shoot = { x: rand(.5, 1) * W, y: rand(0, .35) * H, t0: t }; nextShoot = t + rand(6000, 11000); }
      if (shoot) { const p = (t - shoot.t0) / 900; if (p > 1) shoot = null; else { const x = shoot.x - p * 220, y = shoot.y + p * 110; const g = ctx.createLinearGradient(x, y, x + 70, y - 35); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.globalAlpha = 1 - p * .6; ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70, y - 35); ctx.stroke(); } }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf && vis && !doc.hidden) raf = requestAnimationFrame(draw); };
    new IntersectionObserver((es) => { vis = es[0].isIntersecting; kick(); }, { threshold: .05 }).observe(box);
    doc.addEventListener("visibilitychange", kick);
    cv.addEventListener("pointerdown", (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 28 * 28;
      stars.forEach((s) => { const dx = s.x * W - x, dy = s.y * H - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = s; } });
      sel = best; pop.classList.toggle("on", !!best);
      if (best) { pop.innerHTML = ""; pop.append(el("b", "", best.label)); if (best.sub) pop.append(el("small", "", best.sub)); vibe(15); }
    });
  }
  whenEl("main", () => setTimeout(buildSky, 600));

  /* ---------- مسیر قلب بین دو شهر ---------- */
  whenEl(".route-stats", (rs) => {
    if ($(".route-arc")) return;
    const w = el("div", "route-arc");
    w.innerHTML = '<svg viewBox="0 0 400 130" role="img" aria-label="مسیر قلب از گرگان تا تهران"><defs><linearGradient id="raG" x1="0" x2="1"><stop offset="0" stop-color="#F6D9A8"/><stop offset="1" stop-color="#ef5b7c"/></linearGradient></defs><path id="raP" d="M40 100 Q200 -30 360 100" fill="none" stroke="url(#raG)" stroke-width="2.5" stroke-dasharray="6 7" stroke-linecap="round"/><circle cx="40" cy="100" r="6" fill="#F6D9A8"/><circle cx="360" cy="100" r="6" fill="#ef5b7c"/><text x="40" y="122" text-anchor="middle">گرگان</text><text x="360" y="122" text-anchor="middle">تهران</text><text class="ra-h" font-size="20" text-anchor="middle" dy="6">💗<animateMotion dur="5s" repeatCount="indefinite" rotate="0"><mpath href="#raP"/></animateMotion></text></svg>';
    if (rm) { const a = w.querySelector("animateMotion"); if (a) a.remove(); }
    rs.after(w);
  });

  /* ---------- حضور زنده و بوسه (Supabase Realtime) ---------- */
  const Live = (() => {
    const bar = el("div", ""); bar.id = "liveBar"; const dot = el("span", "live-dot"), txt = el("span", "", "");
    bar.append(dot, txt);
    const kb = el("button", "", "💋"); kb.id = "kissBtn"; kb.type = "button"; kb.setAttribute("aria-label", "ارسال بوسه");
    doc.body.append(bar, kb);
    let ws = null, ref = 1, hb = 0, retry = 0, joined = false, who = "", present = new Set(), stopped = false, lastTouch = 0;
    const topic = "realtime:me-and-you-live-7k2";
    const partner = () => other(who);
    const send = (o) => { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} };
    const msg = (event, payload, t) => ({ topic: t || topic, event, payload, ref: String(ref++), join_ref: "1" });
    const refresh = () => { const on = present.has(partner()); bar.classList.toggle("on", on); txt.textContent = on ? `${partner()} هم الان اینجاست 🤍` : ""; kb.classList.toggle("online", on); };
    const heartsAll = (n) => { if (window.MY && MY.burst) MY.burst(innerWidth / 2, innerHeight / 2, n); };
    const onMsg = (m) => {
      if (m.event === "phx_reply" && m.topic === topic && m.payload && m.payload.status === "ok" && !joined) {
        joined = true; retry = 0; send(msg("presence", { type: "presence", event: "track", payload: { who, at: Date.now() } }));
      } else if (m.event === "presence_state" && m.payload) { present = new Set(Object.keys(m.payload)); refresh(); }
      else if (m.event === "presence_diff" && m.payload) {
        const before = present.has(partner());
        Object.keys(m.payload.joins || {}).forEach((k) => present.add(k)); Object.keys(m.payload.leaves || {}).forEach((k) => present.delete(k)); refresh();
        if (!before && present.has(partner())) { heartbeat(); }
        window.dispatchEvent(new CustomEvent("live:presence", { detail: { on: present.has(partner()) } }));
      } else if (m.event === "broadcast" && m.payload) {
        const e = m.payload.event, d = m.payload.payload || {};
        if (d.from === who) return;
        if (e === "kiss") { heartsAll(34); heartbeat(); chime(); showToast(`💋 ${d.from || partner()} برایت بوسه فرستاد`); }
        else if (e !== "touch") window.dispatchEvent(new CustomEvent("live:" + e, { detail: d }));
        else if (e === "touch" && present.has(partner())) { const h = el("div", "live-touch", "💗"); h.style.left = (d.x * innerWidth) + "px"; h.style.top = (d.y * innerHeight) + "px"; doc.body.append(h); setTimeout(() => h.remove(), 1500); }
      }
    };
    const showToast = (t) => { const box = $("#nfToasts"); if (!box) return; const x = el("div", "nf-toast"); x.append(el("b", "", t)); box.append(x); setTimeout(() => x.remove(), 6000); };
    function connect() {
      if (stopped || !base || !key || !who) return;
      try { ws = new WebSocket(base.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(key) + "&vsn=1.0.0"); } catch (e) { return; }
      joined = false;
      ws.onopen = () => {
        const payload = { config: { broadcast: { ack: false, self: false }, presence: { key: who, enabled: true }, postgres_changes: [], private: false } };
        if (/^eyJ/.test(key)) payload.access_token = key;
        send({ topic, event: "phx_join", payload, ref: "1", join_ref: "1" });
        clearInterval(hb); hb = setInterval(() => send({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref++) }), 25000);
      };
      ws.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch (x) {} };
      ws.onclose = () => { clearInterval(hb); present = new Set(); refresh(); if (!stopped) setTimeout(connect, Math.min(30000, 2000 * ++retry)); };
      ws.onerror = () => { try { ws.close(); } catch (e) {} };
    }
    kb.onclick = () => {
      kb.animate && kb.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 400 });
      heartsAll(16); vibe(40); send(msg("broadcast", { type: "broadcast", event: "kiss", payload: { from: who } }));
      showToast(present.has(partner()) ? `💋 بوسه برای ${partner()} رفت` : `💋 ${partner()} الان آنلاین نیست؛ از بخش دلتنگی هم می‌توانی پیام بفرستی`);
    };
    doc.addEventListener("pointerdown", (e) => {
      if (!present.has(partner()) || e.target.closest("button,a,input,textarea,select,#nfPanel")) return;
      const n = Date.now(); if (n - lastTouch < 500) return; lastTouch = n;
      send(msg("broadcast", { type: "broadcast", event: "touch", payload: { from: who, x: +(e.clientX / innerWidth).toFixed(3), y: +(e.clientY / innerHeight).toFixed(3) } }));
    }, { passive: true });
    const showBtn = () => { kb.classList.toggle("show", !$("#gate") && !!who); };
    const iv = setInterval(() => { showBtn(); if (!$("#gate")) { showBtn(); clearInterval(iv); } }, 400);
    return {
      emit(event, payload) { send(msg("broadcast", { type: "broadcast", event, payload: Object.assign({ from: who }, payload || {}) })); },
      partnerOn() { return present.has(partner()); },
      start() { const w = getWho(); if (!w) return; if (ws && who === w) return; if (ws) { stopped = true; try { ws.close(); } catch (e) {} stopped = false; } who = w; present = new Set(); connect(); }
    };
  })();
  window.LiveBus = Live;
  if (getWho() && !gate) Live.start();
  doc.addEventListener("visibilitychange", () => { if (!doc.hidden && getWho() && !$("#gate")) Live.start(); });

  /* ---------- نصب مثل اپ ---------- */
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.__installPrompt = e; });
  window.addEventListener("appinstalled", () => { window.__installPrompt = null; });
})();
