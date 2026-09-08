-- Repair the partially applied feedback schema without replacing existing reports.
alter table public.feedback_reports
  add column if not exists status text not null default 'open'
    check (status in ('open', 'reviewing', 'planned', 'fixed', 'closed'));
alter table public.feedback_reports
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_feedback_reports_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists set_feedback_reports_updated_at on public.feedback_reports;
create trigger set_feedback_reports_updated_at
  before update on public.feedback_reports
  for each row execute function public.set_feedback_reports_updated_at();

drop policy if exists "Admins can update feedback reports" on public.feedback_reports;
create policy "Admins can update feedback reports"
  on public.feedback_reports for update to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'));
grant update on public.feedback_reports to authenticated;
