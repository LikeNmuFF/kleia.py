-- Fix: grant anon/authenticated SELECT on feedback_reports and add public read policy
-- (missing from initial migration due to partial apply)

grant select, insert, update on public.feedback_reports to authenticated;
grant select on public.feedback_reports to anon;

drop policy if exists "Anyone can read public app feedback" on public.feedback_reports;
create policy "Anyone can read public app feedback"
  on public.feedback_reports
  for select
  to anon, authenticated
  using (type = 'app_feedback' and allow_public = true and rating is not null);
