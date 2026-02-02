-- ═══════════════════════════════════════════════════════════════════════════
-- Social Features Migration
-- Neue Felder für Bio, LinkedIn, Leaderboard Consent und Score
-- ═══════════════════════════════════════════════════════════════════════════

-- Bio-Text für Profil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- LinkedIn Profil URL
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Leaderboard Sichtbarkeit (Datenschutz-Consent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN DEFAULT false;

-- Score-System (ersetzt XP für Ranking)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Kommentar: XP und Gems Spalten bleiben für Rückwärtskompatibilität,
-- werden aber im Frontend nicht mehr verwendet
