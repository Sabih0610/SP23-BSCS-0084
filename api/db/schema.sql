-- Basic schema for HireMatch
create extension if not exists "uuid-ossp";

create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  slug text unique,
  title text not null,
  recruiter_id uuid references public.users(id),
  company_id uuid,
  company_name text,
  company_website text,
  company_industry text,
  location text,
  remote boolean default true,
  employment_type text,
  seniority text,
  salary_min numeric,
  salary_max numeric,
  description text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  role text default 'candidate',
  status text default 'active',
  created_at timestamptz default now(),
  last_login timestamptz
);

alter table public.users enable row level security;
create policy if not exists "users self read" on public.users for select using (auth.uid() = id);
create policy if not exists "users recruiters read" on public.users for select using ((auth.jwt() ->> 'role') = 'recruiter' or (auth.jwt() ->> 'role') = 'admin');

create table if not exists public.candidates (
  id uuid primary key references public.users(id),
  headline text,
  location text,
  remote_pref text,
  summary text,
  skills text[],
  links text[]
);

create table if not exists public.recruiters (
  id uuid primary key references public.users(id),
  company_id uuid,
  title text,
  linkedin_url text,
  about text
);

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.users(id),
  body text,
  visibility text default 'public',
  status text default 'visible',
  created_at timestamptz default now()
);

-- Store uploaded CV metadata and parsed text for matching
create table if not exists public.candidate_cvs (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.users(id),
  file_url text not null,
  parsed_text text,
  created_at timestamptz default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  recruiter_id uuid references public.users(id),
  candidate_id uuid references public.users(id),
  note text,
  created_at timestamptz default now()
);

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.users(id),
  author_id uuid references public.users(id),
  note text,
  created_at timestamptz default now()
);

create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id),
  candidate_id uuid references public.users(id),
  cv_id uuid references public.candidate_cvs(id),
  status text default 'applied',
  applied_at timestamptz default now(),
  match_score numeric,
  match_level text,
  matched_skills text[],
  missing_skills text[],
  rationale text,
  best_fit boolean default false,
  last_scored_at timestamptz
);

-- Log each scoring run for auditing and history
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id),
  candidate_id uuid references public.users(id),
  score numeric,
  matched_skills text[],
  missing_skills text[],
  rationale text,
  source text default 'batch',
  created_at timestamptz default now()
);

create table if not exists public.match_checks (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.users(id),
  jd_text text,
  cv_id uuid references public.candidate_cvs(id),
  match_score numeric,
  matched_skills text[],
  missing_skills text[],
  explanation text,
  created_at timestamptz default now()
);

-- RLS policies (minimal) to allow owners and job recruiters to interact
alter table public.candidates enable row level security;
create policy if not exists "candidates self read write" on public.candidates
  for select using (auth.uid() = id);
create policy if not exists "candidates self upsert" on public.candidates
  for insert with check (auth.uid() = id);
create policy if not exists "candidates self update" on public.candidates
  for update using (auth.uid() = id);

alter table public.recruiters enable row level security;
create policy if not exists "recruiters self read write" on public.recruiters
  for select using (auth.uid() = id);
create policy if not exists "recruiters self upsert" on public.recruiters
  for insert with check (auth.uid() = id);
create policy if not exists "recruiters self update" on public.recruiters
  for update using (auth.uid() = id);

alter table public.posts enable row level security;
create policy if not exists "posts public read" on public.posts for select using (visibility = 'public');
create policy if not exists "posts owner read" on public.posts for select using (auth.uid() = candidate_id);
create policy if not exists "posts owner insert" on public.posts for insert with check (auth.uid() = candidate_id);
create policy if not exists "posts owner update" on public.posts for update using (auth.uid() = candidate_id);

alter table public.bookmarks enable row level security;
create policy if not exists "bookmarks recruiter access" on public.bookmarks
  for select using (auth.uid() = recruiter_id);
create policy if not exists "bookmarks recruiter insert" on public.bookmarks
  for insert with check (auth.uid() = recruiter_id);

alter table public.notes enable row level security;
create policy if not exists "notes recruiter read" on public.notes
  for select using (auth.uid() = author_id or auth.uid() = candidate_id);
create policy if not exists "notes recruiter insert" on public.notes
  for insert with check (auth.uid() = author_id);

alter table public.applications enable row level security;
create policy if not exists "applications candidate access" on public.applications
  for select using (auth.uid() = candidate_id);
create policy if not exists "applications candidate insert" on public.applications
  for insert with check (auth.uid() = candidate_id);
create policy if not exists "applications candidate update own" on public.applications
  for update using (auth.uid() = candidate_id);
create policy if not exists "applications recruiter access" on public.applications
  for select using (exists(select 1 from public.jobs j where j.id = job_id and j.recruiter_id = auth.uid()));
create policy if not exists "applications recruiter insert" on public.applications
  for insert with check (exists(select 1 from public.jobs j where j.id = job_id and j.recruiter_id = auth.uid()));
create policy if not exists "applications recruiter update" on public.applications
  for update using (exists(select 1 from public.jobs j where j.id = job_id and j.recruiter_id = auth.uid()));

alter table public.candidate_cvs enable row level security;
create policy if not exists "candidate_cvs owner read" on public.candidate_cvs
  for select using (auth.uid() = candidate_id);
create policy if not exists "candidate_cvs owner insert" on public.candidate_cvs
  for insert with check (auth.uid() = candidate_id);

alter table public.matches enable row level security;
create policy if not exists "matches recruiter access" on public.matches
  for select using (exists(select 1 from public.jobs j where j.id = job_id and j.recruiter_id = auth.uid()));
create policy if not exists "matches recruiter insert" on public.matches
  for insert with check (exists(select 1 from public.jobs j where j.id = job_id and j.recruiter_id = auth.uid()));
create policy if not exists "matches candidate access" on public.matches
  for select using (auth.uid() = candidate_id);

alter table public.match_checks enable row level security;
create policy if not exists "match_checks candidate access" on public.match_checks
  for select using (auth.uid() = candidate_id);
create policy if not exists "match_checks candidate insert" on public.match_checks
  for insert with check (auth.uid() = candidate_id);

alter table public.jobs enable row level security;
create policy if not exists "jobs public read" on public.jobs for select using (true);
create policy if not exists "jobs recruiter insert" on public.jobs for insert with check (auth.uid() = recruiter_id);
create policy if not exists "jobs recruiter update" on public.jobs for update using (auth.uid() = recruiter_id);
