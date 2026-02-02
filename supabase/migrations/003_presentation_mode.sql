-- ═══════════════════════════════════════════════════════════════════════════
-- PULSE - Presentation Mode & Points of Interest
-- ═══════════════════════════════════════════════════════════════════════════

-- Add 'poi' to quest types
ALTER TABLE quests 
DROP CONSTRAINT IF EXISTS quests_type_check;

ALTER TABLE quests 
ADD CONSTRAINT quests_type_check 
CHECK (type IN ('daily', 'explore', 'social', 'challenge', 'special', 'poi'));

-- ═══════════════════════════════════════════════════════════════════════════
-- PRESENTATION SETTINGS TABLE
-- Global settings for presentation mode
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS presentation_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_active BOOLEAN DEFAULT false,
  -- Auto-activation time (e.g., '2026-02-03 15:00:00')
  auto_activate_at TIMESTAMPTZ,
  -- Static map image URL (the floor plan / Lageplan)
  static_map_image_url TEXT,
  -- Hint text shown when all POIs are scanned
  completion_hint_title TEXT DEFAULT 'Geschafft!',
  completion_hint_text TEXT DEFAULT 'Du hast alle Stationen gefunden!',
  completion_hint_image_url TEXT,
  -- Secret card location hint
  secret_card_hint TEXT,
  -- Metadata for any additional settings
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO presentation_settings (id, is_active, auto_activate_at, static_map_image_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  false,
  '2026-02-03 15:00:00+01',
  '/cards/lageplan.jpeg'
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE presentation_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Presentation settings are public" ON presentation_settings
  FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update presentation settings" ON presentation_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND admin = true)
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- POINTS OF INTEREST TABLE (für statische Karte / Lageplan)
-- POIs werden relativ zum Bild positioniert (0-100% x/y)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS presentation_pois (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  -- Position relativ zum Bild (0-100%)
  position_x REAL NOT NULL CHECK (position_x >= 0 AND position_x <= 100),
  position_y REAL NOT NULL CHECK (position_y >= 0 AND position_y <= 100),
  -- Icon für die Anzeige
  icon TEXT DEFAULT 'location',
  icon_color TEXT DEFAULT '#E8B84A',
  -- QR-Code ID zum Scannen
  qr_code_id TEXT NOT NULL UNIQUE,
  -- Video URL (abgespielt beim Scannen)
  video_url TEXT,
  -- Info Content (nach Video angezeigt)
  info_title TEXT,
  info_text TEXT,
  info_image_url TEXT,
  -- Reihenfolge für die Anzeige
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE presentation_pois ENABLE ROW LEVEL SECURITY;

-- Everyone can read POIs
CREATE POLICY "POIs are public" ON presentation_pois
  FOR SELECT USING (true);

-- Admins can manage POIs
CREATE POLICY "Admins can manage POIs" ON presentation_pois
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_pois_qr_code ON presentation_pois(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_pois_active ON presentation_pois(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- POI SCANS TABLE (Tracking welche POIs ein User gescannt hat)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS poi_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES presentation_pois(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, poi_id)
);

ALTER TABLE poi_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own POI scans" ON poi_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own POI scans" ON poi_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_poi_scans_user ON poi_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_poi_scans_poi ON poi_scans(poi_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Check if presentation mode should be active
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION is_presentation_mode_active()
RETURNS BOOLEAN AS $$
DECLARE
  settings presentation_settings%ROWTYPE;
BEGIN
  SELECT * INTO settings
  FROM presentation_settings
  LIMIT 1;
  
  -- Manually activated
  IF settings.is_active THEN
    RETURN true;
  END IF;
  
  -- Auto-activate based on time
  IF settings.auto_activate_at IS NOT NULL AND NOW() >= settings.auto_activate_at THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Get user's POI progress
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_user_poi_progress(p_user_id UUID)
RETURNS TABLE(
  total_pois INTEGER,
  scanned_pois INTEGER,
  all_complete BOOLEAN,
  scanned_poi_ids UUID[]
) AS $$
DECLARE
  v_total INTEGER;
  v_scanned INTEGER;
  v_scanned_ids UUID[];
BEGIN
  -- Get total active POIs
  SELECT COUNT(*) INTO v_total
  FROM presentation_pois
  WHERE is_active = true;
  
  -- Get user's scanned POIs
  SELECT COUNT(*), ARRAY_AGG(poi_id) INTO v_scanned, v_scanned_ids
  FROM poi_scans
  WHERE user_id = p_user_id
  AND poi_id IN (SELECT id FROM presentation_pois WHERE is_active = true);
  
  RETURN QUERY SELECT 
    v_total,
    COALESCE(v_scanned, 0),
    COALESCE(v_scanned, 0) >= v_total AND v_total > 0,
    COALESCE(v_scanned_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
