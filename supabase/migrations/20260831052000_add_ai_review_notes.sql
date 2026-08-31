alter table public.ctf_challenges
  add column if not exists ai_review_notes text;

create index if not exists idx_ctf_challenges_ai_review_notes
  on public.ctf_challenges(ai_review_notes)
  where ai_review_notes is not null;
