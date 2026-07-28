-- Security Fixes — Run this in Supabase SQL Editor
-- 1. Fix conversation_members INSERT: only allow adding yourself
-- 2. Fix event_attendees INSERT: enforce auth.uid() = user_id
-- 3. Add missing DELETE policies

-- Fix: conversation_members INSERT must match auth.uid()
DROP POLICY IF EXISTS "Authenticated users can add members" ON conversation_members;
CREATE POLICY "Authenticated users can add members"
  ON conversation_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix: event_attendees INSERT must match auth.uid() (prevent RSVP spoofing)
DROP POLICY IF EXISTS "Authenticated users can RSVP" ON event_attendees;
CREATE POLICY "Authenticated users can RSVP"
  ON event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add DELETE: users can remove themselves from conversations (leave)
DROP POLICY IF EXISTS "Users can remove themselves from conversations" ON conversation_members;
CREATE POLICY "Users can remove themselves from conversations"
  ON conversation_members FOR DELETE USING (auth.uid() = user_id);

-- Add DELETE: users can delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE USING (auth.uid() = sender_id);

-- Add DELETE: users can cancel their RSVP
DROP POLICY IF EXISTS "Users can delete own RSVP" ON event_attendees;
CREATE POLICY "Users can delete own RSVP"
  ON event_attendees FOR DELETE USING (auth.uid() = user_id);

-- Add DELETE: study group creators can delete their groups
DROP POLICY IF EXISTS "Users can delete own groups" ON study_groups;
CREATE POLICY "Users can delete own groups"
  ON study_groups FOR DELETE USING (auth.uid() = creator_id);
