-- ═══════════════════════════════════════════════════════════════════════════
-- Team System Migration
-- Add team field to profiles for the 4-team color system
-- ═══════════════════════════════════════════════════════════════════════════

-- Add team column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team VARCHAR(20) DEFAULT NULL;

-- Set random team for existing users who don't have one
UPDATE profiles 
SET team = (ARRAY['blue', 'yellow', 'green', 'purple'])[floor(random() * 4 + 1)]
WHERE team IS NULL;

-- Create index for team-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team);

-- Comment for documentation
COMMENT ON COLUMN profiles.team IS 'Team color: blue, yellow, green, or purple';
