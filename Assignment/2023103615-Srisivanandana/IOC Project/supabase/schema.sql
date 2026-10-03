create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null default '',
    email text not null default '',
    course text not null default '',
    semester integer not null default 1 check (semester between 1 and 20),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.classes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    subject text not null,
    date date,
    start_time time,
    end_time time,
    room text,
    created_at timestamptz not null default now()
);

create table if not exists public.assignments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    subject text,
    deadline timestamptz,
    priority text,
    status text not null default 'pending',
    estimated_hours numeric,
    created_at timestamptz not null default now()
);

create table if not exists public.exams (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    subject text not null,
    exam_date date,
    topics text,
    created_at timestamptz not null default now()
);

create table if not exists public.placements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    company text not null,
    role text,
    stage text,
    oa_date timestamptz,
    interview_date timestamptz,
    status text,
    created_at timestamptz not null default now()
);

create table if not exists public.study_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    topic text not null,
    subject text,
    mastery integer check (mastery between 0 and 100),
    last_studied date,
    created_at timestamptz not null default now()
);

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    deadline timestamptz,
    priority text,
    status text not null default 'pending',
    source text not null default 'manual',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    date date,
    time time,
    venue text,
    category text,
    created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, email, course, semester)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        coalesce(new.email, ''),
        coalesce(new.raw_user_meta_data ->> 'course', ''),
        coalesce(nullif(new.raw_user_meta_data ->> 'semester', '')::integer, 1)
    )
    on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        course = excluded.course,
        semester = excluded.semester,
        updated_at = now();
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
alter table public.exams enable row level security;
alter table public.placements enable row level security;
alter table public.study_progress enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;

grant select, insert, update, delete on public.profiles, public.classes, public.assignments,
    public.exams, public.placements, public.study_progress, public.tasks, public.events to authenticated;
revoke all on public.profiles, public.classes, public.assignments, public.exams,
    public.placements, public.study_progress, public.tasks, public.events from anon;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
for all to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Users manage own classes" on public.classes;
create policy "Users manage own classes" on public.classes
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users manage own assignments" on public.assignments;
create policy "Users manage own assignments" on public.assignments
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users manage own exams" on public.exams;
create policy "Users manage own exams" on public.exams
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users manage own placements" on public.placements;
create policy "Users manage own placements" on public.placements
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users manage own study progress" on public.study_progress;
create policy "Users manage own study progress" on public.study_progress
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks" on public.tasks
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists "Users manage own events" on public.events;
create policy "Users manage own events" on public.events
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
