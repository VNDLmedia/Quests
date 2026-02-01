# 🔧 DATABASE FIX - RUN THIS NOW!

Your Supabase database is missing required columns. **Copy and run this SQL:**

## Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**

## Step 2: Copy & Run This SQL

```sql
-- Add ALL missing columns to quests table
ALTER TABLE quests ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'explore';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'explore';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'compass';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 100;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS gem_reward INTEGER DEFAULT 50;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 1;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS requires_scan BOOLEAN DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
```

## Step 3: Click RUN

## Step 4: Verify
Run this to check columns were added:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'quests' ORDER BY ordinal_position;
```

## Step 5: Refresh your app and try again!

---

## Alternative: Full Schema Reset

If the above doesn't work, you may need to recreate the quests table entirely. 
**WARNING: This will delete all existing quests!**

```sql
DROP TABLE IF EXISTS quests CASCADE;

CREATE TABLE quests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'explore',
  category TEXT DEFAULT 'explore',
  icon TEXT DEFAULT 'compass',
  xp_reward INTEGER DEFAULT 100,
  gem_reward INTEGER DEFAULT 50,
  target_value INTEGER DEFAULT 1,
  requires_scan BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quests are public" ON quests FOR SELECT USING (true);

CREATE POLICY "Admins can create quests" ON quests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND admin = true)
  );
```
