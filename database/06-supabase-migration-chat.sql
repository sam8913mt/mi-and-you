-- ME & YOU — چت خصوصی دونفره. بعد از migrationهای قبلی اجرا شود. قابل اجرای مجدد است.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('ماجی','محمد')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on public.chat_messages(created_at desc);
alter table public.chat_messages enable row level security;
-- هیچ policy عمومی ندارد؛ فقط توابع زیر.

create or replace function public.send_chat(p_access_code text, p_who text, p_body text)
returns table(id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
declare b text := btrim(coalesce(p_body,'')); r record;
begin
  if not public.verify_access_code(p_access_code) or p_who not in ('ماجی','محمد') then return; end if;
  if char_length(b) = 0 or char_length(b) > 1000 then return; end if;
  if (select count(*) from public.chat_messages m where m.author = p_who and m.created_at > now() - interval '1 minute') >= 30 then return; end if;
  insert into public.chat_messages(author, body) values (p_who, b) returning chat_messages.id, chat_messages.created_at into r;
  return query select r.id, r.created_at;
end $$;
revoke all on function public.send_chat(text,text,text) from public;
grant execute on function public.send_chat(text,text,text) to anon, authenticated;

create or replace function public.get_chat(p_access_code text, p_limit integer default 80, p_before timestamptz default null)
returns table(id uuid, author text, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.verify_access_code(p_access_code) then return; end if;
  return query select m.id, m.author, m.body, m.created_at from public.chat_messages m
    where p_before is null or m.created_at < p_before
    order by m.created_at desc limit least(greatest(p_limit,1),200);
end $$;
revoke all on function public.get_chat(text,integer,timestamptz) from public;
grant execute on function public.get_chat(text,integer,timestamptz) to anon, authenticated;

-- اعلان پیام تازه (اگر migration اعلان‌ها اجرا شده باشد)
create or replace function public.trg_n_chat() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.push_notify(public.push_other(new.author), 'chat', '💬 ' || new.author, new.body, 'chat:' || new.id);
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists n_chat on public.chat_messages;
create trigger n_chat after insert on public.chat_messages for each row execute function public.trg_n_chat();
