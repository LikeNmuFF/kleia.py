-- Add thumbnail_url to webinars, drop certificate system

-- 1. Add thumbnail_url column
alter table public.webinars add column thumbnail_url text;

-- 2. Drop certificate-related objects
drop function if exists public.issue_webinar_certificate(uuid, uuid);
drop table if exists public.webinar_certificates cascade;

-- 3. Remove certificate_title column (no longer needed)
alter table public.webinars drop column if exists certificate_title;
