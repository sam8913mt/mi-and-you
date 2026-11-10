-- ME & YOU — migration for the extra sections (timeline, reasons, wishes, songs, voice,
-- funny moments, learned, coupons, promises, "when you're sad", guestbook, final surprise).
-- Run AFTER supabase_setup.sql and supabase-migration.sql. Safe to re-run; nothing is dropped.

-- ---------------------------------------------------------------------------
-- 1) One generic table for all list-style content
-- ---------------------------------------------------------------------------
create table if not exists public.site_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('timeline','reason','wish','song','voice','funny','learned','coupon','promise','whenever','final')),
  title text not null default '' check (char_length(title) <= 300),
  body text not null default '' check (char_length(body) <= 10000),
  extra jsonb not null default '{}'::jsonb,
  done boolean not null default false,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_items_kind_order_idx on public.site_items(kind, sort_order, created_at);
alter table public.site_items enable row level security;

-- Visitors can read everything except the final surprise (it is released by a function on the meeting date).
drop policy if exists "Public can read site items" on public.site_items;
create policy "Public can read site items" on public.site_items
  for select to anon, authenticated using (kind <> 'final');
drop policy if exists "Admins manage site items" on public.site_items;
create policy "Admins manage site items" on public.site_items
  for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
grant select on public.site_items to anon, authenticated;
grant insert, update, delete on public.site_items to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Guestbook (read/write only through functions that check the shared code)
-- ---------------------------------------------------------------------------
create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('ماجی','محمد')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists guestbook_created_idx on public.guestbook_entries(created_at);
alter table public.guestbook_entries enable row level security;
drop policy if exists "Admins manage guestbook" on public.guestbook_entries;
create policy "Admins manage guestbook" on public.guestbook_entries
  for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
grant select, insert, update, delete on public.guestbook_entries to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Functions
-- ---------------------------------------------------------------------------
create or replace function public.verify_access_code(p_access_code text)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (
    select 1 from public.private_message_access a
    where a.singleton = true and crypt(coalesce(p_access_code,''), a.password_hash) = a.password_hash
  );
$$;
revoke all on function public.verify_access_code(text) from public;
grant execute on function public.verify_access_code(text) to anon, authenticated;

create or replace function public.get_guestbook(p_access_code text)
returns table(id uuid, author text, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select g.id, g.author, g.body, g.created_at from public.guestbook_entries g order by g.created_at asc;
end; $$;
revoke all on function public.get_guestbook(text) from public;
grant execute on function public.get_guestbook(text) to anon, authenticated;

create or replace function public.add_guestbook_entry(p_access_code text, p_author text, p_body text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return false; end if;
  if p_author not in ('ماجی','محمد') then return false; end if;
  if p_body is null or char_length(btrim(p_body)) = 0 or char_length(p_body) > 2000 then return false; end if;
  insert into public.guestbook_entries(author, body) values (p_author, btrim(p_body));
  return true;
end; $$;
revoke all on function public.add_guestbook_entry(text,text,text) from public;
grant execute on function public.add_guestbook_entry(text,text,text) to anon, authenticated;

create or replace function public.claim_coupon(p_id uuid, p_access_code text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return false; end if;
  update public.site_items
     set done = true, extra = extra || jsonb_build_object('claimed_at', now()), updated_at = now()
   where id = p_id and kind = 'coupon' and done = false;
  return found;
end; $$;
revoke all on function public.claim_coupon(uuid,text) from public;
grant execute on function public.claim_coupon(uuid,text) to anon, authenticated;

-- The final surprise stays invisible until the meeting date (site_content.meeting_date) has passed.
create or replace function public.get_final_surprise()
returns table(id uuid, title text, body text)
language plpgsql stable security definer set search_path = public as $$
declare d timestamptz;
begin
  begin
    select value::timestamptz into d from public.site_content where key = 'meeting_date';
  exception when others then d := null;
  end;
  if d is null or now() < d then return; end if;
  return query select i.id, i.title, i.body from public.site_items i where i.kind = 'final' order by i.sort_order, i.created_at;
end; $$;
revoke all on function public.get_final_surprise() from public;
grant execute on function public.get_final_surprise() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Allow short voice messages in the existing public "videos" bucket
-- ---------------------------------------------------------------------------
update storage.buckets
   set allowed_mime_types = array['video/mp4','video/webm','video/ogg','image/jpeg','image/png','image/webp',
                                  'audio/mpeg','audio/mp4','audio/x-m4a','audio/aac','audio/webm','audio/ogg','audio/wav','audio/x-wav']
 where id = 'videos';
