/* ورود با اثر انگشت / قفل صفحه (WebAuthn) — همه‌ی بخش‌های رمزدار
   رمز فقط به‌صورت رمزشده روی همین دستگاه می‌ماند و فقط با تأیید اثر انگشت (یا Face ID / PIN دستگاه) باز می‌شود.
   اگر مرورگر PRF را پشتیبانی کند، کلید رمزگشایی مستقیماً از خود اثر انگشت ساخته می‌شود. */
(() => {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const SALT = enc.encode("me-and-you-bio-v1");
  const CRED = "bio:cred";
  const b64 = (ab) => { let s = ""; new Uint8Array(ab).forEach((c) => (s += String.fromCharCode(c))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); s += "=".repeat((4 - (s.length % 4)) % 4); const r = atob(s), o = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; };
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { localStorage.removeItem(k); } catch (e) {} } };
  const supported = () => !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext && window.crypto && crypto.subtle);

  /* ذخیرهٔ کلید غیرقابل‌استخراج (حالت پشتیبان وقتی PRF نیست) */
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open("me-and-you-bio", 1); r.onupgradeneeded = () => r.result.createObjectStore("k"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const idbGet = async (k) => { const db = await idb(); return new Promise((res, rej) => { const q = db.transaction("k").objectStore("k").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
  const idbSet = async (k, v) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction("k", "readwrite"); t.objectStore("k").put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); };
  const idbDel = async (k) => { try { const db = await idb(); db.transaction("k", "readwrite").objectStore("k").delete(k); } catch (e) {} };

  let credPromise = null;
  const hasCred = () => !!ls.get(CRED);
  async function createCred() {
    const id = crypto.getRandomValues(new Uint8Array(16));
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: "ME & YOU", id: location.hostname },
      user: { id, name: "me-and-you", displayName: "ME & YOU" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
      attestation: "none", timeout: 60000, extensions: { prf: {} } } });
    if (!cred) throw Error("nocred");
    ls.set(CRED, b64(cred.rawId)); return true;
  }
  /* باید مستقیم داخل کلیک کاربر صدا زده شود (قبل از هر await) */
  function ensure() { if (hasCred()) return Promise.resolve(true); if (!credPromise) credPromise = createCred().finally(() => { credPromise = null; }); return credPromise; }

  async function assertion() {
    const id = ls.get(CRED); if (!id) throw Error("nocred");
    const a = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rpId: location.hostname, allowCredentials: [{ type: "public-key", id: unb64(id) }], userVerification: "required", timeout: 60000, extensions: { prf: { eval: { first: SALT } } } } });
    let prf = null; try { const r = a.getClientExtensionResults(); prf = r && r.prf && r.prf.results && r.prf.results.first ? new Uint8Array(r.prf.results.first) : null; } catch (e) {}
    return prf;
  }
  const aes = (raw) => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);

  async function save(k, secret) {
    if (!supported()) throw Error("unsupported");
    await ensure();
    const prf = await assertion(); const iv = crypto.getRandomValues(new Uint8Array(12)); let key, mode;
    if (prf && prf.length >= 32) { key = await aes(prf.slice(0, 32)); mode = "prf"; }
    else { key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); await idbSet("key:" + k, key); mode = "idb"; }
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(secret));
    ls.set("bio:" + k, JSON.stringify({ mode, iv: b64(iv), ct: b64(ct) })); return true;
  }
  async function unlock(k) {
    const raw = ls.get("bio:" + k); if (!raw) throw Error("none");
    const d = JSON.parse(raw); const prf = await assertion(); let key;
    if (d.mode === "prf") { if (!prf || prf.length < 32) throw Error("noprf"); key = await aes(prf.slice(0, 32)); }
    else { key = await idbGet("key:" + k); if (!key) throw Error("nokey"); }
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(d.iv) }, key, unb64(d.ct)); return dec.decode(pt);
  }
  const has = (k) => !!ls.get("bio:" + k) && hasCred();
  const remove = (k) => { ls.del("bio:" + k); idbDel("key:" + k); };
  async function available() { try { return supported() && !!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) { return false; } }
  window.Bio = { supported, available, has, hasCred, ensure, save, unlock, remove };
})();
