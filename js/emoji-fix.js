/* رفع باگ آیکون صورتی کنار عنوان بخش‌ها:
   ایموجیِ داخل متنِ گرادیانی (شفاف) به‌صورت سیلوئت صورتی دیده می‌شد.
   این فایل ایموجی را از متن جدا می‌کند تا رنگ اصلی‌اش نمایش داده شود. */
(() => {
  const SEL = ".section-title, .gate-title, .hero h1, .ending h2, .photo-head";
  const EMO = /^\s*((?:\p{Extended_Pictographic}|\u200d|\ufe0f|\u20e3)+)\s*/u;
  const wrap = (h) => {
    if (h.dataset.emo) return;
    if (h.children.length) return; // فقط عنوان‌های متنی ساده
    const t = h.textContent, m = EMO.exec(t);
    if (!m) { h.dataset.emo = "0"; return; }
    h.dataset.emo = "1";
    const cs = getComputedStyle(h);
    const bg = cs.backgroundImage;
    const clipped = bg && bg !== "none";
    const ico = document.createElement("span"); ico.className = "emo-ico"; ico.textContent = m[1];
    const txt = document.createElement("span"); txt.className = "emo-txt"; txt.textContent = t.slice(m[0].length);
    h.textContent = ""; h.append(ico, " ", txt);
    if (clipped) {
      h.classList.add("emo-clipped");
      const imp = (el, k, v) => el.style.setProperty(k, v, "important");
      imp(h, "background", "none"); imp(h, "-webkit-background-clip", "border-box"); imp(h, "background-clip", "border-box");
      imp(h, "-webkit-text-fill-color", "#783B55"); imp(h, "color", "#783B55");
      imp(txt, "background-image", bg); imp(txt, "-webkit-background-clip", "text"); imp(txt, "background-clip", "text");
      imp(txt, "-webkit-text-fill-color", "transparent"); imp(txt, "color", "transparent");
    }
  };
  window.EmojiFix = { wrap: (h) => { delete h.dataset.emo; h.classList.remove("emo-clipped"); h.removeAttribute("style"); wrap(h); } };
  const run = (root) => { (root.querySelectorAll ? root.querySelectorAll(SEL) : []).forEach(wrap); if (root.matches && root.matches(SEL)) wrap(root); };
  const start = () => {
    run(document);
    new MutationObserver((ms) => ms.forEach((m) => {
      m.addedNodes.forEach((n) => { if (n.nodeType === 1) run(n); });
      if (m.type === "characterData" || (m.type === "childList" && m.target.nodeType === 1 && m.target.matches && m.target.matches(SEL) && !m.target.dataset.emo)) { /* handled by added nodes */ }
    })).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.addEventListener("load", () => run(document));
})();
