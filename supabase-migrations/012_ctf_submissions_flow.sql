-- ============================================================
-- CTF challenge submissions: author, status, user submissions
-- ============================================================

ALTER TABLE ctf_challenges ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE ctf_challenges ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

UPDATE ctf_challenges SET status = 'approved' WHERE is_active = true;
UPDATE ctf_challenges SET status = 'draft' WHERE is_active = false AND status = 'approved';

DROP POLICY IF EXISTS "Anyone can view active challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Admins can insert challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Admins can update challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Admins can delete challenges" ON ctf_challenges;

CREATE POLICY "View approved challenges"
  ON ctf_challenges FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admins can view all challenges"
  ON ctf_challenges FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Users can submit challenges"
  ON ctf_challenges FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can insert challenges"
  ON ctf_challenges FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update challenges"
  ON ctf_challenges FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete challenges"
  ON ctf_challenges FOR DELETE TO authenticated
  USING (is_admin());
