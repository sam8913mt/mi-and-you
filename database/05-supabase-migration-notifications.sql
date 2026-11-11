-- ME & YOU — نوتیفیکیشن (دوطرفه). بعد از همهٔ migrationهای قبلی اجرا شود. قابل اجرای مجدد است.
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------- جدول‌ها ----------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  who text not null check (who in ('ماجی','محمد')),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  to_who text not null check (to_who in ('ماجی','محمد')),
  kind text not null default 'info',
  title text not null,
  body text not null default '',
  url text not null default './',
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);
create index if not exists notifications_to_idx on public.notifications(to_who, created_at desc);
create table if not exists public.push_settings (
  id integer primary key default 1 check (id = 1),
  function_url text not null,
  secret text not null
);
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.push_settings enable row level security;
-- هیچ policy عمومی ندارند؛ فقط توابع زیر به آن‌ها دسترسی دارند.

insert into public.push_settings(id, function_url, secret)
values (1, 'https://sidmieztoflnpmcjlgzr.supabase.co/functions/v1/send-push', '47c6e6e1a7e1bdf59f3178cc52212a386296f4eced47c080')
on conflict (id) do nothing;

alter table public.time_capsules add column if not exists unlock_notified boolean not null default false;

-- ---------- ساخت اعلان + ارسال به Edge Function ----------
create or replace function public.push_other(p_who text) returns text language sql immutable as $$
  select case when p_who = 'ماجی' then 'محمد' else 'ماجی' end $$;

create or replace function public.push_notify(p_to text, p_kind text, p_title text, p_body text, p_dedupe text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_to not in ('ماجی','محمد') then return; end if;
  insert into public.notifications(to_who, kind, title, body, dedupe_key)
  values (p_to, p_kind, p_title, left(coalesce(p_body,''), 300), p_dedupe)
  on conflict (dedupe_key) do update
    set title = excluded.title, body = excluded.body, created_at = now(), seen_at = null;
end $$;
revoke all on function public.push_notify(text,text,text,text,text) from public;

create or replace function public.trg_push_send() returns trigger
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  select * into s from public.push_settings where id = 1;
  if s.function_url is null then return new; end if;
  begin
    perform net.http_post(
      url := s.function_url,
      headers := jsonb_build_object('Content-Type','application/json','x-push-secret', s.secret),
      body := jsonb_build_object('record', to_jsonb(new)));
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists notifications_push_ins on public.notifications;
create trigger notifications_push_ins after insert on public.notifications for each row execute function public.trg_push_send();
drop trigger if exists notifications_push_upd on public.notifications;
create trigger notifications_push_upd after update of body, created_at on public.notifications
  for each row when (old.created_at is distinct from new.created_at) execute function public.trg_push_send();

-- ---------- تریگرها ----------
create or replace function public.trg_n_miss() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notify(public.push_other(new.author), 'miss', '💗 دلتنگی', new.author || ' دلش برایت تنگ شده 💗', 'miss:' || new.id);
  return new;
end $$;
drop trigger if exists n_miss on public.miss_you;
create trigger n_miss after insert on public.miss_you for each row execute function public.trg_n_miss();

create or replace function public.trg_n_mood() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notify(public.push_other(new.author), 'mood', '🌈 حال امروز ' || new.author,
    new.mood || case when coalesce(new.note,'') <> '' then ' — ' || new.note else '' end, 'mood:' || new.author || ':' || new.day);
  return new;
end $$;
drop trigger if exists n_mood_i on public.mood_entries;
create trigger n_mood_i after insert on public.mood_entries for each row execute function public.trg_n_mood();
drop trigger if exists n_mood_u on public.mood_entries;
create trigger n_mood_u after update of mood, note on public.mood_entries for each row
  when (old.mood is distinct from new.mood or old.note is distinct from new.note) execute function public.trg_n_mood();

create or replace function public.trg_n_letter() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notify(public.push_other(new.author), 'letter', '💌 نامهٔ تازه از ' || new.author, new.title, 'letter:' || new.id);
  return new;
end $$;
drop trigger if exists n_letter on public.love_letters;
create trigger n_letter after insert on public.love_letters for each row execute function public.trg_n_letter();

create or replace function public.trg_n_guest() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notify(public.push_other(new.author), 'guest', '📖 ' || new.author || ' در دفترچه نوشت', new.body, 'guest:' || new.id);
  return new;
end $$;
drop trigger if exists n_guest on public.guestbook_entries;
create trigger n_guest after insert on public.guestbook_entries for each row execute function public.trg_n_guest();

create or replace function public.trg_n_answer() returns trigger language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  perform public.push_notify(public.push_other(new.author), 'answer', '❓ ' || new.author || ' به سؤال امروز جواب داد',
    'تو هم جواب بده تا جواب‌ها باز شود 🤍', 'answer:' || new.question_id || ':' || new.author);
  select count(distinct author) into n from public.daily_answers where question_id = new.question_id;
  if n = 2 then
    perform public.push_notify('ماجی', 'answer', '❓ جواب‌های امروز باز شد', 'هر دو جواب داده‌اید؛ بیا ببین 💞', 'open:' || new.question_id || ':ماجی');
    perform public.push_notify('محمد', 'answer', '❓ جواب‌های امروز باز شد', 'هر دو جواب داده‌اید؛ بیا ببین 💞', 'open:' || new.question_id || ':محمد');
  end if;
  return new;
end $$;
drop trigger if exists n_answer on public.daily_answers;
create trigger n_answer after insert on public.daily_answers for each row execute function public.trg_n_answer();

create or replace function public.trg_n_capsule() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notify(public.push_other(new.author), 'capsule', '⏳ صندوقچهٔ زمانی تازه', new.author || ' یک پیام مهر و موم‌شده برایتان گذاشت 🔒', 'cap:' || new.id);
  return new;
end $$;
drop trigger if exists n_capsule on public.time_capsules;
create trigger n_capsule after insert on public.time_capsules for each row execute function public.trg_n_capsule();

create or replace function public.trg_n_score() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notify(public.push_other(new.author), 'quiz', '💗 آزمون دونفره', new.author || ' در آزمون ' || new.correct || ' از ' || new.total || ' گرفت 🏆', 'quiz:' || new.id);
  return new;
end $$;
drop trigger if exists n_score on public.quiz_scores;
create trigger n_score after insert on public.quiz_scores for each row execute function public.trg_n_score();

-- محتوای اضافه‌شده توسط مدیر (محمد) برای ماجی
create or replace function public.trg_n_admin_content() returns trigger language plpgsql security definer set search_path = public as $$
declare t text := tg_table_name;
begin
  if t = 'gallery_photos' then perform public.push_notify('ماجی','photo','📸 عکس تازه', coalesce(new.title,''), 'photo:' || new.id);
  elsif t = 'gallery_videos' then perform public.push_notify('ماجی','video','🎬 ویدئوی تازه', new.title, 'video:' || new.id);
  elsif t = 'private_messages' then perform public.push_notify('ماجی','pm','🔐 پیام خصوصی تازه', case when new.is_surprise then 'یک سورپرایز برایت گذاشته‌ام ✨' else 'یک پیام تازه برایت هست 🤍' end, 'pm:' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists n_photo on public.gallery_photos;
create trigger n_photo after insert on public.gallery_photos for each row execute function public.trg_n_admin_content();
drop trigger if exists n_video on public.gallery_videos;
create trigger n_video after insert on public.gallery_videos for each row execute function public.trg_n_admin_content();
drop trigger if exists n_pm on public.private_messages;
create trigger n_pm after insert on public.private_messages for each row execute function public.trg_n_admin_content();

create or replace function public.trg_n_item() returns trigger language plpgsql security definer set search_path = public as $$
declare a text; label text;
begin
  if new.kind in ('dquestion','final') then return new; end if;
  a := coalesce(new.extra->>'author', new.extra->>'from', 'محمد');
  if a not in ('ماجی','محمد') then a := 'محمد'; end if;
  label := case new.kind
    when 'wish' then '🌠 آرزوی تازه' when 'coupon' then '🎟️ کوپن تازه' when 'album' then '📷 عکس تازه در آلبوم'
    when 'timeline' then '🕰️ لحظهٔ تازه در خط زمانی' when 'reason' then '💕 یک دلیل تازه' when 'song' then '🎶 آهنگ تازه'
    when 'voice' then '🎙️ پیام صوتی تازه' when 'funny' then '😂 لحظهٔ خنده‌دار تازه' when 'learned' then '🌱 یک چیز تازه'
    when 'promise' then '🤝 قول تازه' when 'whenever' then '🫂 پاکت تازه' else '✨ چیز تازه' end;
  perform public.push_notify(public.push_other(a), 'item', label, coalesce(nullif(new.title,''), new.body, ''), 'item:' || new.id);
  return new;
end $$;
drop trigger if exists n_item on public.site_items;
create trigger n_item after insert on public.site_items for each row execute function public.trg_n_item();

create or replace function public.trg_n_item_upd() returns trigger language plpgsql security definer set search_path = public as $$
declare a text;
begin
  if new.kind = 'coupon' and new.done and not old.done then
    a := coalesce(new.extra->>'from', 'محمد');
    perform public.push_notify(a, 'coupon', '🎟️ کوپن استفاده شد', coalesce(new.extra->>'claimed_by','') || ' کوپن «' || coalesce(new.title,'') || '» را استفاده کرد', 'claim:' || new.id);
  elsif new.kind = 'wish' and new.done and not old.done then
    perform public.push_notify('ماجی', 'wish', '🌠 یک آرزو محقق شد', coalesce(new.title,''), 'wishdone:' || new.id || ':ماجی');
    perform public.push_notify('محمد', 'wish', '🌠 یک آرزو محقق شد', coalesce(new.title,''), 'wishdone:' || new.id || ':محمد');
  end if;
  return new;
end $$;
drop trigger if exists n_item_upd on public.site_items;
create trigger n_item_upd after update on public.site_items for each row execute function public.trg_n_item_upd();

-- ---------- توابع برای صفحه ----------
create or replace function public.save_push_subscription(p_access_code text, p_who text, p_endpoint text, p_p256dh text, p_auth text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) > 1000 then return false; end if;
  insert into public.push_subscriptions(who, endpoint, p256dh, auth) values (p_who, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set who = excluded.who, p256dh = excluded.p256dh, auth = excluded.auth;
  return true;
end $$;
revoke all on function public.save_push_subscription(text,text,text,text,text) from public;
grant execute on function public.save_push_subscription(text,text,text,text,text) to anon, authenticated;

create or replace function public.remove_push_subscription(p_access_code text, p_endpoint text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return false; end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  return true;
end $$;
revoke all on function public.remove_push_subscription(text,text) from public;
grant execute on function public.remove_push_subscription(text,text) to anon, authenticated;

create or replace function public.get_notifications(p_access_code text, p_who text, p_limit integer default 30)
returns table(id uuid, kind text, title text, body text, url text, created_at timestamptz, seen_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return; end if;
  return query select n.id, n.kind, n.title, n.body, n.url, n.created_at, n.seen_at
    from public.notifications n where n.to_who = p_who order by n.created_at desc limit least(greatest(p_limit,1),60);
end $$;
revoke all on function public.get_notifications(text,text,integer) from public;
grant execute on function public.get_notifications(text,text,integer) to anon, authenticated;

create or replace function public.mark_notifications_seen(p_access_code text, p_who text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  update public.notifications set seen_at = now() where to_who = p_who and seen_at is null;
  return true;
end $$;
revoke all on function public.mark_notifications_seen(text,text) from public;
grant execute on function public.mark_notifications_seen(text,text) to anon, authenticated;

-- ---------- بررسی روزانه (سالگرد، ماهگرد، روز دیدار، باز شدن صندوقچه) ----------
-- ساعت ۰۹:۰۰ به وقت تهران = ۰۵:۳۰ UTC
do $$ begin
  perform cron.unschedule('me-and-you-daily');
exception when others then null; end $$;
select cron.schedule('me-and-you-daily', '30 5 * * *', $cron$
  select net.http_post(
    url := (select function_url from public.push_settings where id = 1),
    headers := jsonb_build_object('Content-Type','application/json','x-push-secret',(select secret from public.push_settings where id = 1)),
    body := '{"mode":"daily"}'::jsonb);
$cron$);
