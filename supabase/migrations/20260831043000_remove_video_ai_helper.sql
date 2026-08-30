drop table if exists public.video_ai_messages;
drop table if exists public.video_ai_summaries;

delete from public.ai_rate_limit_events
where action in ('video_summary', 'video_question');
