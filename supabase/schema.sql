-- OBRA EM ORDEM — esquema inicial multiempresa
-- Execute no SQL Editor do seu projeto Supabase.
create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner','admin','finance','purchasing','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  client_name text,
  address text,
  budget numeric(14,2) not null default 0 check (budget >= 0),
  status text not null default 'em_andamento',
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  category text,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists projects_company_idx on public.projects(company_id);
create index if not exists expenses_company_idx on public.expenses(company_id);
create index if not exists expenses_project_idx on public.expenses(project_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare new_company_id uuid;
begin
  insert into public.companies(name)
  values (coalesce(new.raw_user_meta_data->>'company_name', 'Minha empresa'))
  returning id into new_company_id;
  insert into public.profiles(id, company_id, full_name, role)
  values (new.id, new_company_id, new.raw_user_meta_data->>'full_name', 'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public
as $$ select company_id from public.profiles where id = auth.uid() $$;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "company members read own company" on public.companies;
create policy "company members read own company" on public.companies
for select to authenticated using (id = public.current_company_id());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
for select to authenticated using (id = auth.uid() or company_id = public.current_company_id());

drop policy if exists "company members read projects" on public.projects;
create policy "company members read projects" on public.projects
for select to authenticated using (company_id = public.current_company_id());

drop policy if exists "company admins insert projects" on public.projects;
create policy "company admins insert projects" on public.projects
for insert to authenticated with check (
  company_id = public.current_company_id()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
);

drop policy if exists "company admins update projects" on public.projects;
create policy "company admins update projects" on public.projects
for update to authenticated using (
  company_id = public.current_company_id()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
) with check (company_id = public.current_company_id());

drop policy if exists "company admins delete projects" on public.projects;
create policy "company admins delete projects" on public.projects
for delete to authenticated using (
  company_id = public.current_company_id()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
);

drop policy if exists "company members read expenses" on public.expenses;
create policy "company members read expenses" on public.expenses
for select to authenticated using (company_id = public.current_company_id());

drop policy if exists "company members insert expenses" on public.expenses;
create policy "company members insert expenses" on public.expenses
for insert to authenticated with check (
  company_id = public.current_company_id()
  and exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.current_company_id())
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin','finance'))
);

drop policy if exists "company admins update expenses" on public.expenses;
create policy "company admins update expenses" on public.expenses
for update to authenticated using (
  company_id = public.current_company_id()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin','finance'))
) with check (
  company_id = public.current_company_id()
  and exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.current_company_id())
);

drop policy if exists "company admins delete expenses" on public.expenses;
create policy "company admins delete expenses" on public.expenses
for delete to authenticated using (
  company_id = public.current_company_id()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
);

create or replace function public.set_company_id()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.company_id := public.current_company_id();
  return new;
end;
$$;
drop trigger if exists set_project_company on public.projects;
create trigger set_project_company before insert on public.projects
for each row execute procedure public.set_company_id();
drop trigger if exists set_expense_company on public.expenses;
create trigger set_expense_company before insert on public.expenses
for each row execute procedure public.set_company_id();
