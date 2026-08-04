-- SECURITY DEFINER function to create conversations, bypassing RLS entirely
-- This avoids all RLS policy issues by running as the function owner

CREATE OR REPLACE FUNCTION create_direct_conversation(other_user_id uuid)
RETURNS json AS $$
DECLARE
  my_id uuid;
  conv_id uuid;
  existing_id uuid;
BEGIN
  my_id := auth.uid();
  
  IF my_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Check for existing direct conversation between these two users
  SELECT cm1.conversation_id INTO existing_id
  FROM conversation_members cm1
  INNER JOIN conversation_members cm2 
    ON cm1.conversation_id = cm2.conversation_id
  WHERE cm1.user_id = my_id 
    AND cm2.user_id = other_user_id
    AND cm1.conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = my_id
    )
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN json_build_object('conversationId', existing_id);
  END IF;

  -- Create new conversation
  INSERT INTO conversations (type) VALUES ('direct') RETURNING id INTO conv_id;

  -- Add both members
  INSERT INTO conversation_members (conversation_id, user_id) VALUES (conv_id, my_id);
  INSERT INTO conversation_members (conversation_id, user_id) VALUES (conv_id, other_user_id);

  RETURN json_build_object('conversationId', conv_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
