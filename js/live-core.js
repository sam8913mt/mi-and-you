/* اتصال زندهٔ دونفره (Supabase Realtime): حضور + پیام‌های لحظه‌ای. رویدادها به‌صورت window "live:<name>" می‌رسند. */
(() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const base = String(cfg.url || "").replace(/\/$/, ""), key = cfg.anonKey || "";
  const topic = "realtime:me-and-you-live-7k2";
  let ws = null, ref = 1, hb = 0, retry = 0, joined = false, who = "", present = new Set(), stopped = false;
  const other = (w) => (w === "ماجی" ? "محمد" : "ماجی");
  const send = (o) => { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} };
  const msg = (event, payload) => ({ topic, event, payload, ref: String(ref++), join_ref: "1" });
  const fire = (n, d) => window.dispatchEvent(new CustomEvent("live:" + n, { detail: d }));
  const onMsg = (m) => {
    if (m.event === "phx_reply" && m.topic === topic && m.payload && m.payload.status === "ok" && !joined) { joined = true; retry = 0; send(msg("presence", { type: "presence", event: "track", payload: { who, at: Date.now() } })); }
    else if (m.event === "presence_state" && m.payload) { present = new Set(Object.keys(m.payload)); fire("presence", { on: present.has(other(who)) }); }
    else if (m.event === "presence_diff" && m.payload) { Object.keys(m.payload.joins || {}).forEach((k) => present.add(k)); Object.keys(m.payload.leaves || {}).forEach((k) => present.delete(k)); fire("presence", { on: present.has(other(who)) }); }
    else if (m.event === "broadcast" && m.payload) { const d = m.payload.payload || {}; if (d.from === who) return; fire(m.payload.event, d); }
  };
  function connect() {
    if (stopped || !base || !key || !who) return;
    try { ws = new WebSocket(base.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(key) + "&vsn=1.0.0"); } catch (e) { return; }
    joined = false;
    ws.onopen = () => {
      const payload = { config: { broadcast: { ack: false, self: false }, presence: { key: who, enabled: true }, postgres_changes: [], private: false } };
      if (/^eyJ/.test(key)) payload.access_token = key;
      send({ topic, event: "phx_join", payload, ref: "1", join_ref: "1" });
      clearInterval(hb); hb = setInterval(() => send({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref++) }), 25000);
    };
    ws.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch (x) {} };
    ws.onclose = () => { clearInterval(hb); present = new Set(); fire("presence", { on: false }); if (!stopped) setTimeout(connect, Math.min(30000, 2000 * ++retry)); };
    ws.onerror = () => { try { ws.close(); } catch (e) {} };
  }
  window.LiveBus = {
    start(w) { if (!w) return; if (ws && who === w) return; if (ws) { stopped = true; try { ws.close(); } catch (e) {} stopped = false; } who = w; present = new Set(); connect(); },
    emit(event, payload) { send(msg("broadcast", { type: "broadcast", event, payload: Object.assign({ from: who }, payload || {}) })); },
    partnerOn() { return present.has(other(who)); }
  };
  document.addEventListener("visibilitychange", () => { if (!document.hidden && who && (!ws || ws.readyState > 1)) { stopped = false; connect(); } });
})();
