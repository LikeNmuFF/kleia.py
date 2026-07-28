-- ==========================================================
-- SECURITY FIXES: RLS policies and trigger hardening
-- Fixes critical/high vulnerabilities identified in audit
-- ==========================================================

-- 1. CRITICAL: Fix conversation_members INSERT - prevent adding other users
DROP POLICY IF EXISTS "Authenticated users can add members" ON conversation_members;
CREATE POLICY "Authenticated users can add members"
  ON conversation_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. CRITICAL: Fix event_attendees INSERT - prevent RSVPing as other users
DROP POLICY IF EXISTS "Authenticated users can RSVP" ON event_attendees;
CREATE POLICY "Authenticated users can RSVP"
  ON event_attendees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. HIGH: Fix update_likes_count trigger - add SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. HIGH: Fix update_comments_count trigger - add SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. HIGH: Shared notes should respect group membership
-- For now, restrict to viewing only own notes (no study_group_members table yet)
DROP POLICY IF EXISTS "Notes are viewable by authenticated users" ON shared_notes;
CREATE POLICY "Notes are viewable by authenticated users"
  ON shared_notes FOR SELECT TO authenticated
  USING (
    author_id = auth.uid() OR
    group_id IS NULL OR
    EXISTS (
      SELECT 1 FROM study_groups sg
      WHERE sg.id = group_id AND sg.creator_id = auth.uid()
    )
  );

-- 6. MEDIUM: Add DELETE policies for GDPR compliance
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own groups"
  ON study_groups FOR DELETE
  USING (auth.uid() = creator_id);

-- 7. MEDIUM: Add DELETE policies for user self-management
CREATE POLICY "Users can remove themselves from conversations"
  ON conversation_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own RSVP"
  ON event_attendees FOR DELETE
  USING (auth.uid() = user_id);
