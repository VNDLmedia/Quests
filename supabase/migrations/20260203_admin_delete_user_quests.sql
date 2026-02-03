-- ═══════════════════════════════════════════════════════════════════════════
-- Add admin policy for deleting user_quests
-- Admins need to be able to reset quests for any user
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can delete any user_quests" ON user_quests;

-- Create admin delete policy
CREATE POLICY "Admins can delete any user_quests" ON user_quests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin = true
    )
  );
