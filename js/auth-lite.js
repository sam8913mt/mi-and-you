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
      const canBio = !!(window.Bio && Bio.supported()), hasBio = canBio && Bio.has("acode"); let enroll = null;
      const finish = (v) => { o.remove(); pending = null; resolve(v); };
      const accept = (c) => { Session.setCode(c); finish(true); window.dispatchEvent(new Event("p2-auth")); };
      const submit = async () => {
        if (!who) { msg.textContent = "اول از صفحهٔ اصلی نقشت را انتخاب کن."; return; }
        if (!inp.value) return;
        const pend = enroll && enroll.checked && !Bio.has("acode") ? Bio.ensure().catch(() => null) : null;
        go.disabled = true; msg.textContent = "";
        try { const ok = await rpc("verify_access_code", { p_access_code: inp.value }); if (ok === true) { if (pend && (await pend)) { try { await Bio.save("acode", inp.value); } catch (e) {} } accept(inp.value); return; } msg.textContent = "رمز درست نیست."; }
        catch (e) { msg.textContent = "اتصال برقرار نشد."; } go.disabled = false;
      };
      const viaBio = async () => {
        msg.textContent = "";
        try { const c = await Bio.unlock("acode"); if ((await rpc("verify_access_code", { p_access_code: c })) === true) { accept(c); return; } Bio.remove("acode"); msg.textContent = "رمز ذخیره‌شده دیگر معتبر نیست؛ دوباره وارد کن."; }
        catch (e) { msg.textContent = "اثر انگشت تأیید نشد؛ رمز را بنویس."; }
      };
      go.onclick = submit; inp.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
      box.append(inp);
      if (hasBio) { const bb = el("button", "al-go al-bio", "🔓 ورود با اثر انگشت"); bb.type = "button"; bb.onclick = viaBio; box.append(bb); }
      else if (canBio) { const lab = el("label", "al-chk"); enroll = document.createElement("input"); enroll.type = "checkbox"; enroll.checked = true; lab.append(enroll, document.createTextNode(" ورودهای بعدی با اثر انگشت")); box.append(lab); }
      box.append(go, msg, back);
      if (hasBio) { const rm = el("button", "al-back", "حذف اثر انگشت از این دستگاه"); rm.type = "button"; rm.style.cssText = "display:block;margin:4px auto 0;background:none;border:0;cursor:pointer"; rm.onclick = () => { Bio.remove("acode"); rm.remove(); msg.textContent = "اثر انگشت حذف شد."; }; box.append(rm); }
      o.append(box); document.body.append(o);
      if (hasBio) setTimeout(viaBio, 300); else setTimeout(() => inp.focus(), 80);
    });
    return pending;
  }
  window.AuthLite = {
    rpc, base, key, hdr,
    ensure: async () => { if (Session.code()) return true; return ask(); }
  };
})();
