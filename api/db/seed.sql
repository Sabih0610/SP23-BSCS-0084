-- Seed minimal data for testing
insert into public.jobs (slug, title, company_name, location, remote, status, description)
values ('sample-job', 'Sample Role', 'Acme Inc', 'Remote', true, 'open', 'Test job for connectivity.')
on conflict (slug) do nothing;

-- Seed a sample candidate + application with basic match data
with user_ins as (
    insert into public.users (id, email, role)
    values ('00000000-0000-0000-0000-000000000001', 'candidate@example.com', 'candidate')
    on conflict (id) do nothing
    returning id
), candidate_ins as (
    insert into public.candidates (id, headline, location, summary, skills)
    values ('00000000-0000-0000-0000-000000000001', 'Frontend Developer', 'Remote', 'React + TS dev', array['React','TypeScript','REST'])
    on conflict (id) do nothing
    returning id
)
insert into public.applications (job_id, candidate_id, status, match_score, match_level, matched_skills, missing_skills, rationale)
select j.id, '00000000-0000-0000-0000-000000000001', 'applied', 75, 'Medium', array['React','TypeScript'], array['AWS'], 'Seeded example match.'
from public.jobs j
where j.slug = 'sample-job'
on conflict do nothing;
