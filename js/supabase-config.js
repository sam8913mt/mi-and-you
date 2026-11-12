/* Supabase configuration for the static site.
 * Only the project URL and publishable key belong here. Never use a secret/service_role key.
 */
window.SUPABASE_CONFIG = {
  url: "https://sidmieztoflnpmcjlgzr.supabase.co",
  anonKey: "sb_publishable_3puS_gfV7dz2RjtdA1sO3Q_BFZa0S8N"
};

/* کلید عمومی VAPID برای اعلان‌ها (کلید خصوصی فقط در Supabase Secrets می‌ماند). */
window.PUSH_CONFIG = {
  vapidPublicKey: "BLmrDJ2ZZAP9QcajpkJlBY-IqHXMNgFFjzVBdV-9-aWvhhaPTT4M_kgm8gdbLmgyr511cSYh29pmDeEdvhoKjrY"
};

/* تماس صوتی در «فیلم دونفره»: به‌صورت پیش‌فرض فقط STUN رایگان؛ اگر روی بعضی شبکه‌ها وصل نشد، یک سرور TURN اضافه کن:
   window.RTC_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "turn:YOUR_TURN_HOST:3478", username: "USER", credential: "PASS" }] }; */
