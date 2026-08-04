-- ============================================
-- KLEIA - Chat unread indicators & notifications
-- Adds last_message_at/preview to conversations,
-- trigger to auto-update, and indexes for unread queries.
-- ============================================

-- ===== 1. Add columns to conversations =====

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_message_preview text;

-- ===== 2. Indexes =====

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON conversations (last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, sender_id, read)
  WHERE read = false;

-- ===== 3. Trigger function: auto-update conversation meta on message INSERT =====

CREATE OR REPLACE FUNCTION update_conversation_meta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== 4. Drop old trigger if exists, then create =====

DROP TRIGGER IF EXISTS on_message_insert ON messages;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_meta();

-- ===== 5. Backfill existing conversations =====

UPDATE conversations c
SET
  last_message_at = m.created_at,
  last_message_preview = LEFT(m.content, 100)
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id, created_at, content
  FROM messages
  ORDER BY conversation_id, created_at DESC
) m
WHERE c.id = m.conversation_id
  AND c.last_message_at IS NULL;
