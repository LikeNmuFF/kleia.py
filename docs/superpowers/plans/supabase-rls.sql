-- Enable RLS on all tables
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;
alter table study_groups enable row level security;
alter table shared_notes enable row level security;
alter table progress_tracking enable row level security;
alter table playlists enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Posts policies
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Authenticated users can create posts" on posts for insert to authenticated with check (true);
create policy "Users can update own posts" on posts for update using (auth.uid() = author_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = author_id);

-- Comments policies
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Authenticated users can create comments" on comments for insert to authenticated with check (true);
create policy "Users can update own comments" on comments for update using (auth.uid() = author_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = author_id);

-- Conversations policies
create policy "Users can view own conversations" on conversations for select using (
  exists (
    select 1 from conversation_members
    where conversation_members.conversation_id = id
    and conversation_members.user_id = auth.uid()
  )
);
create policy "Authenticated users can create conversations" on conversations for insert to authenticated with check (true);

-- Conversation Members policies
create policy "Users can view members of own conversations" on conversation_members for select using (
  exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
    and cm.user_id = auth.uid()
  )
);
create policy "Authenticated users can add members" on conversation_members for insert to authenticated with check (true);

-- Messages policies
create policy "Users can view messages in own conversations" on messages for select using (
  exists (
    select 1 from conversation_members
    where conversation_members.conversation_id = messages.conversation_id
    and conversation_members.user_id = auth.uid()
  )
);
create policy "Authenticated users can send messages" on messages for insert to authenticated with check (
  exists (
    select 1 from conversation_members
    where conversation_members.conversation_id = messages.conversation_id
    and conversation_members.user_id = auth.uid()
  )
);

-- Events policies
create policy "Events are viewable by everyone" on events for select using (true);
create policy "Authenticated users can create events" on events for insert to authenticated with check (true);
create policy "Users can update own events" on events for update using (auth.uid() = creator_id);
create policy "Users can delete own events" on events for delete using (auth.uid() = creator_id);

-- Event Attendees policies
create policy "Attendees are viewable by everyone" on event_attendees for select using (true);
create policy "Authenticated users can RSVP" on event_attendees for insert to authenticated with check (true);
create policy "Users can update own RSVP" on event_attendees for update using (auth.uid() = user_id);

-- Study Groups policies
create policy "Study groups are viewable by everyone" on study_groups for select using (true);
create policy "Authenticated users can create groups" on study_groups for insert to authenticated with check (true);
create policy "Users can update own groups" on study_groups for update using (auth.uid() = creator_id);

-- Shared Notes policies
create policy "Notes are viewable by authenticated users" on shared_notes for select to authenticated using (true);
create policy "Authenticated users can create notes" on shared_notes for insert to authenticated with check (true);
create policy "Users can update own notes" on shared_notes for update using (auth.uid() = author_id);
create policy "Users can delete own notes" on shared_notes for delete using (auth.uid() = author_id);

-- Progress Tracking policies (private)
create policy "Users can view own progress" on progress_tracking for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on progress_tracking for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own progress" on progress_tracking for update using (auth.uid() = user_id);
create policy "Users can delete own progress" on progress_tracking for delete using (auth.uid() = user_id);

-- Playlists policies
create policy "Playlists are viewable by authenticated users" on playlists for select to authenticated using (true);
create policy "Authenticated users can create playlists" on playlists for insert to authenticated with check (true);
create policy "Users can update own playlists" on playlists for update using (auth.uid() = user_id);
create policy "Users can delete own playlists" on playlists for delete using (auth.uid() = user_id);
