-- Fix infinite recursion in conversation_members RLS policies
-- The problem: conversation_members SELECT policy queries conversation_members itself,
-- creating infinite recursion. Fix: use a SECURITY DEFINER function.

-- 1. Drop the recursive policies
DROP POLICY IF EXISTS "Users can view members of own conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;

-- 2. Create SECURITY DEFINER function to check membership (bypasses RLS)
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Recreate policies using the function (no more recursion)
CREATE POLICY "Users can view members of own conversations" ON conversation_members
  FOR SELECT USING (is_conversation_member(conversation_members.conversation_id));

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (is_conversation_member(id));

CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (is_conversation_member(messages.conversation_id));

CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (is_conversation_member(messages.conversation_id));
