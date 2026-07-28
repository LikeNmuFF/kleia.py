-- Fix 403 Forbidden on conversation creation
-- Run this in Supabase SQL Editor

-- 1. Ensure the membership check function exists
-- Change FROM:
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT USING (is_conversation_member(id));

-- TO:
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT TO authenticated USING (is_conversation_member(id));





CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop and recreate all conversation policies cleanly
-- Conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT USING (is_conversation_member(id));

-- Conversation members
DROP POLICY IF EXISTS "Authenticated users can add members" ON conversation_members;
CREATE POLICY "Authenticated users can add members"
  ON conversation_members FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view members of own conversations" ON conversation_members;
CREATE POLICY "Users can view members of own conversations"
  ON conversation_members FOR SELECT USING (is_conversation_member(conversation_members.conversation_id));

-- Messages
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT TO authenticated WITH CHECK (is_conversation_member(messages.conversation_id));

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT USING (is_conversation_member(messages.conversation_id));
