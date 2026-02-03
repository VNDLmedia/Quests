-- Fix RLS policies for user_quests to allow proper insert/update

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage own user_quests" ON user_quests;

-- Create separate policies for better control
CREATE POLICY "Users can view own quests" ON user_quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests" ON user_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests" ON user_quests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quests" ON user_quests
  FOR DELETE USING (auth.uid() = user_id);
