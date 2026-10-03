create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  doc_id text not null,
  chunk_id text,
  quote text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notes to authenticated;
grant all on public.notes to service_role;
alter table public.notes enable row level security;
create policy "own notes" on public.notes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.favorites (
  user_id uuid not null default auth.uid(),
  doc_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, doc_id)
);
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null,
  doc_id text,
  label text not null,
  created_at timestamptz not null default now()
);
create index activity_user_time on public.activity (user_id, created_at desc);
grant select, insert, delete on public.activity to authenticated;
grant all on public.activity to service_role;
alter table public.activity enable row level security;
create policy "own activity" on public.activity for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  category text not null default 'personal',
  author text not null default 'You',
  status text not null default 'queued',
  error text,
  tags text[] not null default '{}',
  sections jsonb not null default '[]',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.user_documents to authenticated;
grant all on public.user_documents to service_role;
alter table public.user_documents enable row level security;
create policy "own documents" on public.user_documents for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);