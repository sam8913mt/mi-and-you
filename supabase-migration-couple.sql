-- ME & YOU — migration for the TWO-WAY features (both partners write):
-- authors on content, read receipts, shared wish ticks, two-way coupons, daily question,
-- mood diary, time capsule, quiz scores, miss-you button, shared album.
-- Run AFTER supabase_setup.sql, supabase-migration.sql and supabase-migration-more.sql. Safe to re-run.
-- Identity note: the site has no per-person login, so "who I am" is chosen by the visitor and
-- every write goes through the shared access code. That is fine for a couple, not for strangers.

-- ---------------------------------------------------------------------------
-- 1) Authors on existing content
-- ---------------------------------------------------------------------------
alter table public.love_letters add column if not exists author text not null default 'محمد';
alter table public.love_letters drop constraint if exists love_letters_author_check;
alter table public.love_letters add constraint love_letters_author_check check (author in ('ماجی','محمد'));
alter table public.love_letters add column if not exists read_at timestamptz;

alter table public.quiz_questions add column if not exists author text;
alter table public.quiz_questions drop constraint if exists quiz_questions_author_check;
alter table public.quiz_questions add constraint quiz_questions_author_check check (author is null or author in ('ماجی','محمد'));
create or replace view public.public_quiz_questions as
  select id, question, options, sort_order, author from public.quiz_questions where active = true;
grant select on public.public_quiz_questions to anon, authenticated;

-- two new list kinds: daily questions and the shared album
alter table public.site_items drop constraint if exists site_items_kind_check;
alter table public.site_items add constraint site_items_kind_check check (kind in
  ('timeline','reason','wish','song','voice','funny','learned','coupon','promise','whenever','final','dquestion','album'));

-- starter daily questions (only when none exist yet)
insert into public.site_items(kind, body, sort_order)
select 'dquestion', q, ord from unnest(array[
  'کدام لحظهٔ ما را هیچ‌وقت فراموش نمی‌کنی؟',
  'امروز چه چیزی تو را خندانده؟',
  'اگر فردا یک روز کامل با هم بودیم، دوست داری چه کار کنیم؟',
  'چه چیزی از من هنوز تو را غافلگیر می‌کند؟',
  'یک آهنگ که امروز یاد من افتادی؟',
  'کدام غذا را دوست داری با هم درست کنیم؟',
  'کوچک‌ترین کاری که حالت را خوب می‌کند چیست؟',
  'اولین چیزی که دربارهٔ من توجهت را جلب کرد چه بود؟',
  'یک آرزوی کوچک که دوست داری برآورده شود؟',
  'اگر می‌توانستیم به یک شهر سفر کنیم، کجا؟',
  'چه جمله‌ای از من هیچ‌وقت یادت نمی‌رود؟',
  'امروز برای چه چیزی سپاسگزاری؟',
  'یک عادت من که دوستش داری؟',
  'اگر یک نامه به خودِ پنج سال بعدمان بنویسیم، اولش چه می‌نویسی؟',
  'چه چیزی هست که دوست داری بیشتر با هم انجام دهیم؟'
]) with ordinality as t(q, ord)
where not exists (select 1 from public.site_items where kind = 'dquestion');

-- ---------------------------------------------------------------------------
-- 2) New tables (no public access; only the functions below + admins)
-- ---------------------------------------------------------------------------
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('ماجی','محمد')),
  day date not null,
  mood text not null check (char_length(mood) between 1 and 8),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (author, day)
);
create table if not exists public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.site_items(id) on delete cascade,
  author text not null check (author in ('ماجی','محمد')),
  answer text not null check (char_length(answer) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique (question_id, author)
);
create table if not exists public.miss_you (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('ماجی','محمد')),
  created_at timestamptz not null default now()
);
create table if not exists public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('ماجی','محمد')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 10000),
  unlock_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists public.quiz_scores (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('ماجی','محمد')),
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0),
  created_at timestamptz not null default now()
);

alter table public.mood_entries enable row level security;
alter table public.daily_answers enable row level security;
alter table public.miss_you enable row level security;
alter table public.time_capsules enable row level security;
alter table public.quiz_scores enable row level security;

drop policy if exists "Admins manage moods" on public.mood_entries;
create policy "Admins manage moods" on public.mood_entries for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "Admins manage daily answers" on public.daily_answers;
create policy "Admins manage daily answers" on public.daily_answers for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "Admins manage miss you" on public.miss_you;
create policy "Admins manage miss you" on public.miss_you for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "Admins manage quiz scores" on public.quiz_scores;
create policy "Admins manage quiz scores" on public.quiz_scores for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
-- Capsules stay sealed even for admins: they may only delete a row (no select policy).
drop policy if exists "Admins delete capsules" on public.time_capsules;
create policy "Admins delete capsules" on public.time_capsules for delete to authenticated using (public.is_site_admin());

grant select, insert, update, delete on public.mood_entries, public.daily_answers, public.miss_you, public.quiz_scores to authenticated;
grant delete on public.time_capsules to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Functions (every one checks the shared access code unless noted)
-- ---------------------------------------------------------------------------
-- letters: read receipt (no code; ignored when the reader is the author)
create or replace function public.mark_letter_read(p_id uuid, p_reader text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_reader not in ('ماجی','محمد') then return false; end if;
  update public.love_letters set read_at = coalesce(read_at, now()) where id = p_id and author <> p_reader;
  return found;
end; $$;
revoke all on function public.mark_letter_read(uuid,text) from public;
grant execute on function public.mark_letter_read(uuid,text) to anon, authenticated;

-- wishes: each partner ticks their own heart; both ticked => done
create or replace function public.tick_wish(p_access_code text, p_id uuid, p_who text, p_value boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t jsonb; both_ok boolean;
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return null; end if;
  update public.site_items
     set extra = jsonb_set(coalesce(extra,'{}'::jsonb), '{ticks}', coalesce(extra->'ticks','{}'::jsonb) || jsonb_build_object(p_who, p_value)),
         updated_at = now()
   where id = p_id and kind = 'wish'
   returning extra->'ticks' into t;
  if t is null then return null; end if;
  both_ok := coalesce((t->>'ماجی')::boolean,false) and coalesce((t->>'محمد')::boolean,false);
  update public.site_items set done = both_ok where id = p_id;
  return t || jsonb_build_object('done', both_ok);
end; $$;
revoke all on function public.tick_wish(text,uuid,text,boolean) from public;
grant execute on function public.tick_wish(text,uuid,text,boolean) to anon, authenticated;

create or replace function public.add_wish(p_access_code text, p_who text, p_title text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare nid uuid;
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return null; end if;
  if p_title is null or char_length(btrim(p_title)) = 0 or char_length(p_title) > 300 then return null; end if;
  insert into public.site_items(kind, title, extra, sort_order)
  values ('wish', btrim(p_title), jsonb_build_object('author', p_who), (extract(epoch from now())*1000)::bigint)
  returning id into nid;
  return nid;
end; $$;
revoke all on function public.add_wish(text,text,text) from public;
grant execute on function public.add_wish(text,text,text) to anon, authenticated;

-- coupons: only the recipient (not the creator) can claim
drop function if exists public.claim_coupon(uuid, text);
create or replace function public.claim_coupon(p_id uuid, p_access_code text, p_who text default null)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return false; end if;
  update public.site_items
     set done = true, extra = extra || jsonb_build_object('claimed_at', now(), 'claimed_by', p_who), updated_at = now()
   where id = p_id and kind = 'coupon' and done = false
     and (p_who is null or coalesce(extra->>'from','محمد') <> p_who);
  return found;
end; $$;
revoke all on function public.claim_coupon(uuid,text,text) from public;
grant execute on function public.claim_coupon(uuid,text,text) to anon, authenticated;

-- mood diary
create or replace function public.set_mood(p_access_code text, p_author text, p_day date, p_mood text, p_note text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare today date := (now() at time zone 'Asia/Tehran')::date;
begin
  if not public.verify_access_code(p_access_code) or p_author not in ('ماجی','محمد') then return false; end if;
  if p_day < today - 1 or p_day > today + 1 then return false; end if;
  if p_mood is null or char_length(p_mood) = 0 or char_length(p_mood) > 8 then return false; end if;
  insert into public.mood_entries(author, day, mood, note) values (p_author, p_day, p_mood, left(coalesce(p_note,''),500))
  on conflict (author, day) do update set mood = excluded.mood, note = excluded.note;
  return true;
end; $$;
revoke all on function public.set_mood(text,text,date,text,text) from public;
grant execute on function public.set_mood(text,text,date,text,text) to anon, authenticated;

create or replace function public.get_moods(p_access_code text, p_days integer default 30)
returns table(author text, day date, mood text, note text)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select m.author, m.day, m.mood, m.note from public.mood_entries m
   where m.day >= (now() at time zone 'Asia/Tehran')::date - least(greatest(p_days,1),120) order by m.day;
end; $$;
revoke all on function public.get_moods(text,integer) from public;
grant execute on function public.get_moods(text,integer) to anon, authenticated;

-- daily question: the other person's answer appears only after both have answered
create or replace function public.submit_daily_answer(p_access_code text, p_qid uuid, p_who text, p_answer text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  if p_answer is null or char_length(btrim(p_answer)) = 0 or char_length(p_answer) > 1000 then return false; end if;
  if not exists (select 1 from public.site_items where id = p_qid and kind = 'dquestion') then return false; end if;
  insert into public.daily_answers(question_id, author, answer) values (p_qid, p_who, btrim(p_answer))
  on conflict (question_id, author) do update set answer = excluded.answer;
  return true;
end; $$;
revoke all on function public.submit_daily_answer(text,uuid,text,text) from public;
grant execute on function public.submit_daily_answer(text,uuid,text,text) to anon, authenticated;

create or replace function public.get_daily_answers(p_access_code text, p_qid uuid, p_who text)
returns table(author text, answer text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select a.author, a.answer, a.created_at from public.daily_answers a
   where a.question_id = p_qid
     and (a.author = p_who or (select count(distinct b.author) from public.daily_answers b where b.question_id = p_qid) = 2)
   order by a.author;
end; $$;
revoke all on function public.get_daily_answers(text,uuid,text) from public;
grant execute on function public.get_daily_answers(text,uuid,text) to anon, authenticated;

create or replace function public.get_daily_history(p_access_code text)
returns table(question_id uuid, question text, author text, answer text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select a.question_id, i.body, a.author, a.answer, a.created_at
    from public.daily_answers a join public.site_items i on i.id = a.question_id
   where a.question_id in (select d.question_id from public.daily_answers d group by d.question_id having count(distinct d.author) = 2)
   order by a.created_at desc limit 60;
end; $$;
revoke all on function public.get_daily_history(text) from public;
grant execute on function public.get_daily_history(text) to anon, authenticated;

-- miss-you button (one per minute per person)
create or replace function public.send_miss_you(p_access_code text, p_who text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  if exists (select 1 from public.miss_you where author = p_who and created_at > now() - interval '1 minute') then return false; end if;
  insert into public.miss_you(author) values (p_who);
  return true;
end; $$;
revoke all on function public.send_miss_you(text,text) from public;
grant execute on function public.send_miss_you(text,text) to anon, authenticated;

create or replace function public.get_miss_you(p_access_code text)
returns table(author text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select m.author, m.created_at from public.miss_you m order by m.created_at desc limit 60;
end; $$;
revoke all on function public.get_miss_you(text) from public;
grant execute on function public.get_miss_you(text) to anon, authenticated;

-- time capsule: body is returned only after unlock_at
create or replace function public.add_time_capsule(p_access_code text, p_author text, p_title text, p_body text, p_unlock timestamptz)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_author not in ('ماجی','محمد') then return false; end if;
  if p_title is null or char_length(btrim(p_title)) = 0 or char_length(p_title) > 200 then return false; end if;
  if p_body is null or char_length(btrim(p_body)) = 0 or char_length(p_body) > 10000 then return false; end if;
  if p_unlock < now() + interval '1 hour' or p_unlock > now() + interval '20 years' then return false; end if;
  insert into public.time_capsules(author, title, body, unlock_at) values (p_author, btrim(p_title), btrim(p_body), p_unlock);
  return true;
end; $$;
revoke all on function public.add_time_capsule(text,text,text,text,timestamptz) from public;
grant execute on function public.add_time_capsule(text,text,text,text,timestamptz) to anon, authenticated;

create or replace function public.get_time_capsules(p_access_code text)
returns table(id uuid, author text, title text, body text, unlock_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select c.id, c.author, c.title, case when now() >= c.unlock_at then c.body else null end, c.unlock_at, c.created_at
    from public.time_capsules c order by c.unlock_at;
end; $$;
revoke all on function public.get_time_capsules(text) from public;
grant execute on function public.get_time_capsules(text) to anon, authenticated;

create or replace function public.admin_list_time_capsules()
returns table(id uuid, author text, title text, unlock_at timestamptz, created_at timestamptz, opened boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_site_admin() then raise exception 'not authorized'; end if;
  return query select c.id, c.author, c.title, c.unlock_at, c.created_at, (now() >= c.unlock_at) from public.time_capsules c order by c.unlock_at;
end; $$;
revoke all on function public.admin_list_time_capsules() from public;
grant execute on function public.admin_list_time_capsules() to authenticated;

-- quiz scores
create or replace function public.submit_quiz_score(p_access_code text, p_who text, p_correct integer, p_total integer)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return false; end if;
  if p_total is null or p_total <= 0 or p_correct is null or p_correct < 0 or p_correct > p_total then return false; end if;
  insert into public.quiz_scores(author, correct, total) values (p_who, p_correct, p_total);
  return true;
end; $$;
revoke all on function public.submit_quiz_score(text,text,integer,integer) from public;
grant execute on function public.submit_quiz_score(text,text,integer,integer) to anon, authenticated;

create or replace function public.get_quiz_scores(p_access_code text)
returns table(author text, correct integer, total integer, created_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select s.author, s.correct, s.total, s.created_at from public.quiz_scores s order by s.created_at desc limit 40;
end; $$;
revoke all on function public.get_quiz_scores(text) from public;
grant execute on function public.get_quiz_scores(text) to anon, authenticated;
