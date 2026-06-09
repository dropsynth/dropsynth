create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  plan text default 'general',
  source text default 'landing',
  created_at timestamptz default now()
);
alter table public.waitlist enable row level security;
create policy "anyone can join waitlist" on public.waitlist for insert to anon with check (true);