-- ═══════════════════════════════════════════════════════════════════════════
-- Event Challenges Migration
-- Move hardcoded EVENT_CHALLENGES to database for dynamic content management
-- ═══════════════════════════════════════════════════════════════════════════

-- Create event_challenges table
CREATE TABLE IF NOT EXISTS event_challenges (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  target INTEGER NOT NULL,
  progress_key TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  tier TEXT NOT NULL,
  gradient JSONB,
  checklist_items JSONB,
  country JSONB,
  location_id TEXT,
  requires_scan BOOLEAN DEFAULT false,
  reward JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE event_challenges ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can view active challenges)
CREATE POLICY "Event challenges are viewable by everyone" ON event_challenges
  FOR SELECT USING (is_active = true);

-- Admin-only write access (for future admin panel)
CREATE POLICY "Admins can manage event challenges" ON event_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.admin = true
    )
  );

-- Create indices for performance
CREATE INDEX idx_event_challenges_type ON event_challenges(type);
CREATE INDEX idx_event_challenges_tier ON event_challenges(tier);
CREATE INDEX idx_event_challenges_is_active ON event_challenges(is_active);
CREATE INDEX idx_event_challenges_sort_order ON event_challenges(sort_order);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed data with current hardcoded challenges
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO event_challenges (id, key, title, description, long_description, type, icon, target, progress_key, reward, xp_reward, tier, gradient, sort_order) VALUES
('quest_master_bronze', 'quest_master_bronze', 'Quest-Anfänger', 'Schließe 5 Quests ab', 'Zeige deine Entschlossenheit und schließe 5 beliebige Quests ab. Egal ob Daily, Story oder Social – jede Quest zählt!', 'quest_count', 'ribbon-outline', 5, 'completedQuests', '{"type": "physical_card", "cardId": "marcus", "claimLocation": "Info-Stand Halle A"}', 100, 'bronze', '["#CD7F32", "#8B4513"]', 1),

('quest_master_silver', 'quest_master_silver', 'Quest-Veteran', 'Schließe 15 Quests ab', 'Du bist auf dem besten Weg ein echter Pathfinder zu werden! Schließe 15 Quests ab für eine seltene Sammelkarte.', 'quest_count', 'ribbon', 15, 'completedQuests', '{"type": "physical_card", "cardId": "ramy", "claimLocation": "Info-Stand Halle A"}', 250, 'silver', '["#C0C0C0", "#808080"]', 2),

('quest_master_gold', 'quest_master_gold', 'Quest-Legende', 'Schließe 30 Quests ab', 'Nur die Besten schaffen es, 30 Quests zu meistern. Dafür gibt es die legendäre Roland Mack Karte!', 'quest_count', 'trophy', 30, 'completedQuests', '{"type": "physical_card", "cardId": "roland", "claimLocation": "Info-Stand Halle A", "special": "Legendär"}', 500, 'gold', '["#FFD700", "#FFA500"]', 3),

('rainbow_friends', 'rainbow_friends', 'Rainbow Connections', 'Füge Freunde aus jedem Team hinzu', 'Vernetze dich mit Spielern aus allen vier Teams: Blau, Gelb, Grün und Lila. Echte Pathfinder kennen keine Grenzen!', 'social', 'color-palette', 4, 'friendTeams', '{"type": "physical_card", "cardId": "ivo", "claimLocation": "Info-Stand Halle A"}', 200, 'special', '["#EC4899", "#8B5CF6"]', 4),

('workshop_visitor', 'workshop_visitor', 'Workshop-Entdecker', 'Besuche den Workshop', 'Nimm am Workshop teil und lerne die Geheimnisse der Kartografie. Scanne den QR-Code vor Ort!', 'location', 'school', 1, 'workshopVisited', '{"type": "physical_card", "cardId": "marcus", "claimLocation": "Workshop-Stand"}', 150, 'event', '["#10B981", "#059669"]', 5),

('social_butterfly', 'social_butterfly', 'Social Butterfly', 'Füge 10 Freunde hinzu', 'Baue dein Netzwerk aus! Verbinde dich mit 10 anderen Spielern und werde zum Social Butterfly.', 'social', 'people-circle', 10, 'friendCount', '{"type": "physical_card", "cardId": "ramy", "claimLocation": "Info-Stand Halle A"}', 150, 'silver', '["#EC4899", "#F472B6"]', 6),

('daily_dedication', 'daily_dedication', 'Tägliche Hingabe', 'Schließe 3 Tage hintereinander Daily Quests ab', 'Zeige deine Beständigkeit! Erfülle an 3 aufeinanderfolgenden Tagen mindestens eine Daily Quest.', 'streak', 'flame', 3, 'dailyStreak', '{"type": "physical_card", "cardId": "marcus", "claimLocation": "Info-Stand Halle A"}', 100, 'bronze', '["#EF4444", "#DC2626"]', 7),

('card_collector', 'card_collector', 'Kartensammler', 'Sammle alle 4 Sammelkarten', 'Schließe alle Challenges ab und sammle alle 4 einzigartigen Eternal Path Sammelkarten!', 'collection', 'albums', 4, 'collectedCards', '{"type": "physical_card", "cardId": "ivo", "claimLocation": "Info-Stand Halle A", "special": "Bonus-Karte"}', 300, 'gold', '["#8B5CF6", "#7C3AED"]', 8),

('networking_frankreich', 'networking_frankreich', 'French Connection', 'Netzwerke im französischen Bereich', 'Knüpfe Kontakte im französischen Themenbereich. Scanne 3 QR-Codes von anderen Teilnehmern!', 'networking', 'git-network', 3, 'networkingFrankreich', '{"type": "physical_card", "cardId": "marcus", "claimLocation": "Französischer Pavillon"}', 120, 'country', '["#002395", "#ED2939"]', 9),

('networking_england', 'networking_england', 'British Business', 'Netzwerke im englischen Bereich', 'Tea time für Networking! Verbinde dich mit 3 Teilnehmern im englischen Themenbereich.', 'networking', 'git-network', 3, 'networkingEngland', '{"type": "physical_card", "cardId": "ramy", "claimLocation": "Englischer Pavillon"}', 120, 'country', '["#012169", "#C8102E"]', 10),

('networking_luxemburg', 'networking_luxemburg', 'Luxembourg Links', 'Netzwerke im Luxemburger Bereich', 'Das Herz Europas für dein Netzwerk! Verbinde dich mit 3 Teilnehmern.', 'networking', 'business', 3, 'networkingLuxemburg', '{"type": "physical_card", "cardId": "ivo", "claimLocation": "Luxemburger Pavillon"}', 150, 'country', '["#00A3E0", "#006699"]', 11),

('explorer_deutschland', 'explorer_deutschland', 'Deutsche Gründlichkeit', 'Erkunde alle deutschen Attraktionen', 'Besuche 5 verschiedene Attraktionen im deutschen Themenbereich!', 'country', 'compass', 5, 'exploredDeutschland', '{"type": "physical_card", "cardId": "roland", "claimLocation": "Deutscher Pavillon", "special": "Legendär"}', 200, 'gold', '["#1a1a1a", "#DD0000"]', 12),

('adventure_griechenland', 'adventure_griechenland', 'Odyssee', 'Meistere die griechischen Abenteuer', 'Wie Odysseus selbst - bezwinge alle Herausforderungen im griechischen Bereich!', 'country', 'boat', 3, 'adventureGriechenland', '{"type": "physical_card", "cardId": "marcus", "claimLocation": "Griechischer Tempel"}', 180, 'special', '["#0D5EAF", "#1a3a5c"]', 13),

('viking_skandinavien', 'viking_skandinavien', 'Wikinger-Saga', 'Erobere den skandinavischen Bereich', 'Für Valhalla! Schließe alle Quests im nordischen Themenbereich ab.', 'country', 'snow', 4, 'vikingSkandinavia', '{"type": "physical_card", "cardId": "ivo", "claimLocation": "Wikinger-Dorf"}', 180, 'special', '["#006AA7", "#004F7F"]', 14);

-- Update challenges with checklist_items (rainbow_friends)
UPDATE event_challenges 
SET checklist_items = '[
  {"key": "blue", "label": "Blue Team", "color": "#3B82F6", "icon": "water"},
  {"key": "yellow", "label": "Yellow Team", "color": "#F59E0B", "icon": "sunny"},
  {"key": "green", "label": "Green Team", "color": "#10B981", "icon": "leaf"},
  {"key": "purple", "label": "Purple Team", "color": "#8B5CF6", "icon": "planet"}
]'::jsonb
WHERE id = 'rainbow_friends';

-- Update challenges with country data
UPDATE event_challenges 
SET country = '{"flag": "🇫🇷", "name": "Frankreich", "gradient": ["#002395", "#ED2939"]}'::jsonb
WHERE id = 'networking_frankreich';

UPDATE event_challenges 
SET country = '{"flag": "🇬🇧", "name": "England", "gradient": ["#012169", "#C8102E"]}'::jsonb
WHERE id = 'networking_england';

UPDATE event_challenges 
SET country = '{"flag": "🇱🇺", "name": "Luxemburg", "gradient": ["#00A3E0", "#006699"]}'::jsonb
WHERE id = 'networking_luxemburg';

UPDATE event_challenges 
SET country = '{"flag": "🇩🇪", "name": "Deutschland", "gradient": ["#1a1a1a", "#DD0000"]}'::jsonb
WHERE id = 'explorer_deutschland';

UPDATE event_challenges 
SET country = '{"flag": "🇬🇷", "name": "Griechenland", "gradient": ["#0D5EAF", "#1a3a5c"]}'::jsonb
WHERE id = 'adventure_griechenland';

UPDATE event_challenges 
SET country = '{"flag": "🇸🇪", "name": "Skandinavien", "gradient": ["#006AA7", "#004F7F"]}'::jsonb
WHERE id = 'viking_skandinavien';

-- Set location_id and requires_scan flags
UPDATE event_challenges 
SET location_id = 'workshop_main', requires_scan = true
WHERE id = 'workshop_visitor';

UPDATE event_challenges 
SET requires_scan = true
WHERE id IN ('networking_frankreich', 'networking_england', 'networking_luxemburg');
