(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.SUPABASE_CONFIG || {};
  const ok = cfg.url && cfg.anonKey && !cfg.url.includes("YOUR_PROJECT_ID") && !cfg.anonKey.includes("YOUR_SUPABASE");
  const msg = $("msg"), card = $("card"), go = $("go");
  const say = (t, err) => { msg.textContent = t || ""; msg.classList.toggle("err", !!err); if (err) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); } };
  try { const m = sessionStorage.getItem("adm_msg"); if (m) { say(m); sessionStorage.removeItem("adm_msg"); } } catch (e) {}

  /* ستاره‌ها */
  (() => {
    const cv = $("stars"), c = cv.getContext("2d"); let W, H, S = [];
    const fit = () => { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); S = Array.from({ length: matchMedia("(pointer:coarse)").matches ? 55 : 110 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .3, p: Math.random() * 6 })); };
    fit(); addEventListener("resize", fit);
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) { S.forEach((s) => { c.fillStyle = "#fff8"; c.fillRect(s.x, s.y, s.r, s.r); }); return; }
    const loop = (t) => { c.clearRect(0, 0, W, H); S.forEach((s) => { c.globalAlpha = .25 + .6 * Math.abs(Math.sin(t / 1300 + s.p)); c.fillStyle = "#fff"; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.3); c.fill(); }); if (!document.hidden) requestAnimationFrame(loop); else document.addEventListener("visibilitychange", () => requestAnimationFrame(loop), { once: true }); };
    requestAnimationFrame(loop);
  })();

  $("eye").onclick = () => { const f = $("password"), show = f.type === "password"; f.type = show ? "text" : "password"; $("eye").textContent = show ? "🙈" : "👁"; };
  if (!ok || !window.supabase || !window.supabase.createClient) { say("ابتدا فایل js/supabase-config.js را با آدرس و کلید پروژه پر کن.", true); go.disabled = true; return; }
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });

  async function isAdmin(session) {
    const { data, error } = await sb.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
    return !error && !!data;
  }
  async function enter() { location.replace("admin.html"); }
  (async () => { try { const { data: { session } } = await sb.auth.getSession(); if (session && await isAdmin(session)) enter(); } catch (e) {} })();

  async function login() {
    const email = $("email").value.trim(), password = $("password").value;
    if (!email || !password) { say("ایمیل و رمز را وارد کن.", true); return; }
    go.disabled = true; go.classList.add("load"); say("");
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { say("ورود ناموفق بود: ایمیل یا رمز درست نیست.", true); return; }
      if (!(await isAdmin(data.session))) { await sb.auth.signOut({ scope: "local" }); say("این حساب اجازه مدیریت ندارد.", true); return; }
      $("password").value = ""; say("خوش آمدی 💗"); enter();
    } catch (e) { say("خطا در اتصال؛ دوباره تلاش کن.", true); }
    finally { go.disabled = false; go.classList.remove("load"); }
  }
  go.onclick = login;
  ["email", "password"].forEach((id) => $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") login(); }));
  addEventListener("pageshow", () => { $("password").value = ""; });
})();
