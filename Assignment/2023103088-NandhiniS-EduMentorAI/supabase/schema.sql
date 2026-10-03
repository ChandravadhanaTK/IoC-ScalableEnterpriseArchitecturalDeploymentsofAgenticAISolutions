create type public.app_role as enum ('admin','student');
create table public.profiles (id uuid primary key references auth.users on delete cascade, username text unique, full_name text, email text, phone text, avatar_url text);
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, role app_role not null, unique(user_id, role));
create table public.pdf_documents (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, title text not null, file_path text not null, size_bytes bigint, content text, question_count int not null default 0, created_at timestamptz default now());
create table public.generated_questions (id uuid primary key, user_id uuid not null references auth.users on delete cascade, pdf_id uuid references pdf_documents on delete cascade, qtype text, difficulty text, topic text, prompt text, options jsonb, answer text, keywords jsonb, created_at timestamptz default now());
create table public.quiz_attempts (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, pdf_id uuid references pdf_documents on delete set null, difficulty text, total int, created_at timestamptz default now());
create table public.quiz_answers (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, attempt_id uuid references quiz_attempts on delete cascade, question_id uuid references generated_questions on delete cascade, answer text, correct boolean, marks numeric, feedback text);
create table public.quiz_results (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, attempt_id uuid references quiz_attempts on delete cascade, score numeric, total int, accuracy numeric, topic_stats jsonb, created_at timestamptz default now());
create table public.study_plans (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, weak_topics text[], tasks jsonb, created_at timestamptz default now());
create table public.agent_logs (id bigserial primary key, user_id uuid, agent text, action text, status text, duration_ms int, summary text, created_at timestamptz default now());
create table public.audit_logs (id bigserial primary key, user_id uuid, action text not null, detail jsonb, created_at timestamptz default now());

create function public.has_role(_u uuid, _r app_role) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from user_roles where user_id=_u and role=_r) $$;
revoke execute on function public.has_role(uuid, app_role) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.profiles(id,email,full_name,username) values (new.id,new.email,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'username');
  exception when unique_violation then
    insert into public.profiles(id,email,full_name) values (new.id,new.email,new.raw_user_meta_data->>'full_name') on conflict (id) do nothing;
  end;
  insert into public.user_roles(user_id,role) values (new.id,'student') on conflict do nothing; -- admins are promoted manually
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

do $$ declare t text; begin
  foreach t in array array['profiles','user_roles','pdf_documents','generated_questions','quiz_attempts','quiz_answers','quiz_results','study_plans','agent_logs','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
  foreach t in array array['pdf_documents','generated_questions','quiz_attempts','quiz_answers','quiz_results','study_plans','agent_logs','audit_logs'] loop
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
create policy "own profile read" on profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own role" on user_roles for select to authenticated using (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false) on conflict do nothing;
create policy "pdf own folder" on storage.objects for all to authenticated
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdf admin read" on storage.objects for select to authenticated using (bucket_id = 'pdfs' and public.has_role(auth.uid(),'admin'));
