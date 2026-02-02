-- ═══════════════════════════════════════════════════════════════════════════
-- User Event Challenges Tracking
-- Track which users have completed which event challenges
-- ═══════════════════════════════════════════════════════════════════════════

-- Create user_event_challenges table
CREATE TABLE IF NOT EXISTS user_event_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id TEXT REFERENCES event_challenges(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'claimed')),
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE user_event_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view their own challenge progress
CREATE POLICY "Users can view their own challenge progress" ON user_event_challenges
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own challenge progress
CREATE POLICY "Users can insert their own challenge progress" ON user_event_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own challenge progress
CREATE POLICY "Users can update their own challenge progress" ON user_event_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indices for performance
CREATE INDEX idx_user_event_challenges_user_id ON user_event_challenges(user_id);
CREATE INDEX idx_user_event_challenges_challenge_id ON user_event_challenges(challenge_id);
CREATE INDEX idx_user_event_challenges_status ON user_event_challenges(status);
CREATE INDEX idx_user_event_challenges_completed_at ON user_event_challenges(completed_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_event_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_event_challenges_timestamp
  BEFORE UPDATE ON user_event_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_event_challenges_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Helper view for challenge progress with details
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW user_event_challenges_with_details AS
SELECT 
  uec.id,
  uec.user_id,
  uec.challenge_id,
  uec.status,
  uec.progress,
  uec.completed_at,
  uec.claimed_at,
  uec.created_at,
  uec.updated_at,
  ec.title,
  ec.description,
  ec.target,
  ec.type,
  ec.tier,
  ec.xp_reward,
  ec.reward
FROM user_event_challenges uec
JOIN event_challenges ec ON uec.challenge_id = ec.id;

-- Grant access to the view
GRANT SELECT ON user_event_challenges_with_details TO authenticated;
