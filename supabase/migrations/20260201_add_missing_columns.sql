-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add ALL missing columns to quests table
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this ENTIRE script in your Supabase SQL Editor!

-- First, check what columns exist
SELECT column_name FROM information_schema.columns WHERE table_name = 'quests';

-- Add ALL potentially missing columns
ALTER TABLE quests ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'explore';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'explore';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'compass';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 100;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS gem_reward INTEGER DEFAULT 50;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 1;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS time_limit INTEGER;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS expires_in INTEGER;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS requires_scan BOOLEAN DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS multi_locations UUID[];
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'easy';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'quests' ORDER BY ordinal_position;
