/* ME & YOU — romantic cinematic layer (visual effects only, no data access) */
(() => {
  const root = document.documentElement;
  root.classList.add("rm-ready");
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const buzz = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ---------- hearts burst (also used by the countdown) ---------- */
  function burst(x, y, count = 26) {
    if (rm) return;
    x = x ?? innerWidth / 2; y = y ?? innerHeight / 2;
    for (let i = 0; i < count; i++) {
      const h = document.createElement("div");
      h.className = "burst-heart";
      h.textContent = ["♥", "♡", "💗", "✨"][i % 4];
      const a = rand(0, Math.PI * 2), d = rand(90, 260);
      h.style.cssText = `left:${x}px;top:${y}px;font-size:${rand(14, 30)}px;color:${["#e0678c", "#ff9bb8", "#D6B77A"][i % 3]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 60}px;--rot:${rand(-200, 200)}deg`;
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1600);
    }
  }
  window.MY = { burst };

  /* ---------- gate: stars + petals ---------- */
  const gate = $("#gate");
  if (!gate) root.classList.add("no-gate");
  else {
    const fx = document.createElement("div");
    fx.className = "gate-fx"; fx.setAttribute("aria-hidden", "true");
    for (let i = 0; i < (rm ? 25 : 70); i++) {
      const s = document.createElement("i"); s.className = "star";
      const z = rand(1.5, 3.4);
      s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;width:${z}px;height:${z}px;--d:${rand(2, 5)}s;--dl:${rand(0, 4)}s`;
      fx.appendChild(s);
    }
    if (!rm) for (let i = 0; i < 16; i++) {
      const p = document.createElement("i"); p.className = "petal";
      p.style.cssText = `left:${rand(0, 100)}%;--s:${rand(10, 20)}px;--d:${rand(8, 15)}s;--dl:${rand(-12, 0)}s;--sw:${rand(30, 90)}px`;
      fx.appendChild(p);
    }
    gate.prepend(fx);
    new MutationObserver(() => {
      if (gate.classList.contains("hide")) { root.classList.add("opened"); burst(); buzz(25); }
    }).observe(gate, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- scroll progress ---------- */
  const bar = document.createElement("div");
  bar.id = "scrollBar"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let ticking = false;
  const upd = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });

  /* ---------- cursor heart trail (desktop only) ---------- */
  if (fine && !rm) {
    let last = 0;
    addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - last < 70 || gate && document.body.contains(gate) && !gate.classList.contains("hide")) return;
      last = now;
      const h = document.createElement("div");
      h.className = "trail-heart"; h.textContent = Math.random() > .5 ? "♥" : "♡";
      h.style.left = e.clientX + "px"; h.style.top = e.clientY + "px";
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 950);
    }, { passive: true });
  }

  /* ---------- haptic feedback ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest(".secret,.p2-option,.env-btn,.gate-btn,.p2-btn")) buzz(12);
  });

  /* ---------- music button: equalizer while playing ---------- */
  const music = $("#music"), mbtn = $("#musicBtn");
  if (music && mbtn) {
    const sync = () => mbtn.classList.toggle("playing", !music.paused);
    music.addEventListener("play", sync); music.addEventListener("pause", sync); sync();
  }

  /* ---------- reorder sections into a better story ---------- */
  const main = $("main");
  if (main) {
    const closest = (sel, up) => { const el = $(sel); return el ? el.closest(up) : null; };
    const order = [
      $("#letter"), closest("#photos", "section"), $(".counter"), $("#meetingCountdown"),
      $("#distanceSection"), $("#videosSection"), $("#lettersSection"),
      closest(".secret-grid", "section"), $("#quizSection"), $("#posterSection"),
      $("#privateMessagesSection"), $(".ending")
    ].filter(Boolean);
    order.forEach((el) => main.appendChild(el));
  }

  /* ---------- reveal for the dynamically added sections ---------- */
  const secs = document.querySelectorAll(".phase2-section");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); } }), { threshold: .08 });
    secs.forEach((s) => { s.classList.remove("show"); io.observe(s); });
  }

  /* ---------- staggered photo appearance ---------- */
  const photos = $("#photos");
  if (photos) {
    if (!("IntersectionObserver" in window)) root.classList.remove("rm-ready");
    else {
      const po = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = [...photos.children].indexOf(e.target);
        e.target.style.transitionDelay = (i % 3) * 140 + "ms";
        e.target.classList.add("in"); po.unobserve(e.target);
      }), { threshold: .1 });
      const scan = () => photos.querySelectorAll(".photo:not(.skeleton):not([data-po])").forEach((p) => { p.dataset.po = "1"; po.observe(p); });
      new MutationObserver(scan).observe(photos, { childList: true });
      scan();
    }
  }
})();
