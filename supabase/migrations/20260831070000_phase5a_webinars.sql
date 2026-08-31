create table if not exists public.webinars (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 140),
  description text not null check (char_length(trim(description)) between 10 and 4000),
  provider_name text not null default 'Kleia',
  provider_type text not null default 'internal' check (provider_type in ('internal', 'dict', 'school', 'partner', 'other')),
  verification_mode text not null default 'internal_attendance' check (verification_mode in ('internal_attendance', 'external_certificate', 'resource_only')),
  external_url text,
  capacity integer check (capacity is null or capacity > 0),
  min_attendance_minutes integer not null default 30 check (min_attendance_minutes >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  skill_category text not null default 'career' check (skill_category in ('learn', 'ctf', 'regexGolf', 'dailyCipher', 'career', 'other')),
  certificate_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'attended', 'completed', 'cancelled')),
  external_completion_url text,
  external_completion_verified boolean not null default false,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (webinar_id, user_id)
);

create table if not exists public.webinar_attendance (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  recorded_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  source text not null default 'manual' check (source in ('manual', 'meeting_import', 'system')),
  created_at timestamptz not null default now()
);

create table if not exists public.webinar_certificates (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  issued_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  certificate_code text not null unique,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (webinar_id, user_id)
);

create index if not exists webinars_starts_at_idx on public.webinars(starts_at);
create index if not exists webinars_active_idx on public.webinars(is_active);
create index if not exists webinar_registrations_user_idx on public.webinar_registrations(user_id);
create index if not exists webinar_registrations_webinar_idx on public.webinar_registrations(webinar_id);
create index if not exists webinar_attendance_webinar_user_idx on public.webinar_attendance(webinar_id, user_id);
create index if not exists webinar_certificates_user_idx on public.webinar_certificates(user_id);

alter table public.webinars enable row level security;
alter table public.webinar_registrations enable row level security;
alter table public.webinar_attendance enable row level security;
alter table public.webinar_certificates enable row level security;

create or replace function public.is_institution_staff(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role in ('admin', 'faculty')
  );
$$;

revoke all on function public.is_institution_staff(uuid) from public;
grant execute on function public.is_institution_staff(uuid) to authenticated;

create or replace function public.is_webinar_staff(target_webinar_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'admin'
  )
  or exists (
    select 1
    from public.webinars
    where id = target_webinar_id
      and creator_id = target_user_id
  )
  or exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'faculty'
  );
$$;

revoke all on function public.is_webinar_staff(uuid, uuid) from public;
grant execute on function public.is_webinar_staff(uuid, uuid) to authenticated;

create policy "Anyone can read active webinars"
  on public.webinars
  for select
  to authenticated
  using (is_active or public.is_webinar_staff(id, auth.uid()));

create policy "Faculty and admins can create webinars"
  on public.webinars
  for insert
  to authenticated
  with check (creator_id = auth.uid() and public.is_institution_staff(auth.uid()));

create policy "Webinar staff can update webinars"
  on public.webinars
  for update
  to authenticated
  using (public.is_webinar_staff(id, auth.uid()))
  with check (public.is_webinar_staff(id, auth.uid()));

create policy "Webinar staff can delete webinars"
  on public.webinars
  for delete
  to authenticated
  using (public.is_webinar_staff(id, auth.uid()));

create policy "Users and staff can read registrations"
  on public.webinar_registrations
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_webinar_staff(webinar_id, auth.uid())
  );

create policy "Users can register themselves"
  on public.webinar_registrations
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.webinars w
      where w.id = webinar_registrations.webinar_id
        and w.is_active
    )
  );

create policy "Users and staff can update registrations"
  on public.webinar_registrations
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_webinar_staff(webinar_id, auth.uid())
  )
  with check (
    user_id = auth.uid()
    or public.is_webinar_staff(webinar_id, auth.uid())
  );

create policy "Users and staff can read attendance"
  on public.webinar_attendance
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_webinar_staff(webinar_id, auth.uid())
  );

create policy "Webinar staff can insert attendance"
  on public.webinar_attendance
  for insert
  to authenticated
  with check (
    recorded_by = auth.uid()
    and public.is_webinar_staff(webinar_id, auth.uid())
  );

create policy "Webinar staff can update attendance"
  on public.webinar_attendance
  for update
  to authenticated
  using (public.is_webinar_staff(webinar_id, auth.uid()))
  with check (public.is_webinar_staff(webinar_id, auth.uid()));

create policy "Users and staff can read certificates"
  on public.webinar_certificates
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_webinar_staff(webinar_id, auth.uid())
  );

create policy "Webinar staff can issue certificates"
  on public.webinar_certificates
  for insert
  to authenticated
  with check (
    issued_by = auth.uid()
    and public.is_webinar_staff(webinar_id, auth.uid())
  );

create or replace function public.issue_webinar_certificate(target_webinar_id uuid, target_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  webinar_record public.webinars%rowtype;
  registration_record public.webinar_registrations%rowtype;
  attendance_minutes integer;
  certificate_record public.webinar_certificates%rowtype;
  generated_code text;
begin
  if not public.is_webinar_staff(target_webinar_id, auth.uid()) then
    raise exception 'Only webinar staff can issue certificates';
  end if;

  select * into webinar_record
  from public.webinars
  where id = target_webinar_id;

  if webinar_record.id is null then
    raise exception 'Webinar not found';
  end if;

  if webinar_record.verification_mode = 'resource_only' then
    raise exception 'This webinar does not issue certificates';
  end if;

  select * into registration_record
  from public.webinar_registrations
  where webinar_id = target_webinar_id
    and user_id = target_user_id;

  if registration_record.id is null then
    raise exception 'User is not registered for this webinar';
  end if;

  if webinar_record.verification_mode = 'internal_attendance' then
    select coalesce(sum(duration_minutes), 0)::integer into attendance_minutes
    from public.webinar_attendance
    where webinar_id = target_webinar_id
      and user_id = target_user_id;

    if attendance_minutes < webinar_record.min_attendance_minutes then
      raise exception 'Minimum attendance requirement has not been met';
    end if;
  end if;

  if webinar_record.verification_mode = 'external_certificate'
     and not registration_record.external_completion_verified then
    raise exception 'External certificate has not been verified';
  end if;

  generated_code := 'KLEIA-' || upper(substr(md5(target_webinar_id::text || ':' || target_user_id::text || ':' || now()::text), 1, 12));

  insert into public.webinar_certificates (webinar_id, user_id, issued_by, certificate_code)
  values (target_webinar_id, target_user_id, auth.uid(), generated_code)
  on conflict (webinar_id, user_id)
  do update set revoked_at = null
  returning * into certificate_record;

  update public.webinar_registrations
  set status = 'completed',
      updated_at = now()
  where webinar_id = target_webinar_id
    and user_id = target_user_id;

  return jsonb_build_object(
    'certificateId', certificate_record.id,
    'certificateCode', certificate_record.certificate_code
  );
end;
$$;

revoke all on function public.issue_webinar_certificate(uuid, uuid) from public;
grant execute on function public.issue_webinar_certificate(uuid, uuid) to authenticated;
