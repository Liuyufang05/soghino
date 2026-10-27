-- Sổ Ghi Nợ schema for Supabase/PostgreSQL.
-- Authentication is provided by Supabase Auth. Run in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  phone text not null default '',
  note text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  type text not null check (type in ('lent', 'borrowed')),
  amount numeric(14,0) not null check (amount > 0),
  due_date date not null,
  transaction_date date not null,
  description text not null default '',
  note text not null default '',
  status text not null default 'open' check (status in ('open', 'partial', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(14,0) not null check (amount > 0),
  payment_date date not null,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'transfer', 'other')),
  note text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reminder_date date not null,
  note text not null default '',
  status text not null default 'done' check (status in ('pending', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists debts_user_due_date_idx on public.debts (user_id, due_date);
create index if not exists debts_user_transaction_date_idx on public.debts (user_id, transaction_date);
create index if not exists payments_user_date_idx on public.payments (user_id, payment_date);
create index if not exists reminders_user_date_idx on public.reminders (user_id, reminder_date);

create or replace function public.create_profile_for_new_auth_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup after insert on auth.users
for each row execute procedure public.create_profile_for_new_auth_user();

create or replace function public.enforce_payment_balance()
returns trigger language plpgsql set search_path = public
as $$
declare debt_amount numeric(14,0); already_paid numeric(14,0);
begin
  select d.amount into debt_amount
  from public.debts d
  where d.id = new.debt_id and d.user_id = new.user_id
  for update;
  if not found then raise exception 'Debt does not belong to this user'; end if;
  select coalesce(sum(p.amount), 0) into already_paid
  from public.payments p where p.debt_id = new.debt_id;
  if tg_op = 'UPDATE' and old.debt_id = new.debt_id then
    already_paid := already_paid - old.amount;
  end if;
  if already_paid + new.amount > debt_amount then
    raise exception 'Payment exceeds the outstanding balance';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_payment_balance on public.payments;
create trigger validate_payment_balance before insert or update on public.payments
for each row execute procedure public.enforce_payment_balance();

create or replace function public.sync_debt_status_from_payments()
returns trigger language plpgsql security definer set search_path = public
as $$
declare target_debt_id uuid;
begin
  if tg_op = 'DELETE' then target_debt_id := old.debt_id; else target_debt_id := new.debt_id; end if;
  update public.debts d
  set status = case
    when coalesce((select sum(p.amount) from public.payments p where p.debt_id = d.id), 0) >= d.amount then 'paid'
    when coalesce((select sum(p.amount) from public.payments p where p.debt_id = d.id), 0) > 0 then 'partial'
    else 'open'
  end, updated_at = now()
  where d.id = target_debt_id;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists sync_debt_status_after_payment on public.payments;
create trigger sync_debt_status_after_payment after insert or update or delete on public.payments
for each row execute procedure public.sync_debt_status_from_payments();

alter table public.users enable row level security;
alter table public.contacts enable row level security;
alter table public.debts enable row level security;
alter table public.payments enable row level security;
alter table public.reminders enable row level security;
drop policy if exists "users manage own profile" on public.users;
create policy "users manage own profile" on public.users
for all using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "contacts belong to owner" on public.contacts;
create policy "contacts belong to owner" on public.contacts
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "debts belong to owner" on public.debts;
create policy "debts belong to owner" on public.debts
for all using (
  user_id = auth.uid()
  and exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = auth.uid())
) with check (
  user_id = auth.uid()
  and exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = auth.uid())
);
drop policy if exists "payments belong to owner" on public.payments;
create policy "payments belong to owner" on public.payments
for all using (
  user_id = auth.uid()
  and exists (select 1 from public.debts d where d.id = debt_id and d.user_id = auth.uid())
) with check (
  user_id = auth.uid()
  and exists (select 1 from public.debts d where d.id = debt_id and d.user_id = auth.uid())
);
drop policy if exists "reminders belong to owner" on public.reminders;
create policy "reminders belong to owner" on public.reminders
for all using (
  user_id = auth.uid()
  and exists (select 1 from public.debts d where d.id = debt_id and d.user_id = auth.uid())
) with check (
  user_id = auth.uid()
  and exists (select 1 from public.debts d where d.id = debt_id and d.user_id = auth.uid())
);

