/* ME & YOU — تم فصل‌ها و مناسبت‌ها: هر فصل و هر مناسبت مهم رنگ، افکت و برچسب خودش را دارد */
(() => {
  "use strict";
  const doc = document, root = doc.documentElement;
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mob = matchMedia("(max-width:700px), (pointer:coarse)").matches;
  const ls = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const rand = (a, b) => a + Math.random() * (b - a);
  const cfg = window.SUPABASE_CONFIG || {}, base = String(cfg.url || "").replace(/\/$/, ""), key = cfg.anonKey || "";
  const el = (t, c, x) => { const e = doc.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* k: fall | rise | float ؛ g: اشکال (با : شروع شود) یا ایموجی */
  const T = {
    spring:{ n: "بهار", e: "🌸", sw: "#e07a9a", chip: "🌸 بهار؛ فصل شکفتن عشق", fx: { k: "fall", g: [":petal"], c: ["#ffc2d4", "#ffdce6", "#fff"], n: 34, s: [6, 12], v: [.5, 1.4] } },
    summer:{ n: "تابستان", e: "☀️", sw: "#e08a5a", chip: "☀️ تابستانِ گرم ما", fx: { k: "float", g: [":glow"], c: ["#ffe08a", "#fff3b0"], n: 30, s: [2, 4], v: [.2, .6] } },
    autumn:{ n: "پاییز", e: "🍂", sw: "#a85a2a", chip: "🍂 پاییز و دل‌های نزدیک", fx: { k: "fall", g: [":leaf"], c: ["#d9822b", "#b5502a", "#e8b04a", "#9c3d1e"], n: 28, s: [7, 13], v: [.6, 1.5] } },
    winter:{ n: "زمستان", e: "❄️", sw: "#5a78a8", chip: "❄️ زمستان؛ گرم‌تر از همیشه", fx: { k: "fall", g: [":snow"], c: ["#ffffff", "#e6f0ff"], n: 46, s: [2, 5], v: [.5, 1.2] } },
    yalda:{ n: "شب یلدا", e: "🍉", sw: "#a31f3a", chip: "🍉 شب یلدا مبارک", fx: { k: "fall", g: ["🍉", "✨", "🍎", "🌙"], n: 20, s: [16, 26], v: [.5, 1.1] } },
    nowruz:{ n: "نوروز", e: "🌷", sw: "#c8a24a", chip: "🌷 نوروزت مبارک", fx: { k: "fall", g: ["🌷", "🌸", "✨", "🐠", "🥚"], n: 22, s: [16, 26], v: [.5, 1.2] } },
    sizdah:{ n: "سیزده‌به‌در", e: "🌿", sw: "#9ac24a", chip: "🌿 سیزده‌به‌در مبارک", fx: { k: "fall", g: ["🌿", "🍃", "🌼", "🪁"], n: 20, s: [16, 24], v: [.5, 1.1] } },
    valentine:{ n: "ولنتاین", e: "💘", sw: "#e0476e", chip: "💘 روز عاشقان مبارک", fx: { k: "rise", g: ["💗", "💖", "🌹", "💘"], n: 24, s: [16, 28], v: [.6, 1.4] } },
    esfand5:{ n: "روز عشق (اسفندگان)", e: "💝", sw: "#d94a82", chip: "💝 روز عشق مبارک", fx: { k: "rise", g: ["💝", "💞", "🌸", "💗"], n: 24, s: [16, 28], v: [.6, 1.4] } },
    chaharshanbe:{ n: "چهارشنبه‌سوری", e: "🔥", sw: "#d9531e", chip: "🔥 چهارشنبه‌سوری مبارک", fx: { k: "rise", g: [":spark"], c: ["#ffb347", "#ff7a1a", "#ffe08a"], n: 40, s: [2, 4], v: [1, 2.6] } },
    eid:{ n: "عید", e: "🌙", sw: "#3aa89a", chip: "🌙 عیدتان مبارک", fx: { k: "float", g: ["🌙", "⭐", "✨"], n: 16, s: [14, 22], v: [.2, .5] } },
    dokhtar:{ n: "روز دختر", e: "👑", sw: "#e07aa8", chip: "👑 روز دختر مبارک", fx: { k: "rise", g: ["🌸", "👑", "💖", "🦋"], n: 22, s: [16, 26], v: [.5, 1.2] } },
    birthday:{ n: "تولد", e: "🎂", sw: "#e05aa0", chip: "🎂 تولدت مبارک", fx: { k: "rise", g: ["🎈", "🎉", "🎁", "✨"], n: 24, s: [20, 32], v: [.7, 1.5] } },
    anniversary:{ n: "سالگرد", e: "🎉", sw: "#d4a05a", chip: "🎉 سالگرد ما مبارک", fx: { k: "rise", g: ["💞", "💍", "🥂", "✨"], n: 24, s: [18, 30], v: [.6, 1.4] } },
    month:{ n: "ماهگرد", e: "💞", sw: "#e07a9a", chip: "💞 ماهگرد ما مبارک", fx: { k: "rise", g: ["💞", "💗", "✨"], n: 22, s: [16, 26], v: [.6, 1.3] } },
    milestone:{ n: "روزشمار", e: "✨", sw: "#d4a05a", chip: "✨ روزهای با هم", fx: { k: "float", g: ["✨", "💫", "⭐"], n: 20, s: [14, 22], v: [.3, .8] } },
    meeting:{ n: "روز دیدار", e: "🤍", sw: "#e08a8a", chip: "🤍 امروز روز دیدار است", fx: { k: "rise", g: ["🤍", "💗", "✨"], n: 26, s: [16, 28], v: [.7, 1.6] } },
    newyear:{ n: "سال نو میلادی", e: "🎆", sw: "#7a4ac0", chip: "🎆 سال نو مبارک", fx: { k: "rise", g: ["🎆", "✨", "🎉", "🥂"], n: 22, s: [18, 30], v: [.6, 1.4] } }
  };
  const ORDER = ["spring", "summer", "autumn", "winter", "valentine", "esfand5", "yalda", "nowruz", "sizdah", "chaharshanbe", "eid", "dokhtar", "newyear", "birthday", "anniversary", "month", "milestone", "meeting"];

  /* ---------- تشخیص مناسبت امروز ---------- */
  const ctx = { start: "", meeting: "", bd: {} };
  const islamic = (d) => { try { const p = new Intl.DateTimeFormat("en-u-ca-islamic-civil", { day: "numeric", month: "numeric" }).formatToParts(d); const g = (t) => +p.find((x) => x.type === t).value; return { m: g("month"), d: g("day") }; } catch (e) { return null; } };
  function decide() {
    const J = window.JDate; const who = ls.get("who");
    const z = new Date(Date.now() + 3.5 * 3600000), gy = z.getUTCFullYear(), gm = z.getUTCMonth() + 1, gd = z.getUTCDate();
    const tj = J ? J.toJalali(gy, gm, gd) : { jy: 0, jm: 1, jd: 1 };
    const season = tj.jm <= 3 ? "spring" : tj.jm <= 6 ? "summer" : tj.jm <= 9 ? "autumn" : "winter";
    let r = { id: season, chip: T[season].chip };
    if (!J) return r;
    // تولد
    for (const [name, v] of Object.entries(ctx.bd)) {
      const m = /^(\d{1,4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(v || ""); if (!m) continue; let jm, jd;
      if (+m[1] >= 1700) { const j = J.toJalali(+m[1], +m[2], +m[3]); jm = j.jm; jd = j.jd; } else { jm = +m[2]; jd = +m[3]; }
      if (jm === tj.jm && jd === tj.jd) return { id: "birthday", chip: who === name ? "🎂 تولدت مبارک!" : `🎂 تولد ${name} مبارک!` };
    }
    // سالگرد، ماهگرد، روزشمار
    const sj = ctx.start && J.isoToJalali(ctx.start);
    if (sj) {
      const len = J.jalaliMonthLength(tj.jy, tj.jm), months = (tj.jy - sj.jy) * 12 + (tj.jm - sj.jm);
      if (tj.jd === Math.min(sj.jd, len) && months > 0) return months % 12 === 0 ? { id: "anniversary", chip: `🎉 ${fa(months / 12)} سالگی ما مبارک` } : { id: "month", chip: `💞 ماهگرد ${fa(months)}ام ما مبارک` };
      const [y, m, d] = ctx.start.split("-").map(Number); const days = Math.round((Date.UTC(gy, gm - 1, gd) - Date.UTC(y, m - 1, d)) / 86400000);
      if (days > 0 && days % 100 === 0) return { id: "milestone", chip: `✨ ${fa(days)} روز با هم` };
    }
    // روز دیدار
    if (ctx.meeting) { const d = new Date(ctx.meeting); if (!Number.isNaN(d.getTime())) { const q = new Date(d.getTime() + 3.5 * 3600000); if (q.getUTCFullYear() === gy && q.getUTCMonth() + 1 === gm && q.getUTCDate() === gd) return { id: "meeting", chip: T.meeting.chip }; } }
    if (gm === 2 && gd === 14) return { id: "valentine", chip: T.valentine.chip };
    if (tj.jm === 12 && tj.jd === 5) return { id: "esfand5", chip: T.esfand5.chip };
    if (tj.jm === 9 && tj.jd === 30) return { id: "yalda", chip: T.yalda.chip };
    if (tj.jm === 9 && tj.jd >= 28) return { id: "yalda", chip: tj.jd === 29 ? "🍉 فردا شب یلداست" : "🍉 " + fa(30 - tj.jd) + " روز تا شب یلدا" };
    if (tj.jm === 1 && tj.jd <= 13) return { id: "nowruz", chip: tj.jd === 13 ? T.sizdah.chip : T.nowruz.chip };
    if (tj.jm === 12 && tj.jd >= 22) { // سه‌شنبه‌شب آخر سال و چهارشنبه‌سوری
      const g = J.toGregorian(tj.jy + 1, 1, 1); let t = Date.UTC(g.gy, g.gm - 1, g.gd) - 86400000; while (new Date(t).getUTCDay() !== 3) t -= 86400000;
      const today = Date.UTC(gy, gm - 1, gd); if (today === t || today === t - 86400000) return { id: "chaharshanbe", chip: T.chaharshanbe.chip };
    }
    if (tj.jm === 12 && tj.jd >= 20) { const left = J.jalaliMonthLength(tj.jy, 12) - tj.jd + 1; return { id: "nowruz", chip: left === 1 ? "🌱 فردا نوروز است" : "🌱 " + fa(left) + " روز تا نوروز" }; }
    if ((gm === 12 && gd === 31) || (gm === 1 && gd === 1)) return { id: "newyear", chip: T.newyear.chip };
    // مناسبت‌های قمری (تقریبی؛ ±۱ روز)
    const now = Date.now(); const near = (m, d) => [-1, 0, 1].some((k) => { const i = islamic(new Date(now + k * 86400000)); return i && i.m === m && i.d === d; });
    if (near(11, 1)) return { id: "dokhtar", chip: T.dokhtar.chip };
    if (near(10, 1) || near(10, 2)) return { id: "eid", chip: "🌙 عید فطر مبارک" };
    if (near(12, 10)) return { id: "eid", chip: "🕌 عید قربان مبارک" };
    return r;
  }

  /* ---------- افکت ---------- */
  let cv = null, raf = 0, parts = [], cur = null, curChip = "", vis = true;
  function stopFx() { cancelAnimationFrame(raf); raf = 0; if (cv) { cv.remove(); cv = null; } parts = []; }
  function startFx(t) {
    stopFx(); if (rm || !t || !t.fx) return;
    cv = el("canvas"); cv.id = "themeFx"; doc.body.append(cv); const ctx2 = cv.getContext("2d");
    const alpha = doc.getElementById("chatApp") ? .55 : .85;
    let W = 0, H = 0, dpr = 1; const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx2.setTransform(dpr, 0, 0, dpr, 0, 0); }; resize(); addEventListener("resize", resize);
    const f = t.fx, N = Math.round(f.n * (mob ? .55 : 1) * (doc.getElementById("chatApp") ? .6 : 1));
    const mk = (init) => ({ x: rand(0, W), y: f.k === "rise" ? (init ? rand(0, H) : H + rand(10, 60)) : (init ? rand(0, H) : rand(-60, -5)), v: rand(f.v[0], f.v[1]), s: rand(f.s[0], f.s[1]), r: rand(0, 6), vr: rand(-.03, .03), sw: rand(0, 6), g: f.g[Math.floor(Math.random() * f.g.length)], c: f.c ? f.c[Math.floor(Math.random() * f.c.length)] : "#fff", p: rand(0, 6) });
    parts = Array.from({ length: N }, () => mk(true)); let last = 0;
    const draw = (now) => {
      raf = requestAnimationFrame(draw); if (doc.hidden || now - last < 33) return; last = now; ctx2.clearRect(0, 0, W, H);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]; p.sw += .02; p.r += p.vr;
        if (f.k === "float") { p.x += Math.sin(p.sw) * .5; p.y += Math.cos(p.sw * .7) * .4 * p.v; if (p.x < -20) p.x = W + 10; if (p.x > W + 20) p.x = -10; if (p.y < -20) p.y = H + 10; if (p.y > H + 20) p.y = -10; }
        else if (f.k === "rise") { p.y -= p.v; p.x += Math.sin(p.sw) * .7; if (p.y < -40) parts[i] = mk(false); }
        else { p.y += p.v; p.x += Math.sin(p.sw) * (p.g === ":snow" ? .6 : 1); if (p.y > H + 30) parts[i] = mk(false); }
        const q = parts[i]; ctx2.save(); ctx2.translate(q.x, q.y); ctx2.rotate(f.k === "rise" && q.g[0] !== ":" ? Math.sin(q.sw) * .3 : q.r); ctx2.globalAlpha = alpha; ctx2.fillStyle = q.c;
        const s = q.s;
        if (q.g === ":petal") { ctx2.beginPath(); ctx2.ellipse(0, 0, s * .8, s * .45, 0, 0, 6.3); ctx2.fill(); }
        else if (q.g === ":leaf") { ctx2.beginPath(); ctx2.moveTo(0, -s); ctx2.quadraticCurveTo(s, 0, 0, s); ctx2.quadraticCurveTo(-s, 0, 0, -s); ctx2.fill(); }
        else if (q.g === ":snow") { ctx2.beginPath(); ctx2.arc(0, 0, s / 2.6, 0, 6.3); ctx2.fill(); }
        else if (q.g === ":glow") { ctx2.globalAlpha = (.25 + .6 * Math.abs(Math.sin(now / 900 + q.p))) * alpha; ctx2.shadowColor = q.c; ctx2.shadowBlur = 12; ctx2.beginPath(); ctx2.arc(0, 0, s * .8, 0, 6.3); ctx2.fill(); }
        else if (q.g === ":spark") { ctx2.globalAlpha = Math.max(.15, Math.min(1, q.y / H + .2)) * alpha; ctx2.shadowColor = q.c; ctx2.shadowBlur = 8; ctx2.beginPath(); ctx2.arc(0, 0, s * .5, 0, 6.3); ctx2.fill(); }
        else { ctx2.font = s + "px serif"; ctx2.textAlign = "center"; ctx2.textBaseline = "middle"; ctx2.fillText(q.g, 0, 0); }
        ctx2.restore();
      }
    };
    raf = requestAnimationFrame(draw);
  }

  /* ---------- اعمال ---------- */
  function chipEl(text) {
    const old = doc.querySelectorAll(".theme-chip"); old.forEach((x) => x.remove());
    const card = doc.querySelector(".hero-card"); if (!card || !text) return;
    const c = el("div", "theme-chip", text); const g = card.querySelector(".tod-greet"); g ? g.after(c) : card.prepend(c);
  }
  function apply(id, chip) {
    cur = id; curChip = chip || (T[id] && T[id].chip) || ""; root.dataset.theme = id; const t = T[id]; startFx(t);
    const m = doc.querySelector('meta[name="theme-color"]'); if (m) { const c = getComputedStyle(root).getPropertyValue("--th-a").trim(); if (c) m.content = c; }
    chipEl(chip || (t && t.chip)); window.dispatchEvent(new CustomEvent("themechange", { detail: { id } }));
  }
  function run() {
    const q = new URLSearchParams(location.search).get("theme"), pref = ls.get("theme-pref") || "auto";
    const forced = (q && T[q] && q) || (pref !== "auto" && T[pref] && pref) || "";
    if (forced) { apply(forced, T[forced].chip); return; }
    const r = decide(); apply(r.id, r.chip);
  }

  /* ---------- انتخابگر (برای پیش‌نمایش همهٔ تم‌ها) ---------- */
  function openPicker() {
    const bg = el("div", "th-pick-bg"), p = el("div", "th-pick"); const close = () => { bg.remove(); p.remove(); };
    bg.onclick = close; p.append(el("h4", "", "🎨 تم سایت"), el("p", "", "به‌طور پیش‌فرض خودکار است: هر فصل و هر مناسبت تم خودش را می‌گیرد. اینجا می‌توانی همه را پیش‌نمایش کنی."));
    const g = el("div", "th-grid"); const pref = ls.get("theme-pref") || "auto";
    const item = (id, ic, name, sw) => { const b = el("button", "th-item" + (pref === id ? " on" : "")); b.type = "button"; b.append(el("i", "", ic), el("span", "", name)); if (sw) { const s = el("span", "sw"); s.style.background = sw; b.append(s); } b.onclick = () => { ls.set("theme-pref", id); close(); run(); }; g.append(b); };
    item("auto", "🪄", "خودکار (پیشنهادی)"); ORDER.forEach((id) => item(id, T[id].e, T[id].n, T[id].sw)); p.append(g); doc.body.append(bg, p);
  }

  /* ---------- راه‌اندازی ---------- */
  run();
  if (base && key) {
    const h = { apikey: key }; if (/^eyJ/.test(key)) h.Authorization = "Bearer " + key;
    fetch(`${base}/rest/v1/site_content?select=key,value&key=in.(start_date,meeting_date,birthday_maji,birthday_mohammad)`, { headers: h }).then((r) => (r.ok ? r.json() : [])).then((rows) => {
      const m = Object.fromEntries((rows || []).map((r) => [r.key, String(r.value || "")]));
      ctx.start = m.start_date || ""; ctx.meeting = m.meeting_date || ""; ctx.bd = { "ماجی": m.birthday_maji || "", "محمد": m.birthday_mohammad || "" }; run();
    }).catch(() => {});
  }
  if (window.CLOUD_START_DATE) { ctx.start = window.CLOUD_START_DATE; }
  setTimeout(() => { if (!ctx.start && window.CLOUD_START_DATE) { ctx.start = window.CLOUD_START_DATE; run(); } }, 3000);
  window.addEventListener("role-chosen", () => run());
  doc.addEventListener("visibilitychange", () => { if (!doc.hidden) { const r = decide(); if (!ls.get("theme-pref") || ls.get("theme-pref") === "auto") { if (r.id !== cur) apply(r.id, r.chip); } } });
  // برچسب باید بعد از ساخته شدن کارت اصلی هم بیاید
  const mo = new MutationObserver(() => { if (doc.querySelector(".hero-card") && !doc.querySelector(".theme-chip") && cur) { chipEl(curChip); } if (doc.querySelector(".theme-chip")) mo.disconnect(); });
  mo.observe(doc.documentElement, { childList: true, subtree: true });
  window.Themes = { list: T, apply, run, openPicker };
})();
