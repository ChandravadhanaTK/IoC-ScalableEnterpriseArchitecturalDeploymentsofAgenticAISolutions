
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  meeting_date date not null default current_date,
  participants text not null default '',
  transcript text not null,
  agent_state text not null default 'IDLE',
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  title text not null,
  owner text,
  deadline_text text,
  deadline_date date,
  priority text not null default 'MEDIUM',
  context text,
  source_text text,
  review_status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  action_item_id uuid references public.action_items(id) on delete set null,
  title text not null,
  description text,
  owner text,
  deadline date,
  deadline_text text,
  priority text not null default 'MEDIUM',
  status text not null default 'TODO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid references public.tasks(id) on delete cascade,
  kind text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (task_id, kind)
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  trace_id uuid not null,
  agent text not null,
  step text not null,
  state text not null,
  success boolean,
  error text,
  model text,
  input_tokens int,
  output_tokens int,
  duration_ms int,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.agent_runs (trace_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  trace_id uuid,
  kind text not null,
  pattern text not null,
  snippet text,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['meetings','action_items','tasks','notifications','agent_runs','audit_logs','security_events'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "owner or admin select" on public.%I for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "owner insert" on public.%I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('create policy "owner or admin update" on public.%I for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "owner or admin delete" on public.%I for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;
