-- Keltech Legal Tracker V1 schema
-- Apply in Supabase SQL editor or convert into a migration.

create extension if not exists pgcrypto;
create schema if not exists app_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists role text not null default 'user' check (role in ('admin', 'user'));

create table if not exists public.matter_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#0b65c2',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.matter_categories(id),
  owner_name text not null,
  counterparty text,
  location text,
  status text not null default 'Open' check (status in ('Open', 'Due Soon', 'Overdue', 'On Track', 'Closed')),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Critical')),
  description text,
  opened_on date not null default current_date,
  closed_on date,
  next_date date,
  next_date_label text,
  monthly_cost_inr numeric(14,2) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_dates (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  title text not null,
  date_type text not null,
  due_on date not null,
  status text not null default 'Open' check (status in ('Open', 'Due Soon', 'Overdue', 'On Track', 'Closed')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete set null,
  title text not null,
  location text,
  assignee_name text,
  due_on date,
  status text not null default 'Open' check (status in ('Open', 'Due Soon', 'Overdue', 'On Track', 'Closed')),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Critical')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  budget_month date not null,
  category_id uuid references public.matter_categories(id),
  budget_inr numeric(14,2) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_month, category_id)
);

create table if not exists public.cost_entries (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete set null,
  category_id uuid references public.matter_categories(id),
  cost_month date not null,
  amount_inr numeric(14,2) not null check (amount_inr >= 0),
  paid_inr numeric(14,2) not null default 0 check (paid_inr >= 0),
  paid_on date,
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid', 'Part Paid', 'Paid')),
  vendor text,
  description text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  name text not null,
  document_type text not null default 'PDF',
  source text not null check (source in ('Upload', 'External Link')),
  storage_path text,
  external_url text,
  uploaded_by_name text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source = 'Upload' and storage_path is not null)
    or (source = 'External Link' and external_url is not null)
  )
);

create table if not exists public.matter_updates (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id),
  created_by_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  matter_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_metadata jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_matters_status on public.matters(status);
create index if not exists idx_matters_next_date on public.matters(next_date);
create index if not exists idx_matters_category_id on public.matters(category_id);
create index if not exists idx_matters_created_by on public.matters(created_by);
create index if not exists idx_matters_updated_by on public.matters(updated_by);
create index if not exists idx_matters_counterparty_lower on public.matters(lower(trim(counterparty)));
create index if not exists idx_matters_location_lower on public.matters(lower(trim(location)));
create index if not exists idx_legal_dates_matter_id on public.legal_dates(matter_id);
create index if not exists idx_legal_dates_due_on on public.legal_dates(due_on);
create index if not exists idx_legal_dates_created_by on public.legal_dates(created_by);
create index if not exists idx_legal_dates_updated_by on public.legal_dates(updated_by);
create index if not exists idx_tasks_matter_id on public.tasks(matter_id);
create index if not exists idx_tasks_due_on on public.tasks(due_on);
create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_tasks_updated_by on public.tasks(updated_by);
create index if not exists idx_tasks_location_lower on public.tasks(lower(trim(location)));
create index if not exists idx_cost_entries_matter_id on public.cost_entries(matter_id);
create index if not exists idx_cost_entries_category_id on public.cost_entries(category_id);
create index if not exists idx_cost_entries_created_by on public.cost_entries(created_by);
create index if not exists idx_cost_entries_updated_by on public.cost_entries(updated_by);
create index if not exists idx_monthly_budgets_category_id on public.monthly_budgets(category_id);
create index if not exists idx_monthly_budgets_created_by on public.monthly_budgets(created_by);
create index if not exists idx_monthly_budgets_updated_by on public.monthly_budgets(updated_by);
create index if not exists idx_documents_matter_id on public.documents(matter_id);
create index if not exists idx_documents_created_by on public.documents(created_by);
create index if not exists idx_documents_updated_by on public.documents(updated_by);
create index if not exists idx_matter_categories_created_by on public.matter_categories(created_by);
create index if not exists idx_matter_categories_updated_by on public.matter_categories(updated_by);
create index if not exists idx_matter_updates_matter_id on public.matter_updates(matter_id);
create index if not exists idx_matter_updates_created_by on public.matter_updates(created_by);
create index if not exists idx_profiles_created_by on public.profiles(created_by);
create index if not exists idx_profiles_updated_by on public.profiles(updated_by);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_audit_created_at on public.audit_events(created_at desc);
create index if not exists idx_audit_actor on public.audit_events(actor_id, created_at desc);
create index if not exists idx_audit_matter on public.audit_events(matter_id, created_at desc);

create or replace function app_private.set_audit_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    NEW.created_by = coalesce(NEW.created_by, auth.uid());
    NEW.updated_by = coalesce(NEW.updated_by, auth.uid());
    NEW.created_at = coalesce(NEW.created_at, now());
  elsif TG_OP = 'UPDATE' then
    NEW.updated_by = auth.uid();
  end if;

  NEW.updated_at = now();
  return NEW;
end;
$$;

create or replace function app_private.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and coalesce(NEW.role, 'user') <> coalesce(OLD.role, 'user') then
    raise exception 'profile roles cannot be changed from the client';
  end if;
  return NEW;
end;
$$;

create or replace function app_private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
  related_matter_id uuid;
  request_headers jsonb;
  old_data jsonb;
  new_data jsonb;
  row_data jsonb;
begin
  old_data := case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end;
  new_data := case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(NEW) else null end;
  row_data := coalesce(new_data, old_data);
  row_id := (row_data ->> 'id')::uuid;
  related_matter_id := case
    when TG_TABLE_NAME = 'matters' then row_id
    when coalesce(new_data ->> 'matter_id', old_data ->> 'matter_id') is not null
      then coalesce(new_data ->> 'matter_id', old_data ->> 'matter_id')::uuid
    else null
  end;
  request_headers := coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb);

  insert into public.audit_events (
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    matter_id,
    before_data,
    after_data,
    ip_metadata,
    user_agent
  )
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    TG_TABLE_NAME || '_' || lower(TG_OP),
    TG_TABLE_NAME,
    row_id,
    related_matter_id,
    old_data,
    new_data,
    jsonb_build_object(
      'x_forwarded_for', request_headers ->> 'x-forwarded-for',
      'cf_connecting_ip', request_headers ->> 'cf-connecting-ip'
    ),
    request_headers ->> 'user-agent'
  );

  return null;
end;
$$;

create or replace function app_private.block_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

drop trigger if exists block_audit_update on public.audit_events;
create trigger block_audit_update
before update or delete on public.audit_events
for each row execute function app_private.block_audit_mutation();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'matter_categories',
    'matters',
    'legal_dates',
    'tasks',
    'monthly_budgets',
    'cost_entries',
    'documents'
  ]
  loop
    execute format('drop trigger if exists set_audit_columns_%I on public.%I', table_name, table_name);
    execute format(
      'create trigger set_audit_columns_%I before insert or update on public.%I for each row execute function app_private.set_audit_columns()',
      table_name,
      table_name
    );
  end loop;

  foreach table_name in array array[
    'matter_categories',
    'matters',
    'legal_dates',
    'tasks',
    'monthly_budgets',
    'cost_entries',
    'documents'
  ]
  loop
    execute format('drop trigger if exists audit_row_change_%I on public.%I', table_name, table_name);
    execute format(
      'create trigger audit_row_change_%I after insert or update or delete on public.%I for each row execute function app_private.audit_row_change()',
      table_name,
      table_name
    );
  end loop;
end $$;

create or replace function public.record_audit_event(
  action text,
  entity_type text,
  entity_id uuid default null,
  matter_id uuid default null,
  before_data jsonb default null,
  after_data jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  request_headers jsonb := coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'Authentication required to record audit events';
  end if;

  insert into public.audit_events (
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    matter_id,
    before_data,
    after_data,
    ip_metadata,
    user_agent
  )
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    action,
    entity_type,
    entity_id,
    matter_id,
    before_data,
    after_data,
    jsonb_build_object(
      'x_forwarded_for', request_headers ->> 'x-forwarded-for',
      'cf_connecting_ip', request_headers ->> 'cf-connecting-ip'
    ),
    request_headers ->> 'user-agent'
  )
  returning id into event_id;

  return event_id;
end;
$$;

revoke all on function public.record_audit_event(text, text, uuid, uuid, jsonb, jsonb) from public;
revoke all on function public.record_audit_event(text, text, uuid, uuid, jsonb, jsonb) from anon;
grant execute on function public.record_audit_event(text, text, uuid, uuid, jsonb, jsonb) to authenticated;

alter table public.profiles enable row level security;
alter table public.matter_categories enable row level security;
alter table public.matters enable row level security;
alter table public.legal_dates enable row level security;
alter table public.tasks enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.cost_entries enable row level security;
alter table public.documents enable row level security;
alter table public.matter_updates enable row level security;
alter table public.audit_events enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'matter_categories',
    'matters',
    'legal_dates',
    'tasks',
    'monthly_budgets',
    'cost_entries',
    'documents'
  ]
  loop
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format(
      'create policy authenticated_full_access on public.%I for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null)',
      table_name
    );
  end loop;
end $$;

drop policy if exists authenticated_full_access on public.profiles;
drop policy if exists authenticated_read_profiles on public.profiles;
create policy authenticated_read_profiles
on public.profiles
for select
to authenticated
using (true);

drop policy if exists authenticated_insert_own_profile on public.profiles;
create policy authenticated_insert_own_profile
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
  and (
    role = 'user'
    or (
      role = 'admin'
      and lower(email) in ('shresth@keltechgroup.com', 'upendra@keltechgroup.com', 'nkumar@keltechgroup.com')
      and lower(coalesce(auth.jwt() ->> 'email', '')) = lower(email)
    )
  )
);

drop policy if exists authenticated_update_own_profile on public.profiles;
create policy authenticated_update_own_profile
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists authenticated_full_access on public.matters;
drop policy if exists authenticated_read_matters on public.matters;
create policy authenticated_read_matters
on public.matters
for select
to authenticated
using (true);

drop policy if exists authenticated_insert_matters on public.matters;
create policy authenticated_insert_matters
on public.matters
for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists authenticated_update_matters on public.matters;
create policy authenticated_update_matters
on public.matters
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

drop policy if exists admin_delete_matters on public.matters;
create policy admin_delete_matters
on public.matters
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
before update on public.profiles
for each row execute function app_private.prevent_profile_role_change();

drop policy if exists authenticated_full_access on public.matter_updates;
drop policy if exists authenticated_read_matter_updates on public.matter_updates;
create policy authenticated_read_matter_updates
on public.matter_updates
for select
to authenticated
using (true);

drop policy if exists authenticated_insert_matter_updates on public.matter_updates;
create policy authenticated_insert_matter_updates
on public.matter_updates
for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists authenticated_read_audit on public.audit_events;
create policy authenticated_read_audit
on public.audit_events
for select
to authenticated
using (true);

drop policy if exists authenticated_insert_audit_via_function on public.audit_events;

insert into storage.buckets (id, name, public)
values ('matter-documents', 'matter-documents', false)
on conflict (id) do nothing;

drop policy if exists authenticated_document_read on storage.objects;
create policy authenticated_document_read
on storage.objects
for select
to authenticated
using (bucket_id = 'matter-documents');

drop policy if exists authenticated_document_upload on storage.objects;
create policy authenticated_document_upload
on storage.objects
for insert
to authenticated
with check (bucket_id = 'matter-documents');

drop policy if exists authenticated_document_update on storage.objects;
create policy authenticated_document_update
on storage.objects
for update
to authenticated
using (bucket_id = 'matter-documents')
with check (bucket_id = 'matter-documents');

do $$
begin
  alter publication supabase_realtime add table public.matters;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.legal_dates;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.documents;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.matter_updates;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.audit_events;
exception when duplicate_object then null;
end $$;
