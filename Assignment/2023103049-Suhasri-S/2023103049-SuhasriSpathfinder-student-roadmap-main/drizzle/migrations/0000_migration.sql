create table public.profiles (
  id uuid primary key,
  full_name text, education text, experience_level text,
  target_role text, target_industry text, timeline_months int default 6,
  hours_per_week int default 10, learning_preferences text, project_types text, goals text,
  skills jsonb not null default '[]'::jsonb,
  assessment_completed boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.career_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, summary text, gaps jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, title text, summary text, version int not null default 1,
  is_active boolean not null default true, created_at timestamptz default now()
);
create table public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  user_id uuid not null, phase_index int not null, phase_title text not null,
  milestone text, title text not null, description text, skill text,
  priority text, estimated_hours int, prerequisites text, resources jsonb default '[]'::jsonb,
  practice text, position int not null default 0,
  completed boolean not null default false, completed_at timestamptz,
  created_at timestamptz default now()
);
create table public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, skill text not null, difficulty text, score int not null,
  total int not null, questions jsonb, weak_topics jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
create table public.roadmap_change_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, roadmap_id uuid references public.roadmaps(id) on delete cascade,
  issue text not null, reason text not null, changes jsonb not null default '[]'::jsonb,
  new_tasks jsonb not null default '[]'::jsonb, status text not null default 'pending',
  decided_at timestamptz, created_at timestamptz default now()
);
create table public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, role text not null, content text not null,
  created_at timestamptz default now()
);
create table public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, agent text not null, action text not null, status text not null,
  detail text, created_at timestamptz default now()
);
do $$ declare t text; begin
 foreach t in array array['profiles','career_analyses','roadmaps','roadmap_tasks','assessment_results','roadmap_change_proposals','mentor_messages','agent_logs'] loop
  execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  execute format('grant all on public.%I to service_role', t);
  execute format('alter table public.%I enable row level security', t);
 end loop;
end $$;
create policy "own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
do $$ declare t text; begin
 foreach t in array array['career_analyses','roadmaps','roadmap_tasks','assessment_results','roadmap_change_proposals','mentor_messages','agent_logs'] loop
  execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
 end loop;
end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();