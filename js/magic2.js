/* ME & YOU — magic2 */
(() => {
  "use strict";
  const doc = document, root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s);
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer:coarse)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const ls = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const el = (t, c, x) => { const e = doc.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const cfg = window.SUPABASE_CONFIG || {};
  const base = String(cfg.url || "").replace(/\/$/, ""), key = cfg.anonKey || "";
  const hdr = () => { const h = { apikey: key }; if (/^eyJ/.test(key)) h.Authorization = "Bearer " + key; return h; };
  const read = (table, q) => fetch(`${base}/rest/v1/${table}?${q}`, { headers: hdr() }).then((r) => { if (!r.ok) throw Error(table); return r.json(); });
  const who = () => ls.get("who");
  const other = (w) => (w === "ماجی" ? "محمد" : "ماجی");
  const vibe = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const bus = () => window.LiveBus;
  const emit = (e, p) => { try { bus() && bus().emit(e, p); } catch (x) {} };
  const partnerOn = () => { try { return !!(bus() && bus().partnerOn()); } catch (e) { return false; } };
  const startParts = () => (window.CLOUD_START_DATE || (typeof START_DATE !== "undefined" ? START_DATE : "2026-06-28")).split("-").map(Number);
  const whenEl = (sel, cb) => { const f = $(sel); if (f) return cb(f); const mo = new MutationObserver(() => { const e = $(sel); if (e) { mo.disconnect(); cb(e); } }); mo.observe(doc.body, { childList: true, subtree: true }); };
  const place = (sec) => { const main = $("main"); if (!main) return; const a = $("#finalSection") || $(".ending"); a ? main.insertBefore(sec, a) : main.append(sec); if (window.EmojiFix) sec.querySelectorAll(".section-title").forEach((h) => EmojiFix.wrap(h)); };
  const mkSection = (id, title, sub) => { const s = el("section", "phase2-section reveal show"); s.id = id; s.append(el("h2", "section-title", title), el("p", "section-sub", sub)); return s; };
  const todayKey = () => { const n = new Date(); return n.getFullYear() + "-" + (n.getMonth() + 1) + "-" + n.getDate(); };

  /* ================= ۳) موسیقی هم‌زمان ================= */
  function syncMusic() {
    const a = $("#music"); if (!a) return; let lock = false;
    const guard = (fn) => { lock = true; try { fn(); } catch (e) {} setTimeout(() => { lock = false; }, 600); };
    a.addEventListener("play", () => { if (!lock && partnerOn()) emit("music", { a: "play", t: a.currentTime }); });
    a.addEventListener("pause", () => { if (!lock && partnerOn()) emit("music", { a: "pause", t: a.currentTime }); });
    window.addEventListener("live:music", (e) => {
      const d = e.detail || {};
      guard(() => {
        if (d.a === "play") { if (Math.abs(a.currentTime - d.t) > 1.2) a.currentTime = d.t; a.play().catch(() => {}); }
        else if (d.a === "pause") { a.pause(); if (Number.isFinite(d.t)) a.currentTime = d.t; }
      });
    });
  }

  /* ================= ۴) آب‌وهوای دو شهر ================= */
  const WX = (c, day) => c === 0 ? (day ? "☀️" : "🌙") : c <= 2 ? (day ? "🌤️" : "☁️") : c === 3 ? "☁️" : c <= 48 ? "🌫️" : c <= 57 ? "🌦️" : c <= 67 ? "🌧️" : c <= 77 ? "❄️" : c <= 82 ? "🌧️" : c <= 86 ? "🌨️" : "⛈️";
  const WXT = (c) => c === 0 ? "آسمان صاف" : c <= 2 ? "کمی ابری" : c === 3 ? "ابری" : c <= 48 ? "مه‌آلود" : c <= 57 ? "نم‌نم باران" : c <= 67 ? "بارانی" : c <= 77 ? "برفی" : c <= 82 ? "رگبار" : c <= 86 ? "برف سنگین" : "طوفانی";
  function buildWeather(anchor) {
    const w = el("div", "wx"); anchor.after(w);
    const draw = (rows) => { w.innerHTML = ""; [["گرگان", rows[0]], ["تهران", rows[1]]].forEach(([n, r]) => { if (!r) return; const c = el("div", "wx-c"); c.append(el("div", "wx-i", WX(r.weather_code, r.is_day)), el("b", "", fa(Math.round(r.temperature_2m)) + "°"), el("small", "", n + " · " + WXT(r.weather_code))); w.append(c); }); };
    const cached = (() => { try { const o = JSON.parse(ls.get("wx-cache") || "null"); return o && Date.now() - o.t < 1800000 ? o.rows : null; } catch (e) { return null; } })();
    if (cached) return draw(cached);
    fetch("https://api.open-meteo.com/v1/forecast?latitude=36.5659,35.6892&longitude=53.0586,51.3890&current=temperature_2m,weather_code,is_day&timezone=auto")
      .then((r) => r.json()).then((j) => { const arr = Array.isArray(j) ? j : [j]; const rows = arr.map((x) => x && x.current); ls.set("wx-cache", JSON.stringify({ t: Date.now(), rows })); draw(rows); }).catch(() => w.remove());
  }

  /* ================= ۵) کارت خراشیدنی ================= */
  const SCR = ["امروز یک بوسهٔ طلبکاری از من داری 💋", "یک آغوش بلند، قول من برای دیدار بعدی 🤍", "امشب خوابت را من می‌بینم 🌙", "هر وقت دلت گرفت، یادت باشد دوستت دارم ✨", "یک شام دونفره، با انتخاب خودت 🍽️", "یک ویس بلند فقط برای تو 🎙️", "امروز هر چه بخواهی، حق با توست 😌", "یک خواسته‌ی کوچک؛ بدون سؤال، بدون بهانه 🎁", "بغلت می‌کنم تا وقتی که خسته شوی؛ یعنی هیچ‌وقت 🫂", "برایت آهنگی می‌فرستم که به یادت نوشته‌ام 🎶"];
  function buildScratch() {
    const sec = mkSection("scratchSection", "🎟️ کارت خراشیدنی امروز", "با انگشت بخراش تا سورپرایز امروز معلوم شود.");
    const box = el("div", "sc-box"), under = el("div", "sc-under"), cv = el("canvas"); const day = Math.floor(Date.now() / 86400000);
    under.textContent = SCR[(day + (who() === "ماجی" ? 3 : 0)) % SCR.length];
    box.append(under, cv); sec.append(box); place(sec);
    const ctx = cv.getContext("2d"); const rect = () => { const dpr = Math.min(2, devicePixelRatio || 1); cv.width = box.clientWidth * dpr; cv.height = box.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    rect(); const W = box.clientWidth, H = box.clientHeight;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#d9b8c4"); g.addColorStop(.5, "#f0d9a8"); g.addColorStop(1, "#c89aae"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = "700 20px Vazirmatn,sans-serif"; ctx.textAlign = "center"; ctx.fillText("بخراش ✦ ♥ ✦ بخراش", W / 2, H / 2 + 6);
    if (ls.get("scratch-" + todayKey())) { cv.classList.add("gone"); return; }
    let down = false, checks = 0; ctx.globalCompositeOperation = "destination-out";
    const dot = (e) => { const r = cv.getBoundingClientRect(); ctx.beginPath(); ctx.arc(e.clientX - r.left, e.clientY - r.top, 20, 0, 6.3); ctx.fill(); if (++checks % 8 === 0) test(); };
    const test = () => { try { const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let t = 0, n = 0; for (let i = 3; i < d.length; i += 160) { n++; if (d[i] < 20) t++; } if (t / n > .5) { cv.classList.add("gone"); ls.set("scratch-" + todayKey(), "1"); vibe([40, 60, 40]); if (window.MagicFx) MagicFx.confetti(2600); } } catch (e) {} };
    cv.addEventListener("pointerdown", (e) => { down = true; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); dot(e); e.preventDefault(); });
    cv.addEventListener("pointermove", (e) => { if (down) { dot(e); e.preventDefault(); } });
    ["pointerup", "pointercancel"].forEach((t) => cv.addEventListener(t, () => { down = false; test(); }));
  }

  /* ================= ۶) چنین روزی در گذشته ================= */
  async function buildThisDay(counter) {
    try {
      const [items, photos, letters] = await Promise.all([read("site_items", "select=id,kind,title,created_at&limit=300").catch(() => []), read("gallery_photos", "select=id,title,created_at&limit=100").catch(() => []), read("love_letters", "select=id,title,created_at&limit=100").catch(() => [])]);
      const all = [...items.map((x) => ({ t: x.title || "یک خاطره", d: x.created_at })), ...photos.map((x) => ({ t: x.title || "یک عکس", d: x.created_at })), ...letters.map((x) => ({ t: "نامه: " + (x.title || ""), d: x.created_at }))].filter((x) => x.d);
      const now = new Date(); let hit = null, lab = "";
      all.forEach((x) => { const d = new Date(x.d); if (d.getDate() !== now.getDate()) return; const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()); if (months <= 0) return; if (!hit || months < hit.months) { hit = { months, t: x.t }; } });
      if (!hit) return; const y = Math.floor(hit.months / 12), mo = hit.months % 12;
      lab = [y ? fa(y) + " سال" : "", mo ? fa(mo) + " ماه" : ""].filter(Boolean).join(" و ");
      const c = el("div", "m2-card"); c.append(doc.createTextNode("📅 " + lab + " پیش، در چنین روزی: "), el("b", "", "«" + hit.t + "»"));
      counter.append(c);
    } catch (e) {}
  }

  /* ================= ۸) شمارش معکوس ماهگرد بعدی ================= */
  function buildNextMonth(after) {
    const J = window.JDate; if (!J) return;
    const [sy, sm, sd] = startParts(); const sj = J.isoToJalali(`${sy}-${String(sm).padStart(2, "0")}-${String(sd).padStart(2, "0")}`); if (!sj) return;
    const c = el("div", "m2-card"); after.after(c);
    const upd = () => {
      const z = new Date(Date.now() + 3.5 * 3600000), tj = J.toJalali(z.getUTCFullYear(), z.getUTCMonth() + 1, z.getUTCDate());
      const at = (jy, jm) => { while (jm > 12) { jm -= 12; jy++; } while (jm < 1) { jm += 12; jy--; } const d = Math.min(sj.jd, J.jalaliMonthLength(jy, jm)); const g = J.toGregorian(jy, jm, d); return { jy, jm, ms: Date.UTC(g.gy, g.gm - 1, g.gd) }; };
      const todayMs = Date.UTC(z.getUTCFullYear(), z.getUTCMonth(), z.getUTCDate());
      let nx = at(tj.jy, tj.jm); if (nx.ms < todayMs) nx = at(tj.jy, tj.jm + 1);
      let pv = at(nx.jy, nx.jm - 1); const total = Math.max(1, Math.round((nx.ms - pv.ms) / 86400000)), left = Math.round((nx.ms - todayMs) / 86400000);
      const months = (nx.jy - sj.jy) * 12 + (nx.jm - sj.jm), yearly = months > 0 && months % 12 === 0;
      const frac = Math.max(0, Math.min(1, 1 - left / total));
      c.innerHTML = "";
      const h = el("div", "nm-heart"); h.innerHTML = `<svg viewBox="0 0 32 29"><defs><clipPath id="nmc"><rect x="0" y="${29 - 29 * frac}" width="32" height="${29 * frac + 1}"/></clipPath></defs><path d="M16 28C-6 12 6-4 16 6 26-4 38 12 16 28z" fill="rgba(255,255,255,.18)"/><path d="M16 28C-6 12 6-4 16 6 26-4 38 12 16 28z" fill="#ef5b7c" clip-path="url(#nmc)"/></svg>`;
      const t = el("div"); t.append(doc.createTextNode(left === 0 ? "امروز " : "تا "), el("b", "", yearly ? "سالگرد بعدی" : "ماهگرد بعدی"), doc.createTextNode(left === 0 ? " است 🎉" : " فقط " + fa(left) + " روز مانده"));
      c.append(h, t);
    };
    upd(); setInterval(upd, 3600000);
  }

  /* ================= ۷) ژیروسکوپ روی عکس‌ها ================= */
  function gyro() {
    if (!coarse || rm || !("DeviceOrientationEvent" in window)) return;
    const ph = $("#photos"); if (!ph) return; let gx = 0, gy = 0, tx = 0, ty = 0, on = false, raf = 0, vis = false;
    const loop = () => { raf = 0; if (!vis || doc.hidden) return; gx += (tx - gx) * .08; gy += (ty - gy) * .08; ph.style.setProperty("--gx", gx.toFixed(2)); ph.style.setProperty("--gy", gy.toFixed(2)); raf = requestAnimationFrame(loop); };
    const kick = () => { if (!raf && vis) raf = requestAnimationFrame(loop); };
    new IntersectionObserver((es) => { vis = es[0].isIntersecting; kick(); }, { threshold: .05 }).observe(ph);
    const handler = (e) => { if (e.gamma == null) return; const g = Math.max(-25, Math.min(25, e.gamma)), b = Math.max(-25, Math.min(25, (e.beta || 0) - 40)); tx = Math.abs(g) < 3 ? 0 : g / 25 * 8; ty = Math.abs(b) < 3 ? 0 : b / 25 * 8; };
    const start = () => { if (on) return; on = true; ph.classList.add("gyro"); addEventListener("deviceorientation", handler, { passive: true }); kick(); };
    const ask = () => {
      doc.removeEventListener("click", ask, true);
      if (typeof DeviceOrientationEvent.requestPermission === "function") DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") start(); }).catch(() => {});
      else start();
    };
    doc.addEventListener("click", ask, true);
  }

  /* ================= ۹) قلب مخفی ================= */
  function secretHeart() {
    whenEl(".hero-card", (card) => {
      const h = el("button", "secret-heart", "♡"); h.type = "button"; h.setAttribute("aria-label", "قلب"); card.prepend(h);
      let n = 0, t0 = 0;
      h.onclick = async () => {
        const now = Date.now(); if (now - t0 > 6000) n = 0; t0 = now; n++; vibe(15); if (n < 7) return; n = 0;
        let msg = "اگر این را پیدا کردی، یعنی هنوز دنبال قلبم می‌گردی؛ بدان که همیشه پیش توست. دوستت دارم، بیشتر از آنچه فکرش را بکنی. 🤍";
        try { const r = await read("site_content", "select=value&key=eq.secret_message"); if (r[0] && r[0].value) msg = String(r[0].value); } catch (e) {}
        if (window.MagicFx) MagicFx.specialCard("🗝️", "راز پنهان", msg);
      };
    });
  }

  /* ================= ۱۰) فال عاشقانه هر ورود ================= */
  const FAL = ["امروز دلی به یادت می‌تپد؛ لبخند بزن 😊", "پیامی از طرف کسی که دوستش داری در راه است 💌", "امروز اتفاق قشنگی می‌افتد؛ فقط منتظرش باش ✨", "یک آغوش گرم در انتظار توست 🫂", "کسی امروز بی‌صدا به تو فکر می‌کند 🤍", "خوشبختی امروز در جزئیات کوچک است؛ بهشان نگاه کن 🌸", "ستاره‌ها امشب به نفع عشق شما می‌چرخند 🌟", "دلتنگی‌ات به‌زودی تبدیل به دیدار می‌شود 💞", "یک شگفتی شیرین امروز سراغت می‌آید 🎁", "هر چه می‌خواهی، همین امروز یک قدم نزدیک‌تر می‌شود 🌈", "قلبت امروز راه درست را بلد است؛ به آن اعتماد کن 💗", "کسی هست که نامت را با لبخند می‌خواند 😍", "امشب خواب شیرینی در انتظار توست 🌙", "امروز می‌توانی دل کسی را شاد کنی؛ همین الان شروعش کن 🌷", "عشق شما از فاصله‌ها بزرگ‌تر است 🛤️", "یک خبر خوب از راه می‌رسد؛ گوشی را دم دست بگذار 📱"];
  function fortune() {
    const box = el("div", "fortune"); box.append(el("b", "", "🔮 فال این ورود"), doc.createTextNode(FAL[Math.floor(Math.random() * FAL.length)]));
    box.onclick = () => box.remove(); doc.body.append(box); setTimeout(() => box.remove(), 9000);
  }

  /* ================= راه‌اندازی ================= */
  syncMusic(); gyro(); secretHeart();
  whenEl("main", () => setTimeout(() => {
    buildScratch();
  }, 900));
  whenEl(".route-arc", buildWeather);
  whenEl(".live-tick", (lt) => { buildNextMonth(lt); const sec = lt.closest(".counter") || lt.parentElement; buildThisDay(sec); });
  let fdone = false; const fireFortune = () => { if (fdone) return; fdone = true; try { if (sessionStorage.getItem("fortune-shown")) return; sessionStorage.setItem("fortune-shown", "1"); } catch (e) {} setTimeout(fortune, 1200); };
  window.addEventListener("intro-done", () => setTimeout(fireFortune, 9000)); if (!$("#gate")) setTimeout(fireFortune, 4000);
})();
