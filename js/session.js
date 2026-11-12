/* مدیریت نشست: رمز مشترک فقط در همین نشست می‌ماند و با هر خروج فراموش می‌شود؛ نقش در این دستگاه می‌ماند. */
(() => {
  const ss = { get: (k) => { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} } };
  try { localStorage.removeItem("acode"); } catch (e) {}
  // لینک‌های داخلی سایت (چت، فضای مشترک، صفحهٔ اصلی) خروج حساب نمی‌شوند
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    try { const u = new URL(a.href, location.href); if (u.origin === location.origin && !a.target) ss.set("nav", "1"); } catch (x) {}
  }, true);
  const leave = () => { if (!ss.get("nav")) ss.del("acode"); };
  addEventListener("pagehide", leave);
  addEventListener("pageshow", () => { ss.del("nav"); });
  window.Session = {
    who: () => { try { return localStorage.getItem("who") || ""; } catch (e) { return ""; } },
    code: () => ss.get("acode"),
    setCode: (c) => ss.set("acode", c),
    clearCode: () => ss.del("acode"),
    goto: (url) => { ss.set("nav", "1"); location.href = url; }
  };
})();
