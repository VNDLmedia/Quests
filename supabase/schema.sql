-- ═══════════════════════════════════════════════════════════════════════════
-- PULSE - Database Schema for Supabase
-- ═══════════════════════════════════════════════════════════════════════════
-- Führe dieses SQL in deinem Supabase Dashboard unter SQL Editor aus

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES TABLE (extends auth.users)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  gems INTEGER DEFAULT 100,
  login_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  streak_freeze_count INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  total_distance_walked REAL DEFAULT 0,
  total_packs_opened INTEGER DEFAULT 0,
  packs_since_last_legendary INTEGER DEFAULT 0,
  card_collection JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New Player')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- ACHIEVEMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATIONS TABLE (POIs auf der Karte)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'explore',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  address TEXT,
  image_url TEXT,
  icon TEXT DEFAULT 'location',
  is_active BOOLEAN DEFAULT true,
  crowd_level TEXT DEFAULT 'low' CHECK (crowd_level IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are public" ON locations
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTS TABLE (Quest-Vorlagen)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS quests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'explore' CHECK (type IN ('daily', 'explore', 'social', 'challenge', 'special')),
  category TEXT DEFAULT 'explore',
  icon TEXT DEFAULT 'compass',
  xp_reward INTEGER DEFAULT 100,
  gem_reward INTEGER DEFAULT 50,
  target_value INTEGER DEFAULT 1,
  time_limit INTEGER, -- in minutes
  expires_in INTEGER, -- in hours
  requires_scan BOOLEAN DEFAULT false,
  location_id UUID REFERENCES locations(id),
  multi_locations UUID[],
  is_active BOOLEAN DEFAULT true,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quests are public" ON quests
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- USER_QUESTS TABLE (Benutzer-Quest-Fortschritt)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, quest_id)
);

ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_quests" ON user_quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own user_quests" ON user_quests
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- FRIENDSHIPS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage own friendships" ON friendships
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- LEADERBOARD TABLE (for fast queries)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  weekly_xp INTEGER DEFAULT 0,
  monthly_xp INTEGER DEFAULT 0,
  all_time_xp INTEGER DEFAULT 0,
  weekly_rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is public" ON leaderboard
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHALLENGES TABLE (1v1 between friends)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined', 'expired')),
  winner_id UUID REFERENCES profiles(id),
  challenger_progress INTEGER DEFAULT 0,
  opponent_progress INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can manage own challenges" ON challenges
  FOR ALL USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ACTIVITY FEED TABLE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity feed is public" ON activity_feed
  FOR SELECT USING (true);

CREATE POLICY "Users can create own activities" ON activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- DAILY REWARDS TABLE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS daily_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_date DATE NOT NULL,
  streak_day INTEGER NOT NULL,
  xp_claimed INTEGER NOT NULL,
  bonus_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, claimed_date)
);

ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards" ON daily_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can claim own rewards" ON daily_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- USEFUL FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: Add XP to user
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current values
  SELECT xp, level INTO v_current_xp, v_current_level
  FROM profiles WHERE id = p_user_id;
  
  -- Update XP
  UPDATE profiles 
  SET xp = xp + p_amount, updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Calculate new level (simple formula: level = floor(sqrt(xp/100)) + 1)
  v_new_level := FLOOR(SQRT((v_current_xp + p_amount) / 100.0)) + 1;
  
  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE profiles SET level = v_new_level WHERE id = p_user_id;
  END IF;
  
  -- Update leaderboard
  INSERT INTO leaderboard (user_id, weekly_xp, monthly_xp, all_time_xp)
  VALUES (p_user_id, p_amount, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET weekly_xp = leaderboard.weekly_xp + p_amount,
      monthly_xp = leaderboard.monthly_xp + p_amount,
      all_time_xp = leaderboard.all_time_xp + p_amount,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update user streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS TABLE(streak INTEGER, xp_reward INTEGER, is_new_day BOOLEAN) AS $$
DECLARE
  v_last_login DATE;
  v_current_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_streak_day INTEGER;
  v_xp INTEGER;
BEGIN
  -- Get current values
  SELECT last_login_date, login_streak INTO v_last_login, v_current_streak
  FROM profiles WHERE id = p_user_id;
  
  -- Check if already logged in today
  IF v_last_login = v_today THEN
    RETURN QUERY SELECT v_current_streak, 0, false;
    RETURN;
  END IF;
  
  -- Check streak continuity
  IF v_last_login = v_today - 1 THEN
    -- Continue streak
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_login IS NULL OR v_last_login < v_today - 1 THEN
    -- Reset streak
    v_current_streak := 1;
  END IF;
  
  -- Cap streak day for rewards at 7 (cycles weekly)
  v_streak_day := ((v_current_streak - 1) % 7) + 1;
  
  -- Calculate XP based on streak day
  v_xp := CASE v_streak_day
    WHEN 1 THEN 50
    WHEN 2 THEN 75
    WHEN 3 THEN 100
    WHEN 4 THEN 150
    WHEN 5 THEN 200
    WHEN 6 THEN 300
    WHEN 7 THEN 500
    ELSE 50
  END;
  
  -- Update profile
  UPDATE profiles 
  SET login_streak = v_current_streak, 
      last_login_date = v_today,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record daily reward
  INSERT INTO daily_rewards (user_id, claimed_date, streak_day, xp_claimed)
  VALUES (p_user_id, v_today, v_streak_day, v_xp);
  
  -- Add XP
  PERFORM add_xp(p_user_id, v_xp);
  
  RETURN QUERY SELECT v_current_streak, v_xp, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- REALTIME SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE user_quests;

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_status ON user_quests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly ON leaderboard(weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_users ON challenges(challenger_id, opponent_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- QR CODES TABLE (Admin registrierte QR-Codes für Features)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_code_id TEXT NOT NULL UNIQUE, -- Die ID die auf dem physischen QR-Code steht
  name TEXT, -- Optionaler Name/Beschreibung
  feature_type TEXT DEFAULT 'reward' CHECK (feature_type IN ('reward', 'quest', 'pack', 'gems', 'xp', 'card', 'event', 'location', 'custom')),
  feature_value JSONB DEFAULT '{}', -- z.B. {"gems": 100} oder {"pack_type": "premium"}
  is_active BOOLEAN DEFAULT true,
  single_use BOOLEAN DEFAULT true, -- Kann nur einmal verwendet werden
  max_uses INTEGER, -- Null = unlimited wenn single_use false
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- Null = kein Ablaufdatum
  registered_by UUID REFERENCES profiles(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Admins können QR-Codes sehen und bearbeiten
CREATE POLICY "QR codes are viewable by admins" ON qr_codes
  FOR SELECT USING (true);

CREATE POLICY "QR codes can be managed by admins" ON qr_codes
  FOR ALL USING (true); -- In Production: hier Admin-Check einfügen

-- Index für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_id ON qr_codes(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- QR CODE SCANS TABLE (Tracking wer was gescannt hat)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qr_code_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  reward_given JSONB DEFAULT '{}', -- Was der User bekommen hat
  location JSONB DEFAULT '{}', -- Optional: wo gescannt wurde
  UNIQUE(qr_code_id, user_id) -- Jeder User kann jeden Code nur einmal scannen
);

ALTER TABLE qr_code_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON qr_code_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON qr_code_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_qr_scans_user ON qr_code_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr ON qr_code_scans(qr_code_id);

