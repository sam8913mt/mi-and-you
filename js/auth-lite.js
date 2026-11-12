/* ورود با رمز مشترک برای صفحه‌های جدا (چت، فضای مشترک) */
(() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const base = String(cfg.url || "").replace(/\/$/, ""), key = cfg.anonKey || "";
  const hdr = () => { const h = { apikey: key, "Content-Type": "application/json" }; if (/^eyJ/.test(key)) h.Authorization = "Bearer " + key; return h; };
  const rpc = (n, b) => fetch(`${base}/rest/v1/rpc/${n}`, { method: "POST", headers: hdr(), body: JSON.stringify(b || {}) }).then((r) => { if (!r.ok) throw Error(n); return r.json(); });
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  let pending = null;
  function ask() {
    if (pending) return pending;
    pending = new Promise((resolve) => {
      const o = el("div", "al-ov"), box = el("div", "al-box"); const who = Session.who();
      box.append(el("div", "al-ico", "🔐"), el("h3", "", "رمز مشترک"), el("p", "", who ? "ورود به‌عنوان " + who : "اول از صفحهٔ اصلی نقشت را انتخاب کن"));
      const inp = el("input"); inp.type = "password"; inp.placeholder = "رمز مشترک را بنویس"; inp.autocomplete = "off"; inp.setAttribute("autocapitalize", "off");
      const msg = el("div", "al-msg"), go = el("button", "al-go", "ورود 💗"), back = el("a", "al-back", "← صفحهٔ اصلی"); back.href = "index.html";
      go.type = "button";
      const finish = (v) => { o.remove(); pending = null; resolve(v); };
      const submit = async () => {
        if (!who) { msg.textContent = "اول از صفحهٔ اصلی نقشت را انتخاب کن."; return; }
        if (!inp.value) return; go.disabled = true; msg.textContent = "";
        try { const ok = await rpc("verify_access_code", { p_access_code: inp.value }); if (ok === true) { Session.setCode(inp.value); finish(true); window.dispatchEvent(new Event("p2-auth")); return; } msg.textContent = "رمز درست نیست."; }
        catch (e) { msg.textContent = "اتصال برقرار نشد."; } go.disabled = false;
      };
      go.onclick = submit; inp.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
      box.append(inp, go, msg, back); o.append(box); document.body.append(o); setTimeout(() => inp.focus(), 80);
    });
    return pending;
  }
  window.AuthLite = {
    rpc, base, key, hdr,
    ensure: async () => { if (Session.code()) return true; return ask(); }
  };
})();
