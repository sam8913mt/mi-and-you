-- ME & YOU Phase 2 additive migration. Review before running in Supabase SQL Editor.
-- Prerequisite: run the existing supabase_setup.sql first (provides pgcrypto and public.is_site_admin()).
-- No existing rows/tables are dropped or rewritten. Run once (safe to re-run).

create table if not exists public.gallery_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  storage_path text not null unique,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.love_letters (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 30000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 10000),
  is_surprise boolean not null default false,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 500),
  options jsonb not null check (case when jsonb_typeof(options) = 'array' then jsonb_array_length(options) between 2 and 8 else false end),
  correct_index integer not null check (case when jsonb_typeof(options) = 'array' then correct_index >= 0 and correct_index < jsonb_array_length(options) else false end),
  active boolean not null default true,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_videos_created_idx on public.gallery_videos(created_at desc);
create index if not exists love_letters_created_idx on public.love_letters(created_at desc);
create index if not exists quiz_questions_active_order_idx on public.quiz_questions(active, sort_order);
create index if not exists private_messages_created_idx on public.private_messages(created_at desc);

alter table public.gallery_videos enable row level security;
alter table public.love_letters enable row level security;
alter table public.private_messages enable row level security;
alter table public.quiz_questions enable row level security;

-- Public content is read-only to visitors; all writes require an allowlisted admin.
drop policy if exists "Public can read videos" on public.gallery_videos;
create policy "Public can read videos" on public.gallery_videos for select to anon, authenticated using (true);
drop policy if exists "Admins manage videos" on public.gallery_videos;
create policy "Admins manage videos" on public.gallery_videos for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Public can read letters" on public.love_letters;
create policy "Public can read letters" on public.love_letters for select to anon, authenticated using (true);
drop policy if exists "Admins manage letters" on public.love_letters;
create policy "Admins manage letters" on public.love_letters for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

-- Private messages are intentionally admin-only. The current public site has no visitor
-- authentication, so exposing these rows to anon would not be private or secure.
drop policy if exists "Admins only private messages" on public.private_messages;
create policy "Admins only private messages" on public.private_messages for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Public can read active quiz" on public.quiz_questions;
drop policy if exists "Admins read quiz" on public.quiz_questions;
create policy "Admins read quiz" on public.quiz_questions for select to authenticated using (public.is_site_admin());
create or replace view public.public_quiz_questions as
  select id, question, options, sort_order from public.quiz_questions where active = true;
grant select on public.public_quiz_questions to anon, authenticated;
drop policy if exists "Admins manage quiz" on public.quiz_questions;
create policy "Admins manage quiz" on public.quiz_questions for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

grant select on public.gallery_videos, public.love_letters to anon, authenticated;
grant insert, update, delete on public.gallery_videos, public.love_letters to authenticated;
grant select, insert, update, delete on public.quiz_questions to authenticated;
grant select, insert, update, delete on public.private_messages to authenticated;

-- Public playback, admin-only upload/update/delete. 100 MiB maximum per video.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 104857600, array['video/mp4','video/webm','video/ogg','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 104857600,
  allowed_mime_types = array['video/mp4','video/webm','video/ogg','image/jpeg','image/png','image/webp'];

drop policy if exists "Public can view video assets" on storage.objects;
create policy "Public can view video assets" on storage.objects for select to anon, authenticated using (bucket_id = 'videos');
drop policy if exists "Admins upload video assets" on storage.objects;
create policy "Admins upload video assets" on storage.objects for insert to authenticated with check (bucket_id = 'videos' and public.is_site_admin());
drop policy if exists "Admins update video assets" on storage.objects;
create policy "Admins update video assets" on storage.objects for update to authenticated using (bucket_id = 'videos' and public.is_site_admin()) with check (bucket_id = 'videos' and public.is_site_admin());
drop policy if exists "Admins delete video assets" on storage.objects;
create policy "Admins delete video assets" on storage.objects for delete to authenticated using (bucket_id = 'videos' and public.is_site_admin());

comment on table public.private_messages is 'Admin-only content; do not grant anon access without adding real visitor authentication.';
comment on column public.site_content.value is 'meeting_date key stores an ISO-8601 date/time string; no new column required.';


-- Check an answer without exposing correct_index through the public REST API.
create or replace function public.check_quiz_answer(p_question_id uuid, p_answer_index integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (q.correct_index = p_answer_index)
  from public.quiz_questions q
  where q.id = p_question_id and q.active = true;
$$;
revoke all on function public.check_quiz_answer(uuid, integer) from public;
grant execute on function public.check_quiz_answer(uuid, integer) to anon, authenticated;


-- Shared passphrase gate for the couple's private-message area. Store only a bcrypt hash.
create table if not exists public.private_message_access (
  singleton boolean primary key default true check (singleton = true),
  password_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.private_message_access enable row level security;
drop policy if exists "Admins manage private message access" on public.private_message_access;
create policy "Admins manage private message access" on public.private_message_access
  for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
grant select, insert, update, delete on public.private_message_access to authenticated;

create or replace function public.set_private_message_password(p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_site_admin() then raise exception 'not authorized'; end if;
  if p_password is null or char_length(p_password) < 8 or char_length(p_password) > 128 then
    raise exception 'passphrase must be 8 to 128 characters';
  end if;
  insert into public.private_message_access(singleton,password_hash,updated_at)
  values (true, crypt(p_password, gen_salt('bf')), now())
  on conflict (singleton) do update set password_hash=excluded.password_hash, updated_at=now();
end; $$;
revoke all on function public.set_private_message_password(text) from public;
grant execute on function public.set_private_message_password(text) to authenticated;

create or replace function public.get_private_messages(p_access_code text)
returns table(id uuid,title text,body text,is_surprise boolean,opened_at timestamptz,created_at timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  select m.id,m.title,m.body,m.is_surprise,m.opened_at,m.created_at
  from public.private_messages m
  join public.private_message_access a on a.singleton = true
  where crypt(coalesce(p_access_code,''), a.password_hash) = a.password_hash
  order by m.created_at desc;
$$;
revoke all on function public.get_private_messages(text) from public;
grant execute on function public.get_private_messages(text) to anon, authenticated;


create or replace function public.mark_private_message_opened(p_message_id uuid, p_access_code text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare allowed boolean;
begin
  select exists(select 1 from public.private_message_access a
    where a.singleton=true and crypt(coalesce(p_access_code,''),a.password_hash)=a.password_hash) into allowed;
  if not allowed then return false; end if;
  update public.private_messages set opened_at=coalesce(opened_at,now()) where id=p_message_id;
  return found;
end; $$;
revoke all on function public.mark_private_message_opened(uuid,text) from public;
grant execute on function public.mark_private_message_opened(uuid,text) to anon, authenticated;
