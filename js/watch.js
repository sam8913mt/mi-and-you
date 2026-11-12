/* ME & YOU — فیلم دونفره: پخش هم‌زمان + صحبت با میکروفون (WebRTC) + چت کوتاه و ایموجی */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const me = Session.who(), you = me === "ماجی" ? "محمد" : "ماجی";
  const vibe = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const emit = (e, p) => { try { LiveBus.emit(e, p); } catch (x) {} };
  const online = () => { try { return LiveBus.partnerOn(); } catch (e) { return false; } };
  if (!me) { const g = $("wGate"); g.hidden = false; const d = el("div"); d.append(el("div", "", "🌸🌙\nاول از صفحهٔ اصلی نقشت را انتخاب کن."), (() => { const a = el("a", "", "رفتن به صفحهٔ اصلی"); a.href = "index.html"; return a; })()); g.append(d); return; }

  let toastT = 0; const toast = (t) => { const b = $("wToast"); b.textContent = t; b.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (b.hidden = true), 3800); };
  const say = (who, text) => { const m = el("div", "w-msg " + who, text); const box = $("wMsgs"); box.append(m); while (box.children.length > 60) box.firstChild.remove(); box.scrollTop = box.scrollHeight; };

  /* ---------- تشخیص لینک ---------- */
  function parse(u) {
    u = String(u || "").trim(); if (!u) return null;
    let m = /aparat\.com\/(?:v|video\/video\/show\/videohash)\/([A-Za-z0-9]+)/i.exec(u) || /aparat\.com\/video\/video\/embed\/videohash\/([A-Za-z0-9]+)/i.exec(u);
    if (m) return { kind: "aparat", hash: m[1] };
    if (/^https?:\/\//i.test(u)) return { kind: "direct", url: u };
    return null;
  }

  /* ---------- پلیر ---------- */
  let cur = null, vid = null, applying = false, hls = null, hostTimer = 0;
  const stage = $("wStage"), box = $("wPlayer");
  function clearPlayer() { clearInterval(hostTimer); if (hls) { try { hls.destroy(); } catch (e) {} hls = null; } vid = null; box.innerHTML = ""; }
  function loadHls(url, v) {
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; return; }
    const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
    s.onload = () => { if (window.Hls && Hls.isSupported()) { hls = new Hls(); hls.loadSource(url); hls.attachMedia(v); } else toast("این مرورگر از پخش m3u8 پشتیبانی نمی‌کند"); };
    s.onerror = () => toast("بارگذاری پخش‌کنندهٔ m3u8 ممکن نشد"); document.head.append(s);
  }
  function open(info, fromRemote) {
    clearPlayer(); cur = info; stage.hidden = false;
    $("wToolsAparat").hidden = info.kind !== "aparat"; $("wToolsDirect").hidden = info.kind !== "direct";
    if (info.kind === "aparat") {
      const f = document.createElement("iframe"); f.src = `https://www.aparat.com/video/video/embed/videohash/${info.hash}/vt/frame`; f.allow = "autoplay; fullscreen; picture-in-picture"; f.allowFullscreen = true; f.setAttribute("title", "آپارات"); box.append(f);
      say("sys", fromRemote ? `${you} یک فیلم آپارات باز کرد` : "فیلم آپارات باز شد؛ برای شروع هم‌زمان از «شمارش معکوس» استفاده کنید");
    } else {
      const v = document.createElement("video"); v.controls = true; v.playsInline = true; v.preload = "metadata"; vid = v; box.append(v);
      if (/\.m3u8(\?|$)/i.test(info.url)) loadHls(info.url, v); else v.src = info.url;
      v.onerror = () => toast("این لینک قابل پخش نیست؛ لینک مستقیم فایل ویدئو لازم است");
      const guard = (fn) => (...a) => { if (applying) return; fn(...a); };
      v.addEventListener("play", guard(() => emit("watch", { t: "play", at: v.currentTime })));
      v.addEventListener("pause", guard(() => emit("watch", { t: "pause", at: v.currentTime })));
      v.addEventListener("seeked", guard(() => emit("watch", { t: "seek", at: v.currentTime, playing: !v.paused })));
      hostTimer = setInterval(() => { if (vid && !vid.paused && online()) emit("watch", { t: "state", at: vid.currentTime, playing: true }); }, 5000);
      say("sys", fromRemote ? `${you} یک فیلم باز کرد` : "فیلم باز شد؛ پخش و مکث و جلو/عقب برای هر دو هم‌زمان است");
    }
    stage.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const apply = (fn) => { applying = true; try { fn(); } catch (e) {} setTimeout(() => (applying = false), 600); };
  const seekTo = (t) => { if (vid && isFinite(t) && Math.abs(vid.currentTime - t) > 0.6) vid.currentTime = t; };

  $("wGo").onclick = () => {
    const info = parse($("wUrl").value); if (!info) { toast("لینک معتبر بنویس (با https)"); return; }
    open(info, false); emit("watch", { t: "load", info });
    if (!online()) toast(`${you} الان آنلاین نیست؛ وقتی آمد فیلم برایش باز می‌شود`);
  };
  $("wUrl").addEventListener("keydown", (e) => { if (e.key === "Enter") $("wGo").click(); });
  $("wFull").onclick = () => { const t = box; (t.requestFullscreen || t.webkitRequestFullscreen || (() => {})).call(t); };
  $("wSyncNow").onclick = () => { if (vid) emit("watch", { t: "state", at: vid.currentTime, playing: !vid.paused, force: true }); toast("درخواست هماهنگی فرستاده شد"); };

  window.addEventListener("live:watch", (e) => {
    const d = e.detail || {};
    if (d.t === "load" && d.info) { if (cur && JSON.stringify(cur) === JSON.stringify(d.info) && box.firstChild) return; open(d.info, true); return; }
    if (d.t === "hello") { if (cur) { emit("watch", { t: "load", info: cur }); if (vid) setTimeout(() => emit("watch", { t: "state", at: vid.currentTime, playing: !vid.paused, force: true }), 1200); } return; }
    if (d.t === "count") { countdown(); return; }
    if (d.t === "pausecall") { toast(`⏸ ${you} می‌گوید: مکث کنیم`); say("sys", `${you}: بیایید مکث کنیم`); vibe([60, 80, 60]); return; }
    if (d.t === "goto") { toast(`⏱ ${you}: برو به ${d.time}`); say("sys", `${you}: برو به ${d.time}`); vibe([40, 60, 40]); return; }
    if (!vid) return;
    if (d.t === "play") apply(() => { seekTo(d.at); vid.play().catch(() => toast("برای پخش هم‌زمان یک بار روی ویدئو بزن ▶")); });
    else if (d.t === "pause") apply(() => { vid.pause(); seekTo(d.at); });
    else if (d.t === "seek") apply(() => { seekTo(d.at); if (d.playing && vid.paused) vid.play().catch(() => {}); });
    else if (d.t === "state") { if (d.force || Math.abs(vid.currentTime - d.at) > 1.5) apply(() => seekTo(d.at)); if (d.playing && vid.paused) apply(() => vid.play().catch(() => {})); }
  });

  /* ---------- ابزار آپارات ---------- */
  function countdown() {
    const ov = $("wCountOv"); ov.hidden = false; let n = 3; ov.textContent = "۳"; vibe(30);
    const iv = setInterval(() => { n--; if (n > 0) { ov.textContent = ["", "۱", "۲", "۳"][n]; vibe(30); } else { clearInterval(iv); ov.textContent = "▶"; vibe([80, 60, 80]); setTimeout(() => (ov.hidden = true), 900); } }, 1000);
  }
  $("wCount").onclick = () => { emit("watch", { t: "count" }); countdown(); };
  $("wPauseCall").onclick = () => { emit("watch", { t: "pausecall" }); say("sys", "درخواست مکث فرستاده شد"); };
  $("wTimeSend").onclick = () => { const t = $("wTime").value.trim(); if (!t) return; emit("watch", { t: "goto", time: t }); say("sys", "زمان " + t + " برای او فرستاده شد"); };

  /* ---------- چت کوتاه و ایموجی ---------- */
  ["❤️", "😂", "😮", "👏", "🔥", "😭", "🥰"].forEach((e) => { const b = el("button", "", e); b.type = "button"; b.onclick = () => { float(e); emit("wreact", { e }); }; $("wReact").append(b); });
  function float(e) { const f = el("div", "w-float", e); f.style.left = (10 + Math.random() * 80) + "vw"; f.style.bottom = "90px"; document.body.append(f); setTimeout(() => f.remove(), 2500); }
  window.addEventListener("live:wreact", (ev) => { const e = ev.detail && ev.detail.e; if (e) { float(e); vibe(15); } });
  const sendText = () => { const t = $("wText").value.trim(); if (!t) return; $("wText").value = ""; say("me", t); emit("wchat", { text: t }); };
  $("wSend").onclick = sendText; $("wText").addEventListener("keydown", (e) => { if (e.key === "Enter") sendText(); });
  window.addEventListener("live:wchat", (ev) => { const t = ev.detail && ev.detail.text; if (t) { say("you", t); vibe(20); } });

  /* ---------- صحبت با میکروفون (WebRTC) ---------- */
  const ICE = (window.RTC_CONFIG && RTC_CONFIG.iceServers) || [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
  let pc = null, local = null, muted = false, pendingIce = [], offerSdp = null;
  const st = (t) => ($("wCallSt").textContent = t);
  const ui = (inCall) => { $("wMic").hidden = inCall; $("wMute").hidden = !inCall; $("wHang").hidden = !inCall; };
  async function mic() { if (!navigator.mediaDevices) throw Error("nomic"); return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
  function makePc() {
    pc = new RTCPeerConnection({ iceServers: ICE }); pendingIce = [];
    pc.onicecandidate = (e) => { if (e.candidate) emit("rtc", { t: "ice", c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.ontrack = (e) => { $("wRemote").srcObject = e.streams[0]; $("wRemote").play().catch(() => {}); };
    pc.onconnectionstatechange = () => {
      const s = pc && pc.connectionState;
      if (s === "connected") { st("🎙️ وصل شدید؛ صحبت کنید"); vibe([40, 60, 40]); }
      else if (s === "connecting") st("در حال اتصال…");
      else if (s === "failed") { st("اتصال برقرار نشد؛ شبکه‌ها ممکن است به سرور TURN نیاز داشته باشند (js/supabase-config.js)"); }
      else if (s === "disconnected") st("اتصال قطع شد…");
    };
    local.getTracks().forEach((t) => pc.addTrack(t, local));
  }
  async function startCall() {
    if (pc) return;
    if (!window.RTCPeerConnection) { toast("این مرورگر تماس را پشتیبانی نمی‌کند"); return; }
    try { local = await mic(); } catch (e) { toast("اجازهٔ میکروفون داده نشد"); return; }
    if (!online()) { toast(`${you} الان آنلاین نیست`); local.getTracks().forEach((t) => t.stop()); local = null; return; }
    makePc(); ui(true); st(`در حال تماس با ${you}…`);
    const o = await pc.createOffer({ offerToReceiveAudio: true }); await pc.setLocalDescription(o); emit("rtc", { t: "offer", sdp: o.sdp });
  }
  async function answerCall() {
    try { local = await mic(); } catch (e) { toast("اجازهٔ میکروفون داده نشد"); emit("rtc", { t: "bye" }); offerSdp = null; return; }
    makePc(); ui(true); st("در حال اتصال…");
    await pc.setRemoteDescription({ type: "offer", sdp: offerSdp }); offerSdp = null;
    for (const c of pendingIce) { try { await pc.addIceCandidate(c); } catch (e) {} } pendingIce = [];
    const a = await pc.createAnswer(); await pc.setLocalDescription(a); emit("rtc", { t: "answer", sdp: a.sdp });
  }
  function endCall(notify) { if (notify) emit("rtc", { t: "bye" }); try { pc && pc.close(); } catch (e) {} pc = null; if (local) { local.getTracks().forEach((t) => t.stop()); local = null; } $("wRemote").srcObject = null; muted = false; $("wMute").textContent = "🔇 بی‌صدا"; $("wMute").classList.remove("on"); ui(false); offerSdp = null; st("تماس تمام شد."); }
  window.addEventListener("live:rtc", async (ev) => {
    const d = ev.detail || {};
    try {
      if (d.t === "offer") {
        if (pc) return; offerSdp = d.sdp; vibe([80, 60, 80, 60, 80]);
        st(`${you} می‌خواهد صحبت کند`); const b = $("wMic"); b.hidden = false; b.textContent = `📞 پاسخ به ${you}`; b.onclick = () => { b.onclick = startCall; b.textContent = "🎙️ شروع صحبت با میکروفون"; answerCall(); };
      } else if (d.t === "answer" && pc) { await pc.setRemoteDescription({ type: "answer", sdp: d.sdp }); for (const c of pendingIce) { try { await pc.addIceCandidate(c); } catch (e) {} } pendingIce = []; }
      else if (d.t === "ice") { if (pc && pc.remoteDescription) { try { await pc.addIceCandidate(d.c); } catch (e) {} } else pendingIce.push(d.c); }
      else if (d.t === "bye") { if (pc) endCall(false); else { offerSdp = null; $("wMic").textContent = "🎙️ شروع صحبت با میکروفون"; $("wMic").onclick = startCall; st("تماس لغو شد."); } }
    } catch (e) { st("خطا در تماس"); }
  });
  $("wMic").onclick = startCall;
  $("wHang").onclick = () => endCall(true);
  $("wMute").onclick = () => { muted = !muted; if (local) local.getAudioTracks().forEach((t) => (t.enabled = !muted)); $("wMute").textContent = muted ? "🔊 باز کردن صدا" : "🔇 بی‌صدا"; $("wMute").classList.toggle("on", muted); };
  addEventListener("pagehide", () => { if (pc) emit("rtc", { t: "bye" }); });

  /* ---------- اتصال زنده ---------- */
  const status = () => { const s = $("wStatus"), o = online(); s.textContent = o ? `${you} هم اینجاست 🤍` : "آفلاین"; s.classList.toggle("on", o); };
  let helloSent = false;
  window.addEventListener("live:presence", (e) => {
    status(); const on = e.detail && e.detail.on;
    if (on && !helloSent) { helloSent = true; emit("watch", { t: "hello" }); if (cur) { emit("watch", { t: "load", info: cur }); } }
    if (!on) { helloSent = false; if (pc && pc.connectionState !== "connected") endCall(false); }
  });
  LiveBus.start(me); status();
})();
