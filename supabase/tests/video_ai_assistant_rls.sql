begin;

select plan(6);

select has_table('public', 'video_ai_summaries', 'video_ai_summaries table exists');
select has_table('public', 'video_ai_messages', 'video_ai_messages table exists');
select has_table('public', 'ai_rate_limit_events', 'ai_rate_limit_events table exists');

select policies_are(
  'public',
  'video_ai_messages',
  array[
    'Users can read their own video AI messages',
    'Users can create their own video AI messages'
  ],
  'video_ai_messages has user-scoped policies'
);

select policies_are(
  'public',
  'ai_rate_limit_events',
  array[
    'Users can read their own AI rate limit events',
    'Users can create their own AI rate limit events'
  ],
  'ai_rate_limit_events has user-scoped policies'
);

select policies_are(
  'public',
  'video_ai_summaries',
  array[
    'Authenticated users can read video AI summaries',
    'Authenticated users can create video AI summaries',
    'Summary creators can update summaries'
  ],
  'video_ai_summaries has cache-friendly authenticated policies'
);

select * from finish();

rollback;
