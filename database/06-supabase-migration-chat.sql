-- ME & YOU — چت خصوصی دونفره (متن، ویرایش، حذف، ریپلای، ریکشن، ویس، ویدئو، عکس). قابل اجرای مجدد.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('ماجی','محمد')),
  body text not null default '',
  created_at timestamptz not null default now()
);
alter table public.chat_messages drop constraint if exists chat_messages_body_check;
alter table public.chat_messages add column if not exists kind text not null default 'text';
alter table public.chat_messages add column if not exists media text;
alter table public.chat_messages add column if not exists dur integer;
alter table public.chat_messages add column if not exists reply_to uuid;
alter table public.chat_messages add column if not exists reactions jsonb not null default '{}'::jsonb;
alter table public.chat_messages add column if not exists edited_at timestamptz;
alter table public.chat_messages add column if not exists deleted_at timestamptz;
alter table public.chat_messages add column if not exists seen_at timestamptz;
alter table public.chat_messages add column if not exists pinned boolean not null default false;
alter table public.chat_messages add column if not exists starred jsonb not null default '[]'::jsonb;
alter table public.chat_messages add column if not exists expires_at timestamptz;
create table if not exists public.chat_settings (id integer primary key default 1 check (id = 1), ttl_seconds integer not null default 0);
insert into public.chat_settings(id, ttl_seconds) values (1, 0) on conflict (id) do nothing;
alter table public.chat_settings enable row level security;
alter table public.chat_messages drop constraint if exists chat_messages_kind_check;
alter table public.chat_messages add constraint chat_messages_kind_check check (kind in ('text','voice','video','image'));
alter table public.chat_messages drop constraint if exists chat_messages_len_check;
alter table public.chat_messages add constraint chat_messages_len_check check (char_length(body) <= 2000);
create index if not exists chat_messages_created_idx on public.chat_messages(created_at desc);
alter table public.chat_messages enable row level security;

-- ---------- ذخیره‌سازی فایل‌های چت ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', true, 31457280,
  array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/aac','audio/x-m4a','audio/wav','video/webm','video/mp4','video/quicktime','video/3gpp','image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = true, file_size_limit = 31457280, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Chat media public read" on storage.objects;
create policy "Chat media public read" on storage.objects for select to anon, authenticated using (bucket_id = 'chat-media');
drop policy if exists "Chat media upload" on storage.objects;
create policy "Chat media upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'chat-media');

-- ---------- توابع ----------
drop function if exists public.send_chat(text,text,text);
drop function if exists public.send_chat(text,text,text,text,text,uuid,integer);
drop function if exists public.get_chat(text,integer,timestamptz);
drop function if exists public.pin_chat(text,text,uuid,boolean);
drop function if exists public.star_chat(text,text,uuid);
drop function if exists public.set_chat_ttl(text,text,integer);
drop function if exists public.get_chat_settings(text);

create or replace function public.send_chat(p_access_code text, p_who text, p_body text,
  p_kind text default 'text', p_media text default null, p_reply uuid default null, p_dur integer default null)
returns table(id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
declare b text := btrim(coalesce(p_body,'')); r record; k text := coalesce(p_kind,'text'); ttl integer;
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return; end if;
  if k not in ('text','voice','video','image') then return; end if;
  if k = 'text' and (char_length(b) = 0 or char_length(b) > 2000) then return; end if;
  if k <> 'text' and (p_media is null or p_media !~ '^[A-Za-z0-9._/-]{3,200}$') then return; end if;
  if char_length(b) > 2000 then return; end if;
  if (select count(*) from public.chat_messages m where m.author = p_who and m.created_at > now() - interval '1 minute') >= 40 then return; end if;
  select s.ttl_seconds into ttl from public.chat_settings s where s.id = 1;
  insert into public.chat_messages(author, body, kind, media, dur, reply_to, expires_at)
  values (p_who, b, k, case when k = 'text' then null else p_media end, case when k in ('voice','video') then least(coalesce(p_dur,0), 3600) end,
          (select m.id from public.chat_messages m where m.id = p_reply),
          case when coalesce(ttl,0) > 0 then now() + make_interval(secs => ttl) end)
  returning chat_messages.id, chat_messages.created_at into r;
  return query select r.id, r.created_at;
end $$;
revoke all on function public.send_chat(text,text,text,text,text,uuid,integer) from public;
grant execute on function public.send_chat(text,text,text,text,text,uuid,integer) to anon, authenticated;

create or replace function public.get_chat(p_access_code text, p_limit integer default 100, p_before timestamptz default null)
returns table(id uuid, author text, body text, kind text, media text, dur integer, reply_to uuid, reactions jsonb,
              edited_at timestamptz, deleted_at timestamptz, seen_at timestamptz, created_at timestamptz,
              pinned boolean, starred jsonb, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  delete from public.chat_messages cm where cm.expires_at is not null and cm.expires_at <= now();
  return query select m.id, m.author, m.body, m.kind, m.media, m.dur, m.reply_to, m.reactions,
                      m.edited_at, m.deleted_at, m.seen_at, m.created_at, m.pinned, m.starred, m.expires_at
    from public.chat_messages m
    where p_before is null or m.created_at < p_before
    order by m.created_at desc limit least(greatest(p_limit,1),300);
end $$;
revoke all on function public.get_chat(text,integer,timestamptz) from public;
grant execute on function public.get_chat(text,integer,timestamptz) to anon, authenticated;

create or replace function public.edit_chat(p_access_code text, p_who text, p_id uuid, p_body text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare b text := btrim(coalesce(p_body,''));
begin
  if not public.verify_access_code(p_access_code) or char_length(b) = 0 or char_length(b) > 2000 then return false; end if;
  update public.chat_messages set body = b, edited_at = now()
   where id = p_id and author = p_who and kind = 'text' and deleted_at is null;
  return found;
end $$;
revoke all on function public.edit_chat(text,text,uuid,text) from public;
grant execute on function public.edit_chat(text,text,uuid,text) to anon, authenticated;

create or replace function public.delete_chat(p_access_code text, p_who text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return false; end if;
  update public.chat_messages set body = '', media = null, dur = null, reactions = '{}'::jsonb, deleted_at = now()
   where id = p_id and author = p_who and deleted_at is null;
  return found;
end $$;
revoke all on function public.delete_chat(text,text,uuid) from public;
grant execute on function public.delete_chat(text,text,uuid) to anon, authenticated;

-- هر نفر روی هر پیام یک ایموجی دارد؛ دوباره زدن همان ایموجی، آن را برمی‌دارد
create or replace function public.react_chat(p_access_code text, p_who text, p_id uuid, p_emoji text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare cur jsonb; k text; res jsonb := '{}'::jsonb; had boolean := false; arr jsonb;
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  if p_emoji is null or char_length(p_emoji) = 0 or char_length(p_emoji) > 16 then return false; end if;
  select reactions into cur from public.chat_messages where id = p_id and deleted_at is null for update;
  if not found then return false; end if;
  for k, arr in select * from jsonb_each(cur) loop
    if arr ? p_who then
      had := had or (k = p_emoji);
      arr := arr - p_who;
    end if;
    if jsonb_array_length(arr) > 0 then res := res || jsonb_build_object(k, arr); end if;
  end loop;
  if not had then res := jsonb_set(res, array[p_emoji], coalesce(res -> p_emoji, '[]'::jsonb) || to_jsonb(p_who), true); end if;
  update public.chat_messages set reactions = res where id = p_id;
  return true;
end $$;
revoke all on function public.react_chat(text,text,uuid,text) from public;
grant execute on function public.react_chat(text,text,uuid,text) to anon, authenticated;

create or replace function public.seen_chat(p_access_code text, p_who text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  update public.chat_messages set seen_at = now() where author <> p_who and seen_at is null and deleted_at is null;
  return true;
end $$;
revoke all on function public.seen_chat(text,text) from public;
grant execute on function public.seen_chat(text,text) to anon, authenticated;

create or replace function public.pin_chat(p_access_code text, p_who text, p_id uuid, p_pin boolean)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  update public.chat_messages set pinned = coalesce(p_pin, false) where id = p_id and deleted_at is null;
  return found;
end $$;
revoke all on function public.pin_chat(text,text,uuid,boolean) from public;
grant execute on function public.pin_chat(text,text,uuid,boolean) to anon, authenticated;

-- ستاره‌دار کردن شخصی است (هر نفر ستارهٔ خودش را دارد)؛ دوباره زدن آن را برمی‌دارد
create or replace function public.star_chat(p_access_code text, p_who text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  update public.chat_messages
     set starred = case when starred ? p_who then starred - p_who else starred || to_jsonb(p_who) end
   where id = p_id and deleted_at is null;
  return found;
end $$;
revoke all on function public.star_chat(text,text,uuid) from public;
grant execute on function public.star_chat(text,text,uuid) to anon, authenticated;

-- پیام‌های محوشونده: ۰ = خاموش، وگرنه تعداد ثانیه (فقط پیام‌های بعد از تنظیم اثر می‌گیرند)
create or replace function public.set_chat_ttl(p_access_code text, p_who text, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  if p_seconds not in (0, 3600, 86400, 604800) then return false; end if;
  update public.chat_settings set ttl_seconds = p_seconds where id = 1;
  return true;
end $$;
revoke all on function public.set_chat_ttl(text,text,integer) from public;
grant execute on function public.set_chat_ttl(text,text,integer) to anon, authenticated;

create or replace function public.get_chat_settings(p_access_code text)
returns table(ttl_seconds integer)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select s.ttl_seconds from public.chat_settings s where s.id = 1;
end $$;
revoke all on function public.get_chat_settings(text) from public;
grant execute on function public.get_chat_settings(text) to anon, authenticated;

-- اعلان پیام تازه (اگر migration اعلان‌ها اجرا شده باشد)
create or replace function public.trg_n_chat() returns trigger language plpgsql security definer set search_path = public as $$
declare txt text;
begin
  txt := case new.kind when 'voice' then '🎤 پیام صوتی' when 'video' then '🎥 ویدئو مسیج' when 'image' then '🖼️ عکس' else new.body end;
  begin
    perform public.push_notify(public.push_other(new.author), 'chat', '💬 ' || new.author, txt, 'chat:' || new.id);
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_chat on public.chat_messages;
create trigger n_chat after insert on public.chat_messages for each row execute function public.trg_n_chat();
