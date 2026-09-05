drop policy if exists "Contributors can view own global challenges" on public.ctf_challenges;
create policy "Contributors can view own global challenges"
  on public.ctf_challenges for select to authenticated
  using (
    season_id is null
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'contributor'
    )
  );

drop policy if exists "Contributors can create global challenges" on public.ctf_challenges;
create policy "Contributors can create global challenges"
  on public.ctf_challenges for insert to authenticated
  with check (
    season_id is null
    and created_by = (select auth.uid())
    and status in ('draft', 'approved')
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'contributor'
    )
  );

drop policy if exists "Contributors can update own global challenges" on public.ctf_challenges;
create policy "Contributors can update own global challenges"
  on public.ctf_challenges for update to authenticated
  using (
    season_id is null
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'contributor'
    )
  )
  with check (
    season_id is null
    and created_by = (select auth.uid())
    and status in ('draft', 'approved')
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'contributor'
    )
  );
