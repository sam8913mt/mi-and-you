/* بازگشت به همان‌جا: وقتی از صفحهٔ چت/فضای مشترک برمی‌گردی، صفحهٔ اصلی از اول اجرا نمی‌شود
   (پردهٔ ورود نمی‌آید) و اسکرول به همان نقطه برمی‌گردد. نقش فقط یک بار انتخاب می‌شود (localStorage). */
(() => {
  const ss = { get: (k) => { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  let who = ""; try { who = localStorage.getItem("who") || ""; } catch (e) {}
  const returning = !!(who && ss.get("entered") === "1");
  try { history.scrollRestoration = "manual"; } catch (e) {}
  if (returning) {
    const g = document.getElementById("gate"); if (g) g.remove();
    document.body.classList.remove("locked");
    document.documentElement.classList.add("returning");
  }
  window.Restore = { returning, markEntered: () => ss.set("entered", "1") };

  let t = 0; const save = () => { if (document.body.classList.contains("locked")) return; ss.set("scrollY", String(Math.round(window.scrollY))); };
  addEventListener("scroll", () => { if (!t) t = setTimeout(() => { t = 0; save(); }, 150); }, { passive: true });
  addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  if (returning) {
    const target = +ss.get("scrollY") || 0; if (target < 5) return;
    let stop = false, tries = 0; const end = () => { stop = true; };
    ["touchstart", "wheel", "keydown", "mousedown"].forEach((e) => addEventListener(e, end, { once: true, passive: true }));
    const go = () => {
      if (stop || tries++ > 40) return;
      const need = target + window.innerHeight - 2;
      if (document.documentElement.scrollHeight >= need) { window.scrollTo(0, target); if (Math.abs(window.scrollY - target) < 4 && tries > 8) return; }
      else window.scrollTo(0, document.documentElement.scrollHeight);
      setTimeout(go, 180);
    };
    go();
  }
})();
