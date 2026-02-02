-- ═══════════════════════════════════════════════════════════════════════════
-- Questline Challenges Migration
-- Adds support for challenges that consist of multiple sequential quests
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Add challenge_mode column to event_challenges
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE event_challenges 
ADD COLUMN IF NOT EXISTS challenge_mode TEXT DEFAULT 'progress' 
CHECK (challenge_mode IN ('progress', 'questline'));

COMMENT ON COLUMN event_challenges.challenge_mode IS 
  'progress: uses progressKey for tracking, questline: uses linked quests';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Create challenge_quests junction table
-- Links challenges to their quests with ordering
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS challenge_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id TEXT NOT NULL REFERENCES event_challenges(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  bonus_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique quest per challenge and unique order per challenge
  UNIQUE(challenge_id, quest_id),
  UNIQUE(challenge_id, sequence_order)
);

-- Enable RLS
ALTER TABLE challenge_quests ENABLE ROW LEVEL SECURITY;

-- Everyone can view challenge quests (they're public like challenges)
CREATE POLICY "Challenge quests are viewable by everyone" ON challenge_quests
  FOR SELECT USING (true);

-- Only admins can manage challenge quests
CREATE POLICY "Admins can manage challenge quests" ON challenge_quests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin = true
    )
  );

-- Indexes for performance
CREATE INDEX idx_challenge_quests_challenge_id ON challenge_quests(challenge_id);
CREATE INDEX idx_challenge_quests_quest_id ON challenge_quests(quest_id);
CREATE INDEX idx_challenge_quests_order ON challenge_quests(challenge_id, sequence_order);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Create user_challenge_quest_progress table
-- Tracks user progress through questline challenges
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_challenge_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES event_challenges(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only have one progress record per challenge-quest combination
  UNIQUE(user_id, challenge_id, quest_id)
);

-- Enable RLS
ALTER TABLE user_challenge_quest_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own questline progress" ON user_challenge_quest_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own questline progress" ON user_challenge_quest_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own questline progress" ON user_challenge_quest_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_ucqp_user_id ON user_challenge_quest_progress(user_id);
CREATE INDEX idx_ucqp_challenge_id ON user_challenge_quest_progress(challenge_id);
CREATE INDEX idx_ucqp_quest_id ON user_challenge_quest_progress(quest_id);
CREATE INDEX idx_ucqp_status ON user_challenge_quest_progress(status);
CREATE INDEX idx_ucqp_user_challenge ON user_challenge_quest_progress(user_id, challenge_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Auto-update updated_at trigger
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_ucqp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_challenge_quest_progress_timestamp
  BEFORE UPDATE ON user_challenge_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_ucqp_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Helper function to initialize questline progress for a user
-- Call this when a user starts a questline challenge
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION initialize_questline_progress(
  p_user_id UUID,
  p_challenge_id TEXT
)
RETURNS TABLE(quest_id UUID, sequence_order INTEGER, status TEXT) AS $$
DECLARE
  v_first_quest_id UUID;
BEGIN
  -- Get the first quest in the sequence
  SELECT cq.quest_id INTO v_first_quest_id
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id
  ORDER BY cq.sequence_order
  LIMIT 1;

  -- Insert progress records for all quests in the challenge
  INSERT INTO user_challenge_quest_progress (user_id, challenge_id, quest_id, status)
  SELECT 
    p_user_id,
    cq.challenge_id,
    cq.quest_id,
    CASE 
      WHEN cq.quest_id = v_first_quest_id THEN 'available'
      ELSE 'locked'
    END
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id
  ON CONFLICT (user_id, challenge_id, quest_id) DO NOTHING;

  -- Return the initialized progress
  RETURN QUERY
  SELECT ucqp.quest_id, cq.sequence_order, ucqp.status
  FROM user_challenge_quest_progress ucqp
  JOIN challenge_quests cq ON cq.quest_id = ucqp.quest_id AND cq.challenge_id = ucqp.challenge_id
  WHERE ucqp.user_id = p_user_id AND ucqp.challenge_id = p_challenge_id
  ORDER BY cq.sequence_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Helper function to complete a quest and unlock the next one
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION complete_questline_quest(
  p_user_id UUID,
  p_challenge_id TEXT,
  p_quest_id UUID
)
RETURNS TABLE(
  next_quest_id UUID,
  is_challenge_complete BOOLEAN,
  total_quests INTEGER,
  completed_quests INTEGER
) AS $$
DECLARE
  v_current_order INTEGER;
  v_next_quest_id UUID;
  v_total_required INTEGER;
  v_total_completed INTEGER;
BEGIN
  -- Get the current quest's order
  SELECT cq.sequence_order INTO v_current_order
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id AND cq.quest_id = p_quest_id;

  -- Mark current quest as completed
  UPDATE user_challenge_quest_progress
  SET status = 'completed', completed_at = NOW()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND quest_id = p_quest_id
    AND status IN ('available', 'in_progress');

  -- Get the next quest in sequence
  SELECT cq.quest_id INTO v_next_quest_id
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id 
    AND cq.sequence_order = v_current_order + 1;

  -- If there's a next quest, unlock it
  IF v_next_quest_id IS NOT NULL THEN
    UPDATE user_challenge_quest_progress
    SET status = 'available'
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND quest_id = v_next_quest_id
      AND status = 'locked';
  END IF;

  -- Count total required and completed quests
  SELECT 
    COUNT(*) FILTER (WHERE cq.is_required = true),
    COUNT(*) FILTER (WHERE ucqp.status = 'completed' AND cq.is_required = true)
  INTO v_total_required, v_total_completed
  FROM challenge_quests cq
  LEFT JOIN user_challenge_quest_progress ucqp 
    ON ucqp.quest_id = cq.quest_id 
    AND ucqp.challenge_id = cq.challenge_id
    AND ucqp.user_id = p_user_id
  WHERE cq.challenge_id = p_challenge_id;

  -- Return results
  RETURN QUERY SELECT 
    v_next_quest_id,
    v_total_completed >= v_total_required,
    v_total_required,
    v_total_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. View for questline challenge progress with details
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW questline_progress_details AS
SELECT 
  ucqp.id,
  ucqp.user_id,
  ucqp.challenge_id,
  ucqp.quest_id,
  ucqp.status,
  ucqp.completed_at,
  ucqp.created_at,
  ucqp.updated_at,
  cq.sequence_order,
  cq.is_required,
  cq.bonus_xp,
  q.title AS quest_title,
  q.description AS quest_description,
  q.icon AS quest_icon,
  q.xp_reward AS quest_xp_reward,
  q.gem_reward AS quest_gem_reward,
  q.requires_scan AS quest_requires_scan,
  ec.title AS challenge_title,
  ec.description AS challenge_description,
  ec.tier AS challenge_tier,
  ec.xp_reward AS challenge_xp_reward,
  ec.reward AS challenge_reward
FROM user_challenge_quest_progress ucqp
JOIN challenge_quests cq ON cq.challenge_id = ucqp.challenge_id AND cq.quest_id = ucqp.quest_id
JOIN quests q ON q.id = ucqp.quest_id
JOIN event_challenges ec ON ec.id = ucqp.challenge_id;

-- Grant access to authenticated users
GRANT SELECT ON questline_progress_details TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. View for challenge quests with quest details (for display)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW challenge_quests_with_details AS
SELECT 
  cq.id,
  cq.challenge_id,
  cq.quest_id,
  cq.sequence_order,
  cq.is_required,
  cq.bonus_xp,
  cq.created_at,
  q.title AS quest_title,
  q.description AS quest_description,
  q.type AS quest_type,
  q.category AS quest_category,
  q.icon AS quest_icon,
  q.xp_reward AS quest_xp_reward,
  q.gem_reward AS quest_gem_reward,
  q.requires_scan AS quest_requires_scan,
  q.metadata AS quest_metadata,
  ec.title AS challenge_title,
  ec.tier AS challenge_tier
FROM challenge_quests cq
JOIN quests q ON q.id = cq.quest_id
JOIN event_challenges ec ON ec.id = cq.challenge_id
ORDER BY cq.challenge_id, cq.sequence_order;

-- Grant access to everyone (challenges are public)
GRANT SELECT ON challenge_quests_with_details TO authenticated;
GRANT SELECT ON challenge_quests_with_details TO anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. Function to get questline summary for a user
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_questline_summary(
  p_user_id UUID,
  p_challenge_id TEXT
)
RETURNS TABLE(
  total_quests INTEGER,
  completed_quests INTEGER,
  current_quest_id UUID,
  current_quest_order INTEGER,
  is_complete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH quest_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE cq.is_required = true) AS total_required,
      COUNT(*) FILTER (WHERE ucqp.status = 'completed' AND cq.is_required = true) AS total_completed,
      MIN(cq.sequence_order) FILTER (WHERE ucqp.status IN ('available', 'in_progress')) AS current_order
    FROM challenge_quests cq
    LEFT JOIN user_challenge_quest_progress ucqp 
      ON ucqp.quest_id = cq.quest_id 
      AND ucqp.challenge_id = cq.challenge_id
      AND ucqp.user_id = p_user_id
    WHERE cq.challenge_id = p_challenge_id
  )
  SELECT 
    qs.total_required::INTEGER,
    qs.total_completed::INTEGER,
    cq.quest_id,
    qs.current_order::INTEGER,
    qs.total_completed >= qs.total_required
  FROM quest_stats qs
  LEFT JOIN challenge_quests cq 
    ON cq.challenge_id = p_challenge_id 
    AND cq.sequence_order = qs.current_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. Enable realtime for the new tables
-- ═══════════════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE user_challenge_quest_progress;
