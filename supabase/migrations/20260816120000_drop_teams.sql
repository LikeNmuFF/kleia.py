-- Drop the Teams feature tables and clean up orphaned badge awards.

DROP TABLE IF EXISTS public.team_invites;
DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.teams;

DELETE FROM public.user_badges WHERE badge_id IN ('team_create', 'team_5');