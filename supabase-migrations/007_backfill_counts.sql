-- Backfill existing likes/comments counts (before triggers were created)
UPDATE posts p SET
  likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = p.id);
