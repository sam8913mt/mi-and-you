/* ME & YOU — چت (صفحهٔ جدا) */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const coarse = matchMedia("(pointer:coarse)").matches;
  const A = window.AuthLite, base = A.base;
  const me = Session.who(), you = me === "ماجی" ? "محمد" : "ماجی";
  const vibe = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const code = () => Session.code();
  const rpc = (n, b) => A.rpc(n, Object.assign({ p_access_code: code() }, b || {}));
  const mediaUrl = (p) => `${base}/storage/v1/object/public/chat-media/${String(p).split("/").map(encodeURIComponent).join("/")}`;
  const QUICK = ["❤️", "😂", "😮", "😢", "👍", "🔥", "🥰"];
  const EMO = {
    "😊": "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤗 🤭 🤫 🤔 😏 😌 😴 🥱 😪 🤤 😎 🤓 🥳 😢 😭 🥺 😤 😡 😱 😳 🫠 🥹 😬 🙄".split(" "),
    "❤️": "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💖 💗 💓 💞 💕 💘 💝 💟 ❣️ 💌 💋 💍 🌹 🥀 🌷 🌸 💐 🎁 🎀 ✨ 🌟 ⭐ 🔥".split(" "),
    "👋": "👋 🤚 ✋ 👌 🤌 ✌️ 🤞 🫶 🤝 👏 🙌 🫂 👍 👎 🙏 💪 🤳 👀 👣 🫰 🤟 🤙 ☝️ 👆 👇 👉 👈".split(" "),
    "🌙": "🌙 ☀️ 🌤️ ⛅ 🌧️ ❄️ 🌈 ☕ 🍰 🍫 🍓 🍉 🍕 🍔 🎂 🥂 🍷 🎶 🎧 📷 🎬 ✈️ 🚗 🏡 🌍 🌊 🏖️ ⛰️ 🐱 🐶 🦋 🌻".split(" ")
  };
  const STK = ["😘😘😘", "🥰💗", "🫂", "💋", "😭💔", "🤗💞", "🌹", "😴🌙", "🥺👉👈", "🔥😍", "🎉🥳", "❤️‍🔥"];

  let msgs = new Map(), order = [], sig = "", replyTo = null, editing = null, filter = "", timers = {}, oldestLoaded = false, firstLoad = true;
  const lsg = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, lss = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const HIDDEN = new Set((() => { try { return JSON.parse(lsg("chat-hidden") || "[]"); } catch (e) { return []; } })());
  let clearBefore = +lsg("chat-clear-before") || 0; const seenAtLoad = +lsg("chat-seen") || 0; let unreadId = null, unreadSet = false, selMode = false; const selected = new Set(); let lastTap = { id: "", t: 0 };
  let status = null, unreadBelow = 0, lastMine = 0, curAudio = null, uploadTmp = new Map(), starOnly = false, ttl = 0, pinIdx = 0;
  const list = $("chList"), text = $("chText"), sendBtn = $("chSend");

  /* ---------- ورود ---------- */
  const gate = (html, link) => { const g = $("chGate"); g.hidden = false; const d = el("div"); d.append(el("div", "", html)); if (link) { const a = el("a", "", link[0]); a.href = link[1]; d.append(a); } g.append(d); };
  async function start() {
    if (!me) { gate("🌸🌙\nاول از صفحهٔ اصلی نقشت را انتخاب کن تا بتوانی چت کنی.", ["رفتن به صفحهٔ اصلی", "index.html"]); return; }
    $("chAvatar").textContent = you === "ماجی" ? "🌸" : "🌙"; $("chName").textContent = you;
    await A.ensure(); if (!code()) return;
    LiveBus.start(me);
    { const d = lsg("chat-draft"); if (d) { text.value = d; autosize(); } }
    await refresh(true); bind(); loadSettings();
    setInterval(() => { if (!document.hidden) refresh(); }, 4000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
    window.addEventListener("online", () => refresh());
  }

  /* ---------- دریافت و رندر ---------- */
  async function refresh(force) {
    if (!code()) return;
    try {
      const rows = await rpc("get_chat", { p_limit: 100 });
      const incoming = rows.map((r) => Object.assign({}, r));
      const s = JSON.stringify(incoming.map((r) => [r.id, r.body, r.reactions, r.edited_at, r.deleted_at, r.seen_at, r.pinned, r.starred, r.expires_at]));
      if (rows.length) { const oldest = new Date(rows[rows.length - 1].created_at).getTime(), have = new Set(rows.map((r) => r.id)); [...msgs.keys()].forEach((k) => { const m = msgs.get(k); if (!String(k).startsWith("t") && !have.has(k) && new Date(m.created_at).getTime() >= oldest) msgs.delete(k); }); }
      let newFromYou = 0;
      incoming.forEach((r) => { if (!msgs.has(r.id) && r.author === you && !firstLoad) newFromYou++; msgs.set(r.id, r); });
      if (rows.length < 100) oldestLoaded = true;
      if (s !== sig || force) { sig = s; render(newFromYou); }
      firstLoad = false; markSeen();
    } catch (e) { if (!msgs.size) { list.innerHTML = ""; list.append(el("div", "ch-day", "چت هنوز راه‌اندازی نشده؛ فایل SQL چت را اجرا کن")); } }
  }
  const sorted = () => [...msgs.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const fmtT = (iso) => new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  const fmtD = (iso) => { const d = new Date(iso), n = new Date(); const diff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000); return diff === 0 ? "امروز" : diff === 1 ? "دیروز" : d.toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" }); };
  const snippet = (m) => !m ? "پیام حذف‌شده" : m.deleted_at ? "🚫 پیام حذف شد" : m.kind === "voice" ? "🎤 پیام صوتی" : m.kind === "video" ? "🎥 ویدئو" : m.kind === "image" ? "🖼️ عکس" : m.body;
  const isEmojiOnly = (s) => /^(?:\p{Extended_Pictographic}|\ufe0f|\u200d|\s){1,8}$/u.test(s);
  const linkify = (host, str) => {
    str.split(/(https?:\/\/[^\s]+|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g).forEach((p) => {
      if (!p) return;
      if (/^https?:\/\//.test(p)) { const a = el("a", "", p); a.href = p; a.target = "_blank"; a.rel = "noopener"; host.append(a); }
      else if (/^\*[^*]+\*$/.test(p)) host.append(el("strong", "", p.slice(1, -1)));
      else if (/^_[^_]+_$/.test(p)) host.append(el("em", "", p.slice(1, -1)));
      else if (/^~[^~]+~$/.test(p)) host.append(el("s", "", p.slice(1, -1)));
      else if (/^`[^`]+`$/.test(p)) host.append(el("code", "ch-code", p.slice(1, -1)));
      else host.append(document.createTextNode(p));
    });
  };

  function render(newFromYou) {
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 140, prevH = list.scrollHeight, prevTop = list.scrollTop;
    list.innerHTML = "";
    if (!oldestLoaded) { const b = el("button", "ch-more", "پیام‌های قدیمی‌تر"); b.type = "button"; b.onclick = loadOlder; list.append(b); }
    let last = "", q = filter.trim().toLowerCase(), hits = 0;
    if (starOnly) list.append(el("div", "ch-flt", "⭐ فقط پیام‌های ستاره‌دار"));
    if (!unreadSet && sorted().length) { unreadSet = true; const f = sorted().find((m) => m.author === you && !m.deleted_at && new Date(m.created_at).getTime() > seenAtLoad); unreadId = seenAtLoad > 0 && f ? f.id : null; }
    sorted().forEach((m) => {
      if (m.expires_at && new Date(m.expires_at).getTime() <= Date.now()) return;
      if (HIDDEN.has(m.id)) return;
      if (clearBefore && new Date(m.created_at).getTime() <= clearBefore) return;
      if (starOnly && !((m.starred || []).includes(me))) return;
      if (q && !(m.kind === "text" && !m.deleted_at && m.body.toLowerCase().includes(q))) return;
      if (q) hits++;
      const d = fmtD(m.created_at); if (d !== last) { last = d; list.append(el("div", "ch-day", d)); }
      if (m.id === unreadId && !q && !starOnly) list.append(el("div", "ch-day ch-unread", "پیام‌های خوانده‌نشده ↓"));
      list.append(bubble(m));
    });
    uploadTmp.forEach((n) => list.append(n));
    if (q) $("chSearchCount").textContent = fa(hits) + " نتیجه";
    if (firstLoad || nearBottom || (sorted().length && sorted()[sorted().length - 1].author === me && Date.now() - lastMine < 4000)) { list.scrollTop = list.scrollHeight; unreadBelow = 0; }
    else { list.scrollTop = prevTop + (list.scrollHeight - prevH) * 0; if (newFromYou) unreadBelow += newFromYou; }
    renderPinned(); toggleDown();
    if (newFromYou && !document.hidden) vibe(25);
  }
  function toggleDown() { const far = list.scrollHeight - list.scrollTop - list.clientHeight > 260; $("chDown").hidden = !far; $("chDownN").textContent = unreadBelow ? fa(unreadBelow) : ""; $("chDownN").hidden = !unreadBelow; }

  function bubble(m) {
    const mine = m.author === me, row = el("div", "ch-row " + (mine ? "me" : "you")); row.dataset.id = m.id;
    const big = m.kind === "text" && !m.deleted_at && isEmojiOnly(m.body);
    const b = el("div", "ch-msg" + (big ? " ch-big" : "") + (m.kind === "video" && !m.deleted_at ? " rv" : "")); row.append(b);
    if (m.reply_to && !m.deleted_at) {
      const r = msgs.get(m.reply_to), qb = el("div", "ch-quote"); qb.append(el("b", "", r ? (r.author === me ? "تو" : r.author) : "پیام"), el("span", "", snippet(r)));
      qb.onclick = () => jumpTo(m.reply_to); b.append(qb);
    }
    if (m.deleted_at) { b.append(el("div", "ch-del ch-txt", "🚫 این پیام حذف شد")); }
    else if (m.kind === "text") { const t = el("div", "ch-txt"); linkify(t, m.body); b.append(t); }
    else if (m.kind === "image") { const i = el("img", "ch-img"); i.loading = "lazy"; i.alt = "عکس"; i.src = mediaUrl(m.media); i.onclick = () => lightbox(i.src); i.onload = () => { if (firstLoad) list.scrollTop = list.scrollHeight; }; b.append(i); }
    else if (m.kind === "video") b.append(roundVideo(m));
    else if (m.kind === "voice") b.append(voice(m));
    if (!big || m.deleted_at) {
      const meta = el("div", "ch-meta"); if ((m.starred || []).includes(me) && !m.deleted_at) meta.append(el("span", "ch-star", "⭐")); if (m.pinned && !m.deleted_at) meta.append(el("span", "ch-star", "📌")); if (m.expires_at && !m.deleted_at) meta.append(el("span", "ch-ttl", "⏳")); if (m.edited_at && !m.deleted_at) meta.append(el("span", "", "ویرایش‌شده")); meta.append(el("span", "", fmtT(m.created_at)));
      if (mine && !m.deleted_at) { const t = el("span", "ch-tick" + (m.seen_at ? " seen" : ""), m.seen_at ? "✓✓" : "✓"); meta.append(t); }
      if (!m.deleted_at) { const dots = el("button", "ch-dots2", "⋯"); dots.type = "button"; dots.setAttribute("aria-label", "گزینه‌های پیام"); dots.onclick = (e) => { e.stopPropagation(); if (!selMode) openSheet(m); }; meta.append(dots); }
      b.append(meta);
    }
    if (!m.deleted_at) {
      b.addEventListener("contextmenu", (e) => { e.preventDefault(); if (!selMode) openSheet(m); });
      attachLong(b, () => { if (!selMode) openSheet(m); }); attachSwipe(row, b, m);
    }
    if (selected.has(m.id)) row.classList.add("sel");
    row.addEventListener("click", (e) => {
      if (selMode) { if (e.target.closest("a")) return; e.preventDefault(); toggleSel(m.id, row); return; }
      if (m.deleted_at || e.target.closest("button,a,input,video,audio,img,.ch-quote")) return;
      const n = Date.now(); if (lastTap.id === m.id && n - lastTap.t < 320) { lastTap = { id: "", t: 0 }; react(m.id, "❤️"); vibe(18); return; } lastTap = { id: m.id, t: n };
    });
    const rx = m.reactions || {}, ks = Object.keys(rx).filter((k) => rx[k] && rx[k].length);
    if (ks.length && !m.deleted_at) {
      const r = el("div", "ch-react"); ks.forEach((k) => { const c = el("button", rx[k].includes(me) ? "mine" : ""); c.type = "button"; c.append(document.createTextNode(k)); if (rx[k].length > 1) c.append(el("small", "", fa(rx[k].length))); c.onclick = () => react(m.id, k); r.append(c); }); row.append(r);
    }
    return row;
  }
  function attachLong(node, fn) { let t = 0, sx = 0, sy = 0; node.addEventListener("touchstart", (e) => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; clearTimeout(t); t = setTimeout(() => { vibe(15); fn(); }, 480); }, { passive: true }); node.addEventListener("touchmove", (e) => { const p = e.touches[0]; if (Math.abs(p.clientX - sx) + Math.abs(p.clientY - sy) > 10) clearTimeout(t); }, { passive: true }); ["touchend", "touchcancel"].forEach((n) => node.addEventListener(n, () => clearTimeout(t))); }
  function attachSwipe(row, b, m) {
    let x0 = 0, y0 = 0, dx = 0, on = false, lock = false;
    row.addEventListener("touchstart", (e) => { if (selMode) return; const p = e.touches[0]; x0 = p.clientX; y0 = p.clientY; dx = 0; on = true; lock = false; b.style.transition = "none"; }, { passive: true });
    row.addEventListener("touchmove", (e) => { if (!on) return; const p = e.touches[0], mx = p.clientX - x0, my = p.clientY - y0; if (!lock) { if (Math.abs(my) > 14 && Math.abs(my) > Math.abs(mx)) { on = false; return; } if (Math.abs(mx) > 14) lock = true; else return; } dx = Math.max(-90, Math.min(90, mx)); b.style.transform = `translateX(${dx}px)`; }, { passive: true });
    const end = () => { if (!on && !dx) return; on = false; b.style.transition = "transform .2s"; b.style.transform = ""; if (Math.abs(dx) > 62) { vibe(15); setReply(m); } dx = 0; };
    row.addEventListener("touchend", end); row.addEventListener("touchcancel", end);
  }
  function selBar() {
    const bar = $("chSelBar"); bar.hidden = !selMode; if (!selMode) return; bar.innerHTML = "";
    bar.append(el("b", "", fa(selected.size) + " انتخاب"));
    const mk = (ic, label, fn) => { const x = el("button", "", ic); x.type = "button"; x.setAttribute("aria-label", label); x.onclick = fn; bar.append(x); };
    mk("⭐", "ستاره", async () => { for (const id of [...selected]) { const m = msgs.get(id); if (m && !(m.starred || []).includes(me)) await star(m); } exitSel(); });
    mk("📋", "کپی", () => { const t = [...selected].map((id) => msgs.get(id)).filter((m) => m && m.kind === "text").sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((m) => m.body).join("\n"); try { navigator.clipboard.writeText(t); toast("کپی شد"); } catch (e) {} exitSel(); });
    mk("🙈", "حذف فقط برای من", () => { selected.forEach((id) => HIDDEN.add(id)); lss("chat-hidden", JSON.stringify([...HIDDEN])); exitSel(); });
    mk("🗑️", "حذف برای هر دو", async () => { const mine = [...selected].filter((id) => { const m = msgs.get(id); return m && m.author === me; }); if (!mine.length) { toast("فقط پیام‌های خودت را می‌شود برای هر دو حذف کرد"); return; } if (!confirm(fa(mine.length) + " پیام برای هر دو نفر حذف شود؟")) return; for (const id of mine) { try { await rpc("delete_chat", { p_who: me, p_id: id }); } catch (e) {} } LiveBus.emit("chat", {}); exitSel(); refresh(true); });
    mk("✕", "لغو", exitSel);
  }
  function enterSel(id) { selMode = true; selected.clear(); if (id) selected.add(id); sig = ""; render(); selBar(); }
  function exitSel() { selMode = false; selected.clear(); sig = ""; render(); selBar(); }
  function toggleSel(id, row) { if (selected.has(id)) selected.delete(id); else selected.add(id); row.classList.toggle("sel", selected.has(id)); if (!selected.size) exitSel(); else selBar(); }
  function jumpTo(id) { const r = list.querySelector(`[data-id="${id}"] .ch-msg`); if (!r) return; r.scrollIntoView({ block: "center", behavior: "smooth" }); r.classList.add("hit"); setTimeout(() => r.classList.remove("hit"), 1600); }
  async function loadOlder() {
    const first = sorted()[0]; if (!first) return;
    try { const rows = await rpc("get_chat", { p_limit: 100, p_before: first.created_at }); if (rows.length < 100) oldestLoaded = true; rows.forEach((r) => msgs.set(r.id, r)); const h = list.scrollHeight; render(); list.scrollTop = list.scrollHeight - h; sig = ""; } catch (e) {}
  }

  function roundVideo(m) {
    const C = 295.31, w = el("div", "ch-round"); w.style.setProperty("--c", C);
    const v = el("video"); v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "metadata"; v.loop = false; v.muted = true; v.src = mediaUrl(m.media) + "#t=0.1";
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ring.setAttribute("viewBox", "0 0 100 100");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle"), fg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    [bg, fg].forEach((c) => { c.setAttribute("cx", "50"); c.setAttribute("cy", "50"); c.setAttribute("r", "47"); }); bg.setAttribute("class", "rb"); ring.append(bg, fg);
    const pp = el("div", "rp", "▶"), dur = el("span", "rd", fmtDur(m.dur || 0));
    v.addEventListener("timeupdate", () => { if (v.duration) { fg.style.strokeDashoffset = String(C * (1 - v.currentTime / v.duration)); dur.textContent = fmtDur(v.duration - v.currentTime); } });
    v.addEventListener("loadedmetadata", () => { if (!m.dur && isFinite(v.duration)) dur.textContent = fmtDur(v.duration); });
    const stop = () => { w.classList.remove("playing"); fg.style.strokeDashoffset = String(C); dur.textContent = fmtDur(m.dur || v.duration || 0); v.muted = true; };
    v.addEventListener("ended", stop); v.addEventListener("pause", () => { if (!v.ended) w.classList.remove("playing"); });
    w.onclick = (e) => {
      e.stopPropagation();
      if (!v.paused) { v.pause(); return; }
      if (curAudio) { curAudio.pause(); curAudio = null; }
      document.querySelectorAll(".ch-round video").forEach((o) => { if (o !== v) o.pause(); });
      if (v.ended || v.currentTime < 0.2) v.currentTime = 0; v.muted = false; v.play().then(() => w.classList.add("playing")).catch(() => { v.muted = true; v.play().then(() => w.classList.add("playing")).catch(() => {}); });
    };
    w.append(v, ring, pp, dur); return w;
  }
  /* ---------- پلیر ویس ---------- */
  function voice(m) {
    const w = el("div", "ch-voice"), pp = el("button", "pp", "▶"); pp.type = "button";
    const rg = el("input"); rg.type = "range"; rg.min = 0; rg.max = 1000; rg.value = 0; rg.step = 1;
    const tm = el("small", "", fmtDur(m.dur || 0)), sp = el("button", "sp", "1×"); sp.type = "button";
    let au = null, rate = 1;
    const ensure = () => { if (au) return au; au = new Audio(mediaUrl(m.media)); au.preload = "metadata"; au.addEventListener("timeupdate", () => { if (au.duration) { rg.value = (au.currentTime / au.duration) * 1000; tm.textContent = fmtDur(au.currentTime); } }); au.addEventListener("ended", () => { pp.textContent = "▶"; rg.value = 0; tm.textContent = fmtDur(m.dur || au.duration || 0); }); au.addEventListener("loadedmetadata", () => { if (isFinite(au.duration) && !m.dur) tm.textContent = fmtDur(au.duration); }); return au; };
    pp.onclick = () => { const a = ensure(); if (a.paused) { if (curAudio && curAudio !== a) curAudio.pause(); curAudio = a; a.playbackRate = rate; a.play().then(() => (pp.textContent = "⏸")).catch(() => {}); } else { a.pause(); pp.textContent = "▶"; } };
    rg.oninput = () => { const a = ensure(); if (a.duration) a.currentTime = (rg.value / 1000) * a.duration; };
    sp.onclick = () => { rate = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1; sp.textContent = rate + "×"; if (au) au.playbackRate = rate; };
    w.append(pp, rg, tm, sp); return w;
  }
  const fmtDur = (s) => { s = Math.max(0, Math.round(s || 0)); return fa(Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0")); };

  /* ---------- منوی پیام ---------- */
  function closeSheet() { $("chSheet").hidden = true; $("chSheetBg").hidden = true; }
  function openSheet(m) {
    const sh = $("chSheet"); sh.innerHTML = ""; sh.hidden = false; $("chSheetBg").hidden = false;
    const mineR = (m.reactions || {}); const my = Object.keys(mineR).find((k) => (mineR[k] || []).includes(me));
    const rx = el("div", "rx");
    QUICK.forEach((e) => { const b = el("button", e === my ? "on" : "", e); b.type = "button"; b.onclick = () => { closeSheet(); react(m.id, e); }; rx.append(b); });
    const more = el("button", "", "➕"); more.type = "button"; more.onclick = () => { closeSheet(); openPicker("react", m.id); }; rx.append(more); sh.append(rx);
    const act = (ic, label, fn, cls) => { const b = el("button", "act" + (cls ? " " + cls : "")); b.type = "button"; b.append(el("span", "", ic), el("span", "", label)); b.onclick = () => { closeSheet(); fn(); }; sh.append(b); };
    act("↩️", "پاسخ", () => setReply(m));
    act("📌", m.pinned ? "برداشتن سنجاق" : "سنجاق کردن", () => pin(m));
    act("⭐", (m.starred || []).includes(me) ? "برداشتن ستاره" : "ستاره‌دار کردن", () => star(m));
    if (m.kind === "text") act("📋", "کپی متن", () => { try { navigator.clipboard.writeText(m.body); } catch (e) {} });
    if (m.author === me && m.kind === "text") act("✏️", "ویرایش", () => startEdit(m));
    if (m.kind === "image" || m.kind === "video" || m.kind === "voice") act("💾", "ذخیره فایل", () => saveMedia(m));
    act("☑️", "انتخاب چند پیام", () => enterSel(m.id));
    act("ℹ️", "اطلاعات پیام", () => info(m));
    act("🙈", "حذف فقط برای من", () => { HIDDEN.add(m.id); lss("chat-hidden", JSON.stringify([...HIDDEN])); sig = ""; render(); });
    if (m.author === me) act("🗑️", "حذف برای هر دو", () => { if (confirm("این پیام برای هر دو نفر حذف شود؟")) del(m.id); }, "danger");
    $("chSheetBg").onclick = closeSheet;
  }
  async function react(id, emoji) {
    const m = msgs.get(id); if (!m) return; const rx = JSON.parse(JSON.stringify(m.reactions || {})); let had = false;
    Object.keys(rx).forEach((k) => { if (rx[k].includes(me)) { had = had || k === emoji; rx[k] = rx[k].filter((x) => x !== me); if (!rx[k].length) delete rx[k]; } });
    if (!had) rx[emoji] = (rx[emoji] || []).concat(me); m.reactions = rx; sig = ""; render(); vibe(12);
    try { await rpc("react_chat", { p_who: me, p_id: id, p_emoji: emoji }); LiveBus.emit("chat", {}); } catch (e) { refresh(true); }
  }
  async function del(id) { try { await rpc("delete_chat", { p_who: me, p_id: id }); LiveBus.emit("chat", {}); await refresh(true); } catch (e) {} }

  /* ---------- پاسخ و ویرایش ---------- */
  function setReply(m) { editing = null; replyTo = m; $("chReplyTxt").textContent = "↩️ " + (m.author === me ? "تو" : m.author) + ": " + snippet(m); $("chReplyBar").hidden = false; text.focus(); }
  function startEdit(m) { replyTo = null; editing = m; $("chReplyTxt").textContent = "✏️ ویرایش پیام"; $("chReplyBar").hidden = false; text.value = m.body; autosize(); syncBtn(); text.focus(); }
  function clearBar() { replyTo = null; editing = null; $("chReplyBar").hidden = true; }
  $("chReplyX").onclick = () => { if (editing) { text.value = ""; autosize(); syncBtn(); } clearBar(); };

  /* ---------- ارسال متن ---------- */
  function autosize() { text.style.height = "auto"; text.style.height = Math.min(130, text.scrollHeight) + "px"; }
  let lastType = 0;
  text.addEventListener("input", () => { autosize(); syncBtn(); if (!editing) lss("chat-draft", text.value); const n = Date.now(); if (n - lastType > 2000) { lastType = n; LiveBus.emit("typing", {}); } });
  text.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !coarse) { e.preventDefault(); submit(); } });
  async function submit() {
    const t = text.value.trim(); if (!t) return;
    if (editing) {
      const id = editing.id; text.value = ""; autosize(); syncBtn(); const m = msgs.get(id); clearBar();
      if (m) { m.body = t; m.edited_at = new Date().toISOString(); sig = ""; render(); }
      try { await rpc("edit_chat", { p_who: me, p_id: id, p_body: t }); LiveBus.emit("chat", {}); } catch (e) { refresh(true); } return;
    }
    text.value = ""; lss("chat-draft", ""); autosize(); syncBtn(); await sendMsg({ body: t, kind: "text" });
  }
  async function sendMsg({ body = "", kind = "text", media = null, dur = null }) {
    const reply = replyTo ? replyTo.id : null; clearBar();
    const tmp = "t" + Date.now(); const m = { id: tmp, author: me, body, kind, media, dur, reply_to: reply, reactions: {}, created_at: new Date().toISOString(), seen_at: null }; msgs.set(tmp, m); lastMine = Date.now(); sig = ""; render();
    try {
      const r = await rpc("send_chat", { p_who: me, p_body: body, p_kind: kind, p_media: media, p_reply: reply, p_dur: dur }); const row = Array.isArray(r) ? r[0] : r;
      if (!row || !row.id) throw Error("x");
      msgs.delete(tmp); LiveBus.emit("chat", {}); lastMine = Date.now(); await refresh(true);
    } catch (e) { msgs.delete(tmp); sig = ""; render(); if (kind === "text") { text.value = body; autosize(); syncBtn(); } toast("ارسال نشد؛ اتصال یا SQL چت را بررسی کن"); }
  }
  function toast(t) { const d = el("div", "ch-day", t); d.style.position = "fixed"; d.style.top = "86px"; d.style.left = "50%"; d.style.transform = "translateX(-50%)"; d.style.zIndex = 90; document.body.append(d); setTimeout(() => d.remove(), 3500); }

  /* ---------- آپلود ---------- */
  function upload(blob, ext, label) {
    return new Promise((resolve, reject) => {
      if (blob.size > 30 * 1024 * 1024) { toast("حجم فایل باید کمتر از ۳۰ مگابایت باشد"); return reject(Error("big")); }
      const d = new Date(), path = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const row = el("div", "ch-row me"), b = el("div", "ch-msg"), up = el("div", "ch-up"); const bar = el("i"), fill = el("b"); bar.append(fill); up.append(el("span", "", label + "…"), bar); b.append(up); row.append(b);
      const id = "u" + Date.now(); uploadTmp.set(id, row); sig = ""; render(); list.scrollTop = list.scrollHeight;
      const x = new XMLHttpRequest(); x.open("POST", `${base}/storage/v1/object/chat-media/${path}`);
      x.setRequestHeader("apikey", A.key); if (/^eyJ/.test(A.key)) x.setRequestHeader("Authorization", "Bearer " + A.key);
      x.setRequestHeader("Content-Type", (blob.type || "application/octet-stream").split(";")[0]); x.setRequestHeader("x-upsert", "false");
      x.upload.onprogress = (e) => { if (e.lengthComputable) fill.style.width = Math.round((e.loaded / e.total) * 100) + "%"; };
      x.onload = () => { uploadTmp.delete(id); if (x.status >= 200 && x.status < 300) { resolve(path); return; } let em = ""; try { const j = JSON.parse(x.responseText); em = j.message || j.error || ""; } catch (e) { em = String(x.responseText || "").slice(0, 80); } toast(/bucket|not found/i.test(em) ? "پوشهٔ ذخیره‌سازی چت ساخته نشده؛ فایل SQL چت (06) را در Supabase اجرا کن" : `آپلود ناموفق بود (${x.status}) ${em}`.trim()); sig = ""; render(); reject(Error("up")); };
      x.onerror = () => { uploadTmp.delete(id); sig = ""; render(); toast("آپلود ناموفق بود؛ اینترنت را بررسی کن"); reject(Error("net")); };
      x.send(blob);
    });
  }
  const extOf = (t, fb) => /webm/.test(t) ? "webm" : /mp4|m4a|aac/.test(t) ? (t.startsWith("audio") ? "m4a" : "mp4") : /ogg/.test(t) ? "ogg" : /quicktime/.test(t) ? "mov" : /3gpp/.test(t) ? "3gp" : /png/.test(t) ? "png" : /webp/.test(t) ? "webp" : /jpe?g/.test(t) ? "jpg" : fb;
  const videoDur = (file) => new Promise((res) => { const v = document.createElement("video"); v.preload = "metadata"; v.onloadedmetadata = () => { res(isFinite(v.duration) ? Math.round(v.duration) : 0); URL.revokeObjectURL(v.src); }; v.onerror = () => res(0); v.src = URL.createObjectURL(file); });
  async function shrink(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    try { const bmp = await createImageBitmap(file); const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return await new Promise((r) => c.toBlob((b) => r(b || file), "image/jpeg", 0.86)); } catch (e) { return file; }
  }
  $("fImage").onchange = async (e) => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; try { const b = await shrink(f); const path = await upload(b, extOf(b.type, "jpg"), "در حال ارسال عکس"); await sendMsg({ kind: "image", media: path }); } catch (x) {} };
  const onVideo = async (e) => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; try { const dur = await videoDur(f); const path = await upload(f, extOf(f.type, "mp4"), "در حال ارسال ویدئو"); await sendMsg({ kind: "video", media: path, dur }); } catch (x) {} };
  $("fVcam").onchange = onVideo; $("fVfile").onchange = onVideo;
  $("chAttach").onclick = (e) => { e.stopPropagation(); $("chMenu").hidden = !$("chMenu").hidden; };
  $("chMenu").querySelectorAll("button").forEach((b) => (b.onclick = () => { $("chMenu").hidden = true; ({ image: "fImage", vcam: "fVcam", vfile: "fVfile" }[b.dataset.k] && $({ image: "fImage", vcam: "fVcam", vfile: "fVfile" }[b.dataset.k]).click()); }));
  document.addEventListener("click", (e) => { if (!$("chMenu").hidden && !e.target.closest("#chMenu")) $("chMenu").hidden = true; });

  /* ---------- دکمهٔ ویس / ویدئو مسیج: لمس = عوض‌شدن حالت، نگه‌داشتن = ضبط، رها کردن = ارسال، کشیدن به بالا = لغو ---------- */
  let mode = "voice"; try { mode = localStorage.getItem("chat-rec-mode") === "video" ? "video" : "voice"; } catch (e) {}
  let holding = false, holdTimer = 0, cancelZone = false, sx = 0, sy = 0, vFacing = "user";
  const wave = $("chWave"); for (let i = 0; i < 28; i++) wave.append(el("i"));
  const MIN_HOLD = 280;
  function syncBtn() {
    const hasText = !!text.value.trim();
    sendBtn.textContent = hasText ? "➤" : mode === "video" ? "🎥" : "🎤";
    sendBtn.setAttribute("aria-label", hasText ? "ارسال" : mode === "video" ? "ویدئو مسیج (نگه دار تا ضبط شود، لمس کن تا ویس شود)" : "ویس (نگه دار تا ضبط شود، لمس کن تا ویدئو مسیج شود)");
    $("chFlip").hidden = hasText || mode !== "video";
  }
  $("chFlip").onclick = () => { vFacing = vFacing === "user" ? "environment" : "user"; toast(vFacing === "user" ? "دوربین جلو" : "دوربین پشت"); };
  function setHint(t, cancel) { $("chRecHint").textContent = t; $("chRec").classList.toggle("cancel", !!cancel); $("chVlive").classList.toggle("cancel", !!cancel); }
  const hintText = () => (cancelZone ? "رها کن تا لغو شود ✕" : "رها کن تا ارسال شود ↑ بکش بالا برای لغو");

  sendBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault(); try { sendBtn.setPointerCapture(e.pointerId); } catch (x) {}
    if (text.value.trim()) { sendBtn.dataset.send = "1"; return; }
    sendBtn.dataset.send = ""; sx = e.clientX; sy = e.clientY; cancelZone = false;
    clearTimeout(holdTimer); holdTimer = setTimeout(() => { holding = true; vibe(25); beginHold(); }, MIN_HOLD);
  });
  sendBtn.addEventListener("pointermove", (e) => {
    if (!holding) return; const dx = e.clientX - sx, dy = e.clientY - sy, c = dy < -70 || Math.abs(dx) > 110;
    if (c !== cancelZone) { cancelZone = c; setHint(hintText(), c); if (c) vibe(15); }
  });
  const release = (e) => {
    clearTimeout(holdTimer);
    if (sendBtn.dataset.send === "1") { sendBtn.dataset.send = ""; if (e.type === "pointerup") submit(); return; }
    if (holding) { holding = false; endHold(cancelZone || e.type === "pointercancel"); return; }
    if (e.type === "pointerup") { mode = mode === "video" ? "voice" : "video"; try { localStorage.setItem("chat-rec-mode", mode); } catch (x) {} syncBtn(); vibe(12); toast(mode === "video" ? "حالت ویدئو مسیج 🎥 — نگه دار تا ضبط شود" : "حالت ویس 🎤 — نگه دار تا ضبط شود"); }
  };
  sendBtn.addEventListener("pointerup", release); sendBtn.addEventListener("pointercancel", release);
  sendBtn.addEventListener("contextmenu", (e) => e.preventDefault());
  sendBtn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (text.value.trim()) submit(); else { mode = mode === "video" ? "voice" : "video"; try { localStorage.setItem("chat-rec-mode", mode); } catch (x) {} syncBtn(); } } });

  function beginHold() { if (mode === "video") vBegin(); else aBegin(); }
  function endHold(cancel) { if (mode === "video") vEnd(cancel); else aEnd(cancel); }
  const mimeFor = (list) => list.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";

  /* ----- ویس ----- */
  let aRec = null, aChunks = [], aStream = null, aT0 = 0, aTick = 0, actx = null, an = null, waveRaf = 0, aCancel = false;
  async function aBegin() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { holding = false; toast("این مرورگر ضبط صدا را پشتیبانی نمی‌کند"); return; }
    try { aStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { holding = false; toast("اجازهٔ میکروفون داده نشد"); return; }
    if (!holding) { aStream.getTracks().forEach((t) => t.stop()); aStream = null; return; }
    const type = mimeFor(["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"]);
    aChunks = []; aCancel = false; aRec = new MediaRecorder(aStream, type ? { mimeType: type } : undefined);
    aRec.ondataavailable = (e) => { if (e.data && e.data.size) aChunks.push(e.data); };
    const rec = aRec;
    rec.onstop = async () => {
      cancelAnimationFrame(waveRaf); clearInterval(aTick); aStream && aStream.getTracks().forEach((t) => t.stop()); aStream = null; try { actx && actx.close(); } catch (e) {} actx = null;
      $("chRec").hidden = true; $("chRec").classList.remove("hold", "cancel"); LiveBus.emit("recording", { on: false });
      const dur = Math.round((Date.now() - aT0) / 1000);
      if (aCancel || !aChunks.length) return; if (dur < 1) { toast("برای ضبط، دکمه را کمی بیشتر نگه دار"); return; }
      const blob = new Blob(aChunks, { type: rec.mimeType || type || "audio/webm" });
      try { const path = await upload(blob, extOf(blob.type, "webm"), "در حال ارسال ویس"); await sendMsg({ kind: "voice", media: path, dur }); } catch (e) {}
    };
    rec.start(250); aT0 = Date.now(); $("chRec").hidden = false; $("chRec").classList.add("hold"); setHint(hintText(), false); $("chRecT").textContent = fmtDur(0); LiveBus.emit("recording", { on: true });
    aTick = setInterval(() => { const sec = (Date.now() - aT0) / 1000; $("chRecT").textContent = fmtDur(sec); if (sec >= 300 && holding) { holding = false; aEnd(false); } }, 250);
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); const src = actx.createMediaStreamSource(aStream); an = actx.createAnalyser(); an.fftSize = 64; src.connect(an); const d = new Uint8Array(an.frequencyBinCount); const bars = wave.children;
      const loop = () => { an.getByteFrequencyData(d); for (let i = 0; i < bars.length; i++) bars[i].style.height = Math.max(5, (d[i % d.length] / 255) * 30) + "px"; waveRaf = requestAnimationFrame(loop); }; loop(); } catch (e) {}
  }
  function aEnd(cancel) { aCancel = !!cancel; try { aRec && aRec.state !== "inactive" && aRec.stop(); } catch (e) {} if (!aRec && aStream) { aStream.getTracks().forEach((t) => t.stop()); aStream = null; } }

  /* ----- ویدئو مسیج (پیش‌نمایش گرد) ----- */
  let vRec = null, vChunks = [], vStream = null, vT0 = 0, vTick = 0, vCancel = false;
  const vlive = $("chVlive"), vprev = $("chVprev");
  async function vBegin() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { holding = false; toast("ضبط داخل برنامه ممکن نیست؛ دوربین گوشی را باز می‌کنم"); setTimeout(() => $("fVcam").click(), 400); return; }
    try { vStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: vFacing, width: { ideal: 480 }, height: { ideal: 480 } }, audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { holding = false; toast("اجازهٔ دوربین و میکروفون داده نشد"); return; }
    if (!holding) { vStream.getTracks().forEach((t) => t.stop()); vStream = null; return; }
    vprev.srcObject = vStream; vprev.muted = true; vprev.classList.toggle("mirror", vFacing === "user"); vprev.play().catch(() => {}); vlive.hidden = false; setHint(hintText(), false); $("chVliveT").textContent = fmtDur(0);
    const type = mimeFor(["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]);
    vChunks = []; vCancel = false; const rec = new MediaRecorder(vStream, Object.assign({ videoBitsPerSecond: 800000, audioBitsPerSecond: 64000 }, type ? { mimeType: type } : {})); vRec = rec;
    rec.ondataavailable = (e) => { if (e.data && e.data.size) vChunks.push(e.data); };
    rec.onstop = async () => {
      clearInterval(vTick); vStream && vStream.getTracks().forEach((t) => t.stop()); vStream = null; vprev.srcObject = null; vlive.hidden = true; vlive.classList.remove("cancel");
      const dur = Math.round((Date.now() - vT0) / 1000);
      if (vCancel || !vChunks.length) return; if (dur < 1) { toast("برای ضبط، دکمه را کمی بیشتر نگه دار"); return; }
      const blob = new Blob(vChunks, { type: rec.mimeType || type || "video/webm" });
      try { const path = await upload(blob, extOf(blob.type, "webm"), "در حال ارسال ویدئو"); await sendMsg({ kind: "video", media: path, dur }); } catch (e) {}
    };
    rec.start(300); vT0 = Date.now(); LiveBus.emit("recording", { on: true });
    vTick = setInterval(() => { const sec = (Date.now() - vT0) / 1000; $("chVliveT").textContent = fmtDur(sec); if (sec >= 60 && holding) { holding = false; vEnd(false); } }, 250);
  }
  function vEnd(cancel) { vCancel = !!cancel; LiveBus.emit("recording", { on: false }); try { vRec && vRec.state !== "inactive" && vRec.stop(); } catch (e) {} if (!vRec && vStream) { vStream.getTracks().forEach((t) => t.stop()); vStream = null; vlive.hidden = true; } vRec = null; }

  function info(m) {
    const sh = $("chSheet"); sh.innerHTML = ""; sh.hidden = false; $("chSheetBg").hidden = false; sh.append(el("div", "tt", "اطلاعات پیام"));
    const dt = (iso) => new Date(iso).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
    const row = (k, v) => { const r = el("div", "opt"); r.append(el("span", "", k), el("span", "", v)); sh.append(r); };
    row("فرستنده", m.author === me ? "تو" : m.author); row("ارسال", dt(m.created_at));
    if (m.author === me) row("دیده شد", m.seen_at ? dt(m.seen_at) : "هنوز نه");
    if (m.edited_at) row("ویرایش", dt(m.edited_at)); if (m.expires_at) row("محو می‌شود", dt(m.expires_at));
    if (m.dur) row("مدت", fmtDur(m.dur));
  }
  async function saveMedia(m) {
    try { const r = await fetch(mediaUrl(m.media)); const b = await r.blob(); const a = el("a"); a.href = URL.createObjectURL(b); a.download = "me-and-you-" + String(m.media).split("/").pop(); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
    catch (e) { window.open(mediaUrl(m.media), "_blank"); }
  }
  function exportChat() {
    const lines = sorted().filter((m) => !m.deleted_at && !HIDDEN.has(m.id)).map((m) => `[${new Date(m.created_at).toLocaleString("fa-IR")}] ${m.author}: ${m.kind === "text" ? m.body : m.kind === "voice" ? "[ویس]" : m.kind === "video" ? "[ویدئو]" : "[عکس]"}`);
    const b = new Blob(["\ufeff" + lines.join("\n")], { type: "text/plain;charset=utf-8" }); const a = el("a"); a.href = URL.createObjectURL(b); a.download = "me-and-you-chat.txt"; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function gallery() {
    const items = sorted().filter((m) => (m.kind === "image" || m.kind === "video") && !m.deleted_at && !HIDDEN.has(m.id));
    const o = el("div", "ch-gal"); const h = el("div", "ch-gal-h"); const x = el("button", "", "✕"); x.type = "button"; x.onclick = () => o.remove(); h.append(el("b", "", "رسانه‌ها (" + fa(items.length) + ")"), x); o.append(h);
    const g = el("div", "ch-gal-g"); if (!items.length) g.append(el("p", "", "هنوز عکس یا ویدئویی فرستاده نشده."));
    items.reverse().forEach((m) => { const t = el("button", "ch-gal-i"); t.type = "button"; if (m.kind === "image") { const i = el("img"); i.loading = "lazy"; i.src = mediaUrl(m.media); t.append(i); t.onclick = () => lightbox(i.src); } else { const v = el("video"); v.preload = "metadata"; v.muted = true; v.src = mediaUrl(m.media) + "#t=0.1"; t.append(v, el("span", "", "▶")); t.onclick = () => lightbox(mediaUrl(m.media), true); } g.append(t); });
    o.append(g); document.body.append(o);
  }

  /* ---------- سنجاق، ستاره، پیام محوشونده، پس‌زمینه ---------- */
  async function pin(m) { m.pinned = !m.pinned; sig = ""; render(); try { await rpc("pin_chat", { p_who: me, p_id: m.id, p_pin: m.pinned }); LiveBus.emit("chat", {}); } catch (e) { refresh(true); } }
  async function star(m) { const a = m.starred || []; m.starred = a.includes(me) ? a.filter((x) => x !== me) : a.concat(me); sig = ""; render(); try { await rpc("star_chat", { p_who: me, p_id: m.id }); } catch (e) { refresh(true); } }
  const pinnedList = () => sorted().filter((m) => m.pinned && !m.deleted_at && !(m.expires_at && new Date(m.expires_at).getTime() <= Date.now()));
  function renderPinned() {
    const b = $("chPinned"), ps = pinnedList(); if (!ps.length) { b.hidden = true; return; }
    pinIdx = pinIdx % ps.length; const m = ps[ps.length - 1 - pinIdx]; b.hidden = false; b.innerHTML = "";
    b.append(el("span", "", "📌"), el("span", "", snippet(m))); if (ps.length > 1) b.append(el("small", "", fa(pinIdx + 1) + "/" + fa(ps.length)));
    b.onclick = () => { jumpTo(m.id); pinIdx++; renderPinned(); };
  }
  const TTLS = [[0, "خاموش"], [3600, "۱ ساعت"], [86400, "۲۴ ساعت"], [604800, "۷ روز"]];
  const BGS = [["default", "#fff7f2", "پیش‌فرض"], ["rose", "#ffc9d9", "صورتی"], ["hearts", "#fff0f5", "قلب‌ها"], ["sun", "#ffd9c2", "غروب"], ["mint", "#c9f3df", "نعنایی"], ["sky", "#cfe0ff", "آسمانی"], ["night", "#2d1740", "شب"], ["plain", "#ffffff", "ساده"]];
  const setBg = (k) => { $("chatApp").dataset.bg = k; try { localStorage.setItem("chat-bg", k); } catch (e) {} };
  try { setBg(localStorage.getItem("chat-bg") || "default"); } catch (e) {}
  function openMenu() {
    const sh = $("chSheet"); sh.innerHTML = ""; sh.hidden = false; $("chSheetBg").hidden = false; $("chSheetBg").onclick = closeSheet;
    const act = (ic, label, fn) => { const b = el("button", "act"); b.type = "button"; b.append(el("span", "", ic), el("span", "", label)); b.onclick = () => { closeSheet(); fn(); }; sh.append(b); };
    act("⭐", starOnly ? "نمایش همهٔ پیام‌ها" : "فقط پیام‌های ستاره‌دار", () => { starOnly = !starOnly; sig = ""; render(); });
    act("⏳", "پیام‌های محوشونده" + (ttl ? " (" + (TTLS.find((t) => t[0] === ttl) || [0, ""])[1] + ")" : ""), openTtl);
    act("🎨", "پس‌زمینهٔ چت", openBg);
    act("🖼️", "عکس‌ها و ویدئوها", gallery);
    act("📌", "پیام‌های سنجاق‌شده", () => { const ps = pinnedList(); if (!ps.length) { toast("هنوز پیامی سنجاق نشده"); return; } pinIdx = 0; renderPinned(); jumpTo(ps[ps.length - 1].id); });
    act("☑️", "انتخاب چند پیام", () => enterSel(null));
    act("📤", "دریافت نسخهٔ متنی چت", exportChat);
    act("🧹", "پاک کردن چت فقط برای من", () => { if (confirm("همهٔ پیام‌های فعلی فقط روی همین دستگاه پنهان شوند؟ (برای او حذف نمی‌شود)")) { clearBefore = Date.now(); lss("chat-clear-before", String(clearBefore)); sig = ""; render(); } });
  }
  function openTtl() {
    const sh = $("chSheet"); sh.innerHTML = ""; sh.hidden = false; $("chSheetBg").hidden = false;
    sh.append(el("div", "tt", "پیام‌های تازه بعد از این مدت برای هر دو محو می‌شوند"));
    TTLS.forEach(([s, l]) => { const b = el("button", "opt" + (s === ttl ? " on" : "")); b.type = "button"; b.append(el("span", "", l), el("span", "", s === ttl ? "✓" : "")); b.onclick = async () => { closeSheet(); try { await rpc("set_chat_ttl", { p_who: me, p_seconds: s }); ttl = s; LiveBus.emit("chat", {}); toast(s ? "پیام‌های تازه بعد از " + l + " محو می‌شوند ⏳" : "پیام‌های محوشونده خاموش شد"); setTtlNote(); } catch (e) { toast("تنظیم نشد؛ فایل SQL چت را اجرا کن"); } }; sh.append(b); });
  }
  function openBg() {
    const sh = $("chSheet"); sh.innerHTML = ""; sh.hidden = false; $("chSheetBg").hidden = false;
    sh.append(el("div", "tt", "پس‌زمینهٔ چت (فقط روی همین دستگاه)"));
    const g = el("div", "ch-bgs"); const curBg = $("chatApp").dataset.bg || "default";
    BGS.forEach(([k, c, l]) => { const b = el("button", k === curBg ? "on" : ""); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", l); b.textContent = k === curBg ? "✓" : ""; b.onclick = () => { setBg(k); closeSheet(); }; g.append(b); });
    sh.append(g);
  }
  function setTtlNote() { const s = $("chStatus"); if (ttl) s.dataset.note = " · ⏳ " + (TTLS.find((t) => t[0] === ttl) || [0, ""])[1]; else delete s.dataset.note; if (status && s._s !== undefined) status(s._s, s._on); }
  $("chMenuBtn").onclick = openMenu;
  async function loadSettings() { try { const r = await rpc("get_chat_settings"); if (r && r[0]) { ttl = r[0].ttl_seconds || 0; setTtlNote(); } } catch (e) {} }

  /* ---------- ایموجی ---------- */
  let pickMode = "text", pickTarget = null;
  function openPicker(mode, target) {
    const p = $("chPick"); pickMode = mode || "text"; pickTarget = target || null; p.hidden = false; p.innerHTML = "";
    const tabs = el("div", "tabs"), grid = el("div", "grid"); const keys = Object.keys(EMO).concat(pickMode === "text" ? ["🎭"] : []);
    const show = (k) => { tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === k)); grid.innerHTML = ""; grid.classList.toggle("stk", k === "🎭"); (k === "🎭" ? STK : EMO[k]).forEach((e) => { const b = el("button", "", e); b.type = "button"; b.onclick = () => pick(e, k === "🎭"); grid.append(b); }); };
    keys.forEach((k) => { const b = el("button", "", k); b.type = "button"; b.dataset.k = k; b.onclick = () => show(k); tabs.append(b); });
    p.append(tabs, grid); show(keys[0]);
    if (pickMode === "react") { const c = el("button", "ch-more", "بستن"); c.type = "button"; c.onclick = () => (p.hidden = true); p.append(c); }
  }
  function pick(e, sticker) {
    if (pickMode === "react") { $("chPick").hidden = true; react(pickTarget, e); return; }
    if (sticker) { $("chPick").hidden = true; sendMsg({ body: e, kind: "text" }); return; }
    const s = text.selectionStart || text.value.length, en = text.selectionEnd || text.value.length; text.value = text.value.slice(0, s) + e + text.value.slice(en); text.selectionStart = text.selectionEnd = s + e.length; autosize(); syncBtn();
  }
  $("chEmoji").onclick = () => { const p = $("chPick"); if (!p.hidden && pickMode === "text") { p.hidden = true; } else openPicker("text"); };

  /* ---------- جست‌وجو، اسکرول، نمایشگر عکس ---------- */
  $("chSearchBtn").onclick = () => { const s = $("chSearch"); s.hidden = !s.hidden; if (!s.hidden) $("chSearchInp").focus(); else { filter = ""; $("chSearchInp").value = ""; $("chSearchCount").textContent = ""; sig = ""; render(); } };
  $("chSearchInp").addEventListener("input", (e) => { filter = e.target.value; sig = ""; render(); });
  list.addEventListener("scroll", () => { if (list.scrollHeight - list.scrollTop - list.clientHeight < 80) unreadBelow = 0; toggleDown(); }, { passive: true });
  $("chDown").onclick = () => { list.scrollTo({ top: list.scrollHeight, behavior: "smooth" }); unreadBelow = 0; };
  function lightbox(src, isVideo) { const l = $("chLight"); l.innerHTML = ""; const i = isVideo ? el("video") : el("img"); if (isVideo) { i.controls = true; i.autoplay = true; i.playsInline = true; } i.src = src; const x = el("button", "", "✕"); x.type = "button"; x.onclick = () => { l.hidden = true; l.innerHTML = ""; }; l.append(i, x); l.hidden = false; l.onclick = (e) => { if (e.target === l) { l.hidden = true; l.innerHTML = ""; } }; }

  /* ---------- دیده‌شدن و رویدادهای زنده ---------- */
  let seenBusy = false;
  async function markSeen() {
    if (document.hidden || seenBusy) return; const un = [...msgs.values()].some((m) => m.author === you && !m.seen_at && !m.deleted_at && !String(m.id).startsWith("t"));
    try { localStorage.setItem("chat-seen", String(Date.now())); } catch (e) {}
    if (!un) return; seenBusy = true; try { await rpc("seen_chat", { p_who: me }); LiveBus.emit("chat", {}); } catch (e) {} seenBusy = false;
  }
  function bind() {
    status = (s, on) => { const st = $("chStatus"); st.textContent = s + (st.dataset.note || ""); st.classList.toggle("on", !!on); st._s = s; st._on = !!on; };
    const idle = () => (LiveBus.partnerOn() ? status("آنلاین", true) : status("آفلاین"));
    idle();
    window.addEventListener("live:presence", idle);
    window.addEventListener("live:chat", () => refresh());
    window.addEventListener("live:typing", () => { $("chTyping").textContent = `${you} در حال نوشتن…`; clearTimeout(timers.t); timers.t = setTimeout(() => ($("chTyping").textContent = ""), 3000); });
    window.addEventListener("live:recording", (e) => { $("chTyping").textContent = e.detail && e.detail.on ? `${you} در حال ضبط ویس…` : ""; });
    if (window.visualViewport) { const fit = () => { const v = visualViewport; $("chatApp").style.height = v.height + "px"; $("chatApp").style.top = v.offsetTop + "px"; window.scrollTo(0, 0); if (document.activeElement === text) list.scrollTop = list.scrollHeight; }; visualViewport.addEventListener("resize", fit); visualViewport.addEventListener("scroll", fit); }
    syncBtn();
  }
  start();
})();
