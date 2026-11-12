/* ME & YOU — فضای مشترک: بوسه، بوم، ضربان هماهنگ، دوز */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const rand = (a, b) => a + Math.random() * (b - a);
  const me = Session.who(), you = me === "ماجی" ? "محمد" : "ماجی";
  const vibe = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const emit = (e, p) => { try { LiveBus.emit(e, p); } catch (x) {} };
  const on = () => { try { return LiveBus.partnerOn(); } catch (e) { return false; } };
  const main = $("tgMain");
  if (!me) { const g = $("tgGate"); g.hidden = false; const d = el("div"); d.append(el("div", "", "🌸🌙\nاول از صفحهٔ اصلی نقشت را انتخاب کن."), (() => { const a = el("a", "", "رفتن به صفحهٔ اصلی"); a.href = "index.html"; return a; })()); g.append(d); return; }

  const card = (title, sub) => { const c = el("section", "tg-card"); c.append(el("h2", "", title)); if (sub) c.append(el("p", "sub", sub)); main.append(c); return c; };
  const burst = (x, y, n = 14) => { for (let i = 0; i < n; i++) { const h = el("div", "float-h", ["💗", "💖", "💕", "💋", "✨"][i % 5]); h.style.left = (x + rand(-40, 40)) + "px"; h.style.top = y + "px"; h.style.setProperty("--dx", rand(-90, 90) + "px"); h.style.setProperty("--dy", rand(120, 280) + "px"); h.style.animationDelay = (i * 40) + "ms"; document.body.append(h); setTimeout(() => h.remove(), 2200); } };
  const center = (n) => burst(innerWidth / 2, innerHeight * .6, n);
  const imp = (e, k, v) => e.style.setProperty(k, v, "important");

  /* ===== حضور و بوسه ===== */
  const kc = card("💋 بوسه و لمس زنده", "وقتی هر دو اینجایید، لمس صفحه روی گوشی او هم قلب می‌شود.");
  const wrap = el("div", "kiss"), kb = el("button", "", "💋"); kb.id = "kissBig"; kb.type = "button"; kb.setAttribute("aria-label", "ارسال بوسه");
  const kn = el("div", "note", ""); wrap.append(kb, kn); kc.append(wrap);
  kb.onclick = () => { center(18); vibe([40, 70, 40]); emit("kiss", {}); kn.textContent = on() ? `بوسه برای ${you} رفت 💋` : `${you} الان آنلاین نیست`; };
  window.addEventListener("live:kiss", () => { center(34); vibe([60, 110, 60, 420, 60, 110, 60]); kn.textContent = `${you} برایت بوسه فرستاد 💋`; });
  window.addEventListener("live:touch", (e) => { const d = e.detail || {}; const h = el("div", "float-h", "💗"); h.style.left = (d.x * innerWidth) + "px"; h.style.top = (d.y * innerHeight) + "px"; document.body.append(h); setTimeout(() => h.remove(), 1900); });
  let lt = 0; document.addEventListener("pointerdown", (e) => { if (!on() || e.target.closest("button,canvas,a")) return; const n = Date.now(); if (n - lt < 500) return; lt = n; emit("touch", { x: +(e.clientX / innerWidth).toFixed(3), y: +(e.clientY / innerHeight).toFixed(3) }); }, { passive: true });
  const setStatus = () => { const s = $("tgStatus"), o = on(); s.textContent = o ? `${you} هم اینجاست 🤍` : "آفلاین"; s.classList.toggle("on", o); kb.classList.toggle("online", o); };
  window.addEventListener("live:presence", () => { setStatus(); if (on()) vibe([60, 110, 60]); });

  /* ===== بوم مشترک ===== */
  (() => {
    const c = card("🎨 بوم مشترک", "هر چه بکشی، همان لحظه روی گوشی او هم می‌افتد.");
    const box = el("div", "canvas-box"), cv = el("canvas"); cv.id = "drawCv"; box.append(cv); c.append(box);
    const tools = el("div", "tools"); c.append(tools); c.append(el("div", "note", "برای نقاشی روی «شروع نقاشی» بزن (تا اسکرول صفحه قفل نشود)."));
    const ctx = cv.getContext("2d"); let W = 0, H = 0, drawing = false, mode = false, color = "#e0245e", last = null, buf = [], timer = 0, size = 4, rl = null;
    const resize = () => { const snap = cv.width ? ctx.getImageData(0, 0, cv.width, cv.height) : null; const d = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round"; if (snap) try { ctx.putImageData(snap, 0, 0); } catch (e) {} };
    resize(); addEventListener("resize", resize);
    const seg = (a, b, col, s) => { ctx.strokeStyle = col; ctx.lineWidth = s; ctx.beginPath(); ctx.moveTo(a[0] * W, a[1] * H); ctx.lineTo(b[0] * W, b[1] * H); ctx.stroke(); };
    const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    const flush = () => { timer = 0; if (buf.length) { emit("draw", { c: color, s: size, p: buf }); buf = []; } };
    cv.addEventListener("pointerdown", (e) => { if (!mode) return; drawing = true; last = pt(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); buf.push([last[0], last[1], 1]); seg(last, last, color, size); e.preventDefault(); });
    cv.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pt(e); seg(last, p, color, size); last = p; buf.push([p[0], p[1], 0]); if (!timer) timer = setTimeout(flush, 70); e.preventDefault(); });
    const up = () => { drawing = false; last = null; flush(); }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    window.addEventListener("live:draw", (ev) => { const d = ev.detail || {}; (d.p || []).forEach((q) => { if (q[2] || !rl) rl = [q[0], q[1]]; seg(rl, [q[0], q[1]], d.c || "#783B55", d.s || 4); rl = [q[0], q[1]]; }); rl = null; });
    window.addEventListener("live:drawclear", () => ctx.clearRect(0, 0, W, H));
    const bt = el("button", "", "✏️ شروع نقاشی"); bt.type = "button";
    bt.onclick = () => { mode = !mode; cv.classList.toggle("on", mode); bt.classList.toggle("on", mode); bt.textContent = mode ? "✋ پایان نقاشی" : "✏️ شروع نقاشی"; }; tools.append(bt);
    ["#e0245e", "#ff8a1f", "#f2c500", "#2fb36b", "#2e7bff", "#8a3ffc", "#3b2430"].forEach((col, i) => {
      const b = el("button", "sw" + (i === 0 ? " sel" : "")); b.type = "button"; b.setAttribute("aria-label", "رنگ"); imp(b, "background-color", col); imp(b, "background-image", "none"); imp(b, "background", col);
      b.onclick = () => { color = col; tools.querySelectorAll(".sw").forEach((x) => x.classList.toggle("sel", x === b)); }; tools.append(b);
    });
    const cl = el("button", "", "🧽 پاک کردن"); cl.type = "button"; cl.onclick = () => { ctx.clearRect(0, 0, W, H); emit("drawclear", {}); }; tools.append(cl);
    const sv = el("button", "", "💾 ذخیره"); sv.type = "button";
    sv.onclick = () => { const o = el("canvas"); o.width = cv.width; o.height = cv.height; const x = o.getContext("2d"); x.fillStyle = "#fff7f2"; x.fillRect(0, 0, o.width, o.height); x.drawImage(cv, 0, 0); o.toBlob((b) => { if (!b) return; const a = el("a"); a.href = URL.createObjectURL(b); a.download = "me-and-you-draw.png"; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }); }; tools.append(sv);
  })();

  /* ===== ضربان مشترک ===== */
  (() => {
    const c = card("💓 ضربان مشترک", "هر دو انگشت را روی قلب نگه دارید؛ ضربان‌ها یکی می‌شود.");
    const st = el("div", "pulse"), btn = el("button", "", "💗"); btn.id = "pulseBtn"; btn.type = "button"; btn.setAttribute("aria-label", "قلب را نگه دار"); st.append(btn);
    const msg = el("div", "pmsg"); c.append(st, msg);
    let m = false, h = false, iv = 0;
    const paint = () => { btn.classList.toggle("me", m && !h); btn.classList.toggle("both", m && h); msg.textContent = m && h ? "قلب‌هایمان یکی شد 💞" : h ? `${you} دستش روی قلب است؛ تو هم بگذار 🤍` : m ? (on() ? `منتظر ${you}…` : `${you} الان آنلاین نیست`) : on() ? `${you} هم اینجاست؛ قلب را نگه دار` : ""; clearInterval(iv); iv = 0; if (m && h) { vibe([60, 110, 60, 420]); iv = setInterval(() => vibe([60, 110, 60, 420]), 1200); } };
    const set = (v) => { if (m === v) return; m = v; emit("hold", { on: v }); paint(); };
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); set(true); }); ["pointerup", "pointercancel", "pointerleave"].forEach((t) => btn.addEventListener(t, () => set(false)));
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("live:hold", (e) => { h = !!(e.detail && e.detail.on); paint(); });
    window.addEventListener("live:presence", () => { if (!on()) h = false; paint(); });
  })();

  /* ===== دوز ===== */
  (() => {
    const c = card("🎮 بازی دونفره", "دوز عاشقانه: ماجی 🌸 و محمد 🌙. اگر او آنلاین باشد زنده بازی می‌کنید؛ وگرنه با کامپیوتر.");
    const st = el("div", "g-status", "برای شروع «بازی جدید» را بزن"), bd = el("div", "g-board"), sc = el("div", "g-score"), tools = el("div", "tools"), nb = el("button", "", "🎲 بازی جدید"); nb.type = "button"; tools.append(nb); c.append(st, bd, sc, tools);
    const MARK = { "ماجی": "🌸", "محمد": "🌙" }, L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let b = Array(9).fill(""), turn = "", live = false, over = true, wl = [];
    const score = () => { try { return JSON.parse(localStorage.getItem("ttt-score") || "{}"); } catch (e) { return {}; } };
    const showScore = () => { const s = score(); sc.textContent = `بازی‌های زنده — ماجی ${fa(s["ماجی"] || 0)} · محمد ${fa(s["محمد"] || 0)} · مساوی ${fa(s.d || 0)}`; };
    const cells = Array.from({ length: 9 }, (_, i) => { const x = el("button", "g-cell"); x.type = "button"; x.onclick = () => tap(i); bd.append(x); return x; });
    const paint = () => { cells.forEach((x, i) => { x.textContent = b[i] ? MARK[b[i]] : ""; x.classList.toggle("win", wl.includes(i)); }); if (!over) st.textContent = turn === me ? "نوبت توست 💗" : live ? `منتظر ${turn}…` : "کامپیوتر دل فکر می‌کند…"; };
    const check = () => { for (const l of L) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return l; return b.every(Boolean) ? "draw" : null; };
    const finish = (r) => { over = true; if (r === "draw") { st.textContent = "مساوی شد 🤝"; wl = []; } else { wl = r; const w = b[r[0]]; st.textContent = w === me ? "بردی! 🎉" : `${w} برد 🏆`; if (w === me) { vibe([40, 60, 40]); center(22); } } if (live) { const s = score(), k = r === "draw" ? "d" : b[r[0]]; s[k] = (s[k] || 0) + 1; localStorage.setItem("ttt-score", JSON.stringify(s)); showScore(); } paint(); };
    const play = (i, by) => { if (over || b[i] || turn !== by) return false; b[i] = by; const r = check(); if (r) finish(r); else { turn = by === "ماجی" ? "محمد" : "ماجی"; paint(); } return true; };
    const ai = () => { if (over || live || turn !== you) return; const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); const find = (mk) => { for (const l of L) { const v = l.map((i) => b[i]); if (v.filter((x) => x === mk).length === 2 && v.includes("")) return l[v.indexOf("")]; } return -1; }; let m = find(you); if (m < 0) m = find(me); if (m < 0 && !b[4]) m = 4; if (m < 0) m = free[Math.floor(Math.random() * free.length)]; setTimeout(() => play(m, you), 600); };
    function tap(i) { if (over || turn !== me) return; if (play(i, me)) { if (live) emit("ttt", { t: "move", i, by: me }); else ai(); } }
    function start(first, lv) { b = Array(9).fill(""); wl = []; over = false; live = lv; turn = first; paint(); if (!live) ai(); }
    nb.onclick = () => { const lv = on(); start(me, lv); if (lv) emit("ttt", { t: "new", first: me }); };
    window.addEventListener("live:ttt", (e) => { const d = e.detail || {}; if (d.t === "new") start(d.first, true); else if (d.t === "move" && live && !over) play(d.i, d.by); });
    showScore(); paint();
  })();

  LiveBus.start(me); setStatus();
})();
