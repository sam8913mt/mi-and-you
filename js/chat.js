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
  let unreadBelow = 0, lastMine = 0, curAudio = null, uploadTmp = new Map();
  const list = $("chList"), text = $("chText"), sendBtn = $("chSend");

  /* ---------- ورود ---------- */
  const gate = (html, link) => { const g = $("chGate"); g.hidden = false; const d = el("div"); d.append(el("div", "", html)); if (link) { const a = el("a", "", link[0]); a.href = link[1]; d.append(a); } g.append(d); };
  async function start() {
    if (!me) { gate("🌸🌙\nاول از صفحهٔ اصلی نقشت را انتخاب کن تا بتوانی چت کنی.", ["رفتن به صفحهٔ اصلی", "index.html"]); return; }
    $("chAvatar").textContent = you === "ماجی" ? "🌸" : "🌙"; $("chName").textContent = you;
    await A.ensure(); if (!code()) return;
    LiveBus.start(me);
    await refresh(true); bind();
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
      const s = JSON.stringify(incoming.map((r) => [r.id, r.body, r.reactions, r.edited_at, r.deleted_at, r.seen_at]));
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
  const linkify = (host, s) => { s.split(/(https?:\/\/[^\s]+)/g).forEach((p) => { if (/^https?:\/\//.test(p)) { const a = el("a", "", p); a.href = p; a.target = "_blank"; a.rel = "noopener"; host.append(a); } else host.append(document.createTextNode(p)); }); };

  function render(newFromYou) {
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 140, prevH = list.scrollHeight, prevTop = list.scrollTop;
    list.innerHTML = "";
    if (!oldestLoaded) { const b = el("button", "ch-more", "پیام‌های قدیمی‌تر"); b.type = "button"; b.onclick = loadOlder; list.append(b); }
    let last = "", q = filter.trim().toLowerCase(), hits = 0;
    sorted().forEach((m) => {
      if (q && !(m.kind === "text" && !m.deleted_at && m.body.toLowerCase().includes(q))) return;
      if (q) hits++;
      const d = fmtD(m.created_at); if (d !== last) { last = d; list.append(el("div", "ch-day", d)); }
      list.append(bubble(m));
    });
    uploadTmp.forEach((n) => list.append(n));
    if (q) $("chSearchCount").textContent = fa(hits) + " نتیجه";
    if (firstLoad || nearBottom || (sorted().length && sorted()[sorted().length - 1].author === me && Date.now() - lastMine < 4000)) { list.scrollTop = list.scrollHeight; unreadBelow = 0; }
    else { list.scrollTop = prevTop + (list.scrollHeight - prevH) * 0; if (newFromYou) unreadBelow += newFromYou; }
    toggleDown();
    if (newFromYou && !document.hidden) vibe(25);
  }
  function toggleDown() { const far = list.scrollHeight - list.scrollTop - list.clientHeight > 260; $("chDown").hidden = !far; $("chDownN").textContent = unreadBelow ? fa(unreadBelow) : ""; $("chDownN").hidden = !unreadBelow; }

  function bubble(m) {
    const mine = m.author === me, row = el("div", "ch-row " + (mine ? "me" : "you")); row.dataset.id = m.id;
    const big = m.kind === "text" && !m.deleted_at && isEmojiOnly(m.body);
    const b = el("div", "ch-msg" + (big ? " ch-big" : "")); row.append(b);
    if (m.reply_to && !m.deleted_at) {
      const r = msgs.get(m.reply_to), qb = el("div", "ch-quote"); qb.append(el("b", "", r ? (r.author === me ? "تو" : r.author) : "پیام"), el("span", "", snippet(r)));
      qb.onclick = () => jumpTo(m.reply_to); b.append(qb);
    }
    if (m.deleted_at) { b.append(el("div", "ch-del ch-txt", "🚫 این پیام حذف شد")); }
    else if (m.kind === "text") { const t = el("div", "ch-txt"); linkify(t, m.body); b.append(t); }
    else if (m.kind === "image") { const i = el("img", "ch-img"); i.loading = "lazy"; i.alt = "عکس"; i.src = mediaUrl(m.media); i.onclick = () => lightbox(i.src); i.onload = () => { if (firstLoad) list.scrollTop = list.scrollHeight; }; b.append(i); }
    else if (m.kind === "video") { const v = el("video", "ch-vid"); v.controls = true; v.playsInline = true; v.preload = "metadata"; v.src = mediaUrl(m.media) + "#t=0.1"; b.append(v); }
    else if (m.kind === "voice") b.append(voice(m));
    if (!big || m.deleted_at) {
      const meta = el("div", "ch-meta"); if (m.edited_at && !m.deleted_at) meta.append(el("span", "", "ویرایش‌شده")); meta.append(el("span", "", fmtT(m.created_at)));
      if (mine && !m.deleted_at) { const t = el("span", "ch-tick" + (m.seen_at ? " seen" : ""), m.seen_at ? "✓✓" : "✓"); meta.append(t); }
      b.append(meta);
    }
    if (!m.deleted_at) { const dots = el("button", "ch-dots", "⋯"); dots.type = "button"; dots.setAttribute("aria-label", "گزینه‌ها"); dots.onclick = (e) => { e.stopPropagation(); openSheet(m); }; b.append(dots); b.addEventListener("contextmenu", (e) => { e.preventDefault(); openSheet(m); }); attachLong(b, () => openSheet(m)); }
    const rx = m.reactions || {}, ks = Object.keys(rx).filter((k) => rx[k] && rx[k].length);
    if (ks.length && !m.deleted_at) {
      const r = el("div", "ch-react"); ks.forEach((k) => { const c = el("button", rx[k].includes(me) ? "mine" : ""); c.type = "button"; c.append(document.createTextNode(k)); if (rx[k].length > 1) c.append(el("small", "", fa(rx[k].length))); c.onclick = () => react(m.id, k); r.append(c); }); row.append(r);
    }
    return row;
  }
  function attachLong(node, fn) { let t = 0, sx = 0, sy = 0; node.addEventListener("touchstart", (e) => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; clearTimeout(t); t = setTimeout(() => { vibe(15); fn(); }, 480); }, { passive: true }); node.addEventListener("touchmove", (e) => { const p = e.touches[0]; if (Math.abs(p.clientX - sx) + Math.abs(p.clientY - sy) > 10) clearTimeout(t); }, { passive: true }); ["touchend", "touchcancel"].forEach((n) => node.addEventListener(n, () => clearTimeout(t))); }
  function jumpTo(id) { const r = list.querySelector(`[data-id="${id}"] .ch-msg`); if (!r) return; r.scrollIntoView({ block: "center", behavior: "smooth" }); r.classList.add("hit"); setTimeout(() => r.classList.remove("hit"), 1600); }
  async function loadOlder() {
    const first = sorted()[0]; if (!first) return;
    try { const rows = await rpc("get_chat", { p_limit: 100, p_before: first.created_at }); if (rows.length < 100) oldestLoaded = true; rows.forEach((r) => msgs.set(r.id, r)); const h = list.scrollHeight; render(); list.scrollTop = list.scrollHeight - h; sig = ""; } catch (e) {}
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
    if (m.kind === "text") act("📋", "کپی متن", () => { try { navigator.clipboard.writeText(m.body); } catch (e) {} });
    if (m.author === me && m.kind === "text") act("✏️", "ویرایش", () => startEdit(m));
    if (m.author === me) act("🗑️", "حذف پیام", () => { if (confirm("این پیام برای هر دو نفر حذف شود؟")) del(m.id); }, "danger");
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
  function syncBtn() { sendBtn.textContent = text.value.trim() ? "➤" : "🎤"; sendBtn.setAttribute("aria-label", text.value.trim() ? "ارسال" : "ضبط ویس"); }
  function autosize() { text.style.height = "auto"; text.style.height = Math.min(130, text.scrollHeight) + "px"; }
  let lastType = 0;
  text.addEventListener("input", () => { autosize(); syncBtn(); const n = Date.now(); if (n - lastType > 2000) { lastType = n; LiveBus.emit("typing", {}); } });
  text.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !coarse) { e.preventDefault(); submit(); } });
  sendBtn.onclick = () => { if (text.value.trim()) submit(); else startRec(); };
  async function submit() {
    const t = text.value.trim(); if (!t) return;
    if (editing) {
      const id = editing.id; text.value = ""; autosize(); syncBtn(); const m = msgs.get(id); clearBar();
      if (m) { m.body = t; m.edited_at = new Date().toISOString(); sig = ""; render(); }
      try { await rpc("edit_chat", { p_who: me, p_id: id, p_body: t }); LiveBus.emit("chat", {}); } catch (e) { refresh(true); } return;
    }
    text.value = ""; autosize(); syncBtn(); await sendMsg({ body: t, kind: "text" });
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
      x.onload = () => { uploadTmp.delete(id); x.status >= 200 && x.status < 300 ? resolve(path) : (toast("آپلود ناموفق بود"), sig = "", render(), reject(Error("up"))); };
      x.onerror = () => { uploadTmp.delete(id); sig = ""; render(); toast("آپلود ناموفق بود"); reject(Error("net")); };
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

  /* ---------- ضبط ویس ---------- */
  let rec = null, chunks = [], recStream = null, recT0 = 0, recTick = 0, actx = null, an = null, waveRaf = 0, recCancel = false;
  const wave = $("chWave"); for (let i = 0; i < 28; i++) wave.append(el("i"));
  async function startRec() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("این مرورگر ضبط صدا را پشتیبانی نمی‌کند"); return; }
    try { recStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { toast("اجازهٔ میکروفون داده نشد"); return; }
    const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
    chunks = []; recCancel = false; rec = new MediaRecorder(recStream, type ? { mimeType: type } : undefined);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      cancelAnimationFrame(waveRaf); clearInterval(recTick); recStream.getTracks().forEach((t) => t.stop()); try { actx && actx.close(); } catch (e) {} actx = null;
      $("chRec").hidden = true; LiveBus.emit("recording", { on: false });
      if (recCancel || !chunks.length) return; const dur = Math.round((Date.now() - recT0) / 1000); if (dur < 1) return;
      const blob = new Blob(chunks, { type: rec.mimeType || type || "audio/webm" });
      try { const path = await upload(blob, extOf(blob.type, "webm"), "در حال ارسال ویس"); await sendMsg({ kind: "voice", media: path, dur }); } catch (e) {}
    };
    rec.start(250); recT0 = Date.now(); $("chRec").hidden = false; $("chRecT").textContent = fmtDur(0); vibe(20); LiveBus.emit("recording", { on: true });
    recTick = setInterval(() => { const s = (Date.now() - recT0) / 1000; $("chRecT").textContent = fmtDur(s); if (s >= 300) stopRec(false); }, 250);
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); const src = actx.createMediaStreamSource(recStream); an = actx.createAnalyser(); an.fftSize = 64; src.connect(an); const d = new Uint8Array(an.frequencyBinCount); const bars = wave.children;
      const loop = () => { an.getByteFrequencyData(d); for (let i = 0; i < bars.length; i++) bars[i].style.height = Math.max(5, (d[i % d.length] / 255) * 30) + "px"; waveRaf = requestAnimationFrame(loop); }; loop(); } catch (e) {}
  }
  function stopRec(cancel) { recCancel = !!cancel; try { rec && rec.state !== "inactive" && rec.stop(); } catch (e) {} }
  $("chRecCancel").onclick = () => stopRec(true); $("chRecSend").onclick = () => stopRec(false);

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
  function lightbox(src) { const l = $("chLight"); l.innerHTML = ""; const i = el("img"); i.src = src; const x = el("button", "", "✕"); x.type = "button"; x.onclick = () => (l.hidden = true); l.append(i, x); l.hidden = false; l.onclick = (e) => { if (e.target === l) l.hidden = true; }; }

  /* ---------- دیده‌شدن و رویدادهای زنده ---------- */
  let seenBusy = false;
  async function markSeen() {
    if (document.hidden || seenBusy) return; const un = [...msgs.values()].some((m) => m.author === you && !m.seen_at && !m.deleted_at && !String(m.id).startsWith("t"));
    try { localStorage.setItem("chat-seen", String(Date.now())); } catch (e) {}
    if (!un) return; seenBusy = true; try { await rpc("seen_chat", { p_who: me }); LiveBus.emit("chat", {}); } catch (e) {} seenBusy = false;
  }
  function bind() {
    const status = (s, on) => { const st = $("chStatus"); st.textContent = s; st.classList.toggle("on", !!on); };
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
