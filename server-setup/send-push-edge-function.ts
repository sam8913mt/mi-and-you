// @ts-nocheck
// Supabase Edge Function: send-push
// تنظیمات (Secrets): PUSH_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// «Verify JWT» را برای این تابع خاموش کن.
import webpush from "npm:web-push@3.6.7";

const SB = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const rest = (path: string, init: RequestInit = {}) => fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });

// ---- Jalali (از jdate.js) ----
const div = (a, b) => ~~(a / b), mod = (a, b) => a - ~~(a / b) * b;
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function jalCal(jy) {
    const bl = breaks.length, gy = jy + 621;
    let leapJ = -14, jp = breaks[0], jm, jump = 0, n, i;
    if (jy < jp || jy >= breaks[bl - 1]) throw new Error("Invalid Jalali year " + jy);
    for (i = 1; i < bl; i += 1) {
      jm = breaks[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4); jp = jm;
    }
    n = jy - jp;
    leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    let leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap, gy, march };
  }
  function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  }
  function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1;
    return { gy: div(j, 1461) - 100100 + div(8 - gm, 6), gm, gd };
  }
  function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn) {
    const gy = d2g(jdn).gy; let jy = gy - 621;
    const r = jalCal(jy), jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f, jm, jd;
    if (k >= 0) {
      if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
      k -= 186;
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  }
  const jalaliMonthLength = (jy, jm) => jm <= 6 ? 31 : jm <= 11 ? 30 : (jalCal(jy).leap === 0 ? 30 : 29);
  const toJalali = (gy, gm, gd) => d2j(g2d(gy, gm, gd));
  
const pad = (n: number) => String(n).padStart(2, "0");
const faNum = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

async function send(rec: any) {
  const r = await rest(`push_subscriptions?who=eq.${encodeURIComponent(rec.to_who)}&select=id,endpoint,p256dh,auth`);
  const subs = await r.json();
  const payload = JSON.stringify({ title: rec.title, body: rec.body, url: rec.url || "./", tag: rec.id });
  let sent = 0;
  await Promise.all((subs || []).map(async (s: any) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" });
      sent++;
    } catch (e: any) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) await rest(`push_subscriptions?id=eq.${s.id}`, { method: "DELETE" });
      else console.error("push error", e && e.statusCode, e && e.body);
    }
  }));
  return sent;
}

async function notifyBoth(kind: string, title: string, body: string, key: string) {
  const rows = ["ماجی", "محمد"].map((w) => ({ to_who: w, kind, title, body, dedupe_key: `${key}:${w}` }));
  await rest("notifications?on_conflict=dedupe_key", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(rows) });
}

async function daily() {
  const t = new Date(Date.now() + 3.5 * 3600000);
  const gy = t.getUTCFullYear(), gm = t.getUTCMonth() + 1, gd = t.getUTCDate();
  const todayIso = `${gy}-${pad(gm)}-${pad(gd)}`;
  const tj = toJalali(gy, gm, gd);
  const out: string[] = [];

  const cfg = await (await rest("site_content?select=key,value&key=in.(start_date,meeting_date)")).json();
  const get = (k: string) => { const r = (cfg || []).find((x: any) => x.key === k); return r ? String(r.value) : ""; };

  const sd = get("start_date");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sd);
  if (m) {
    const sj = toJalali(+m[1], +m[2], +m[3]);
    const len = jalaliMonthLength(tj.jy, tj.jm);
    const dayMatch = tj.jd === Math.min(sj.jd, len);
    const months = (tj.jy - sj.jy) * 12 + (tj.jm - sj.jm);
    if (dayMatch && months > 0) {
      if (months % 12 === 0) {
        await notifyBoth("anniv", `🎉 سالگرد ما مبارک!`, `امروز ${faNum(months / 12)} سالگی ماست 💞`, `anniv:${todayIso}`);
        out.push("year");
      } else {
        await notifyBoth("anniv", `💞 ماهگرد ما مبارک!`, `امروز ${faNum(months)} ماه از شروع ما می‌گذرد 🤍`, `month:${todayIso}`);
        out.push("month");
      }
    }
    const days = Math.round((Date.UTC(gy, gm - 1, gd) - Date.UTC(+m[1], +m[2] - 1, +m[3])) / 86400000);
    if (days > 0 && days % 100 === 0) {
      await notifyBoth("anniv", `✨ ${faNum(days)} روز با هم`, `امروز روز ${faNum(days)}ام ماست 🤍`, `days:${days}`);
      out.push("days");
    }
  }

  const md = get("meeting_date");
  if (md) {
    const d = new Date(md);
    if (!Number.isNaN(d.getTime())) {
      const z = new Date(d.getTime() + 3.5 * 3600000);
      if (`${z.getUTCFullYear()}-${pad(z.getUTCMonth() + 1)}-${pad(z.getUTCDate())}` === todayIso) {
        await notifyBoth("meet", "🤍 امروز روز دیدار است", "امروز همدیگر را می‌بینیم!", `meet:${todayIso}`);
        out.push("meet");
      }
    }
  }

  const caps = await (await rest(`time_capsules?select=id,author,title&unlock_at=lte.${encodeURIComponent(new Date().toISOString())}&unlock_notified=eq.false`)).json();
  for (const c of caps || []) {
    await notifyBoth("capsule", "⏳ یک صندوقچه باز شد", `«${c.title}» از ${c.author} حالا قابل خواندن است 💌`, `capopen:${c.id}`);
    await rest(`time_capsules?id=eq.${c.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ unlock_notified: true }) });
    out.push("capsule");
  }

  const old = new Date(Date.now() - 60 * 86400000).toISOString();
  await rest(`notifications?created_at=lt.${encodeURIComponent(old)}`, { method: "DELETE" });
  return out;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-push-secret") !== Deno.env.get("PUSH_SECRET")) return new Response("forbidden", { status: 403 });
  try {
    const body = await req.json();
    if (body.mode === "daily") return Response.json({ ok: true, did: await daily() });
    if (body.record && body.record.to_who) return Response.json({ ok: true, sent: await send(body.record) });
    return Response.json({ ok: false }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
});
