create table public.profiles (id uuid primary key, name text, email text, role text not null default 'user', created_at timestamptz not null default now());
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id,name,email) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.bills (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), merchant text, invoice_number text, billing_date date, due_date date, amount numeric(12,2), currency text default 'INR', category text default 'Other', document_url text, file_name text, confidence numeric, status text not null default 'processing', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), merchant text not null, amount numeric(12,2), currency text default 'INR', frequency text default 'Monthly', next_billing_date date, category text, status text not null default 'active', created_at timestamptz not null default now());
create table public.anomalies (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), bill_id uuid references public.bills(id) on delete cascade, type text, severity text, previous_amount numeric, current_amount numeric, percentage_change numeric, created_at timestamptz not null default now());
create table public.reminders (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), bill_id uuid references public.bills(id) on delete cascade, message text, reminder_date date, status text default 'pending', created_at timestamptz not null default now());
create table public.workflow_runs (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), bill_id uuid references public.bills(id) on delete cascade, status text default 'running', current_agent text, ai_mode text, started_at timestamptz default now(), completed_at timestamptz);
create table public.agent_runs (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), workflow_id uuid references public.workflow_runs(id) on delete cascade, agent_name text, status text, confidence numeric, execution_time integer, output jsonb, error text, created_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), action text, entity text, entity_id uuid, created_at timestamptz not null default now());

do $$ declare t text; begin foreach t in array array['bills','subscriptions','anomalies','reminders','workflow_runs','agent_runs','audit_logs'] loop
 execute format('grant select, insert, update, delete on public.%I to authenticated; grant all on public.%I to service_role; alter table public.%I enable row level security; create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());', t,t,t,t);
end loop; end $$;

create policy "own bill files read" on storage.objects for select to authenticated using (bucket_id='bills' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own bill files write" on storage.objects for insert to authenticated with check (bucket_id='bills' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own bill files delete" on storage.objects for delete to authenticated using (bucket_id='bills' and (storage.foldername(name))[1] = auth.uid()::text);