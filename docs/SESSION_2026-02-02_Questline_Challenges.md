# Session Summary: Questline Challenges Implementation

**Date:** 2026-02-02  
**Feature:** Quest Line Challenges - Multi-step sequential quest challenges

---

## Overview

Implemented a new challenge system where challenges can consist of multiple quests that must be completed in a specific order (quest lines). Also created an admin UI for creating new challenges.

---

## Problem Statement

The existing challenge system only supported "progress-based" challenges that tracked aggregate metrics (e.g., "complete 5 quests", "add 10 friends"). The user wanted:

1. Challenges that consist of multiple specific quests completed in sequence
2. A UI flow for admins to create new challenges
3. Proper progress tracking in the database

---

## Solution Architecture

### Two Challenge Modes

| Mode | Description | Progress Tracking |
|------|-------------|-------------------|
| `progress` | Existing behavior - tracks via `progressKey` | Calculated from player stats |
| `questline` | New - sequence of specific quests | Tracked in `user_challenge_quest_progress` |

### Data Flow

```
User starts questline challenge
    ↓
initialize_questline_progress() creates records
    ↓
First quest status = 'available', rest = 'locked'
    ↓
User completes quest (via QR scan, etc.)
    ↓
complete_questline_quest() marks complete, unlocks next
    ↓
All required quests complete → Challenge complete
    ↓
User claims reward
```

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260203_questline_challenges.sql` | Database schema, tables, functions, RLS policies |
| `src/game/hooks/useChallenges.js` | React hook for challenge management |
| `src/game/services/ChallengeCreationService.js` | Backend service for CRUD operations |
| `src/components/ChallengeCreationModal.js` | Admin UI for creating challenges |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/game/config/challenges.js` | Added `CHALLENGE_MODES`, questline helper functions |
| `src/game/GameProvider.js` | Added questline state, actions, and functions |
| `src/game/hooks/index.js` | Export `useChallenges` hook |
| `src/game/services/index.js` | Export `ChallengeCreationService` |
| `src/components/index.js` | Export `ChallengeCreationModal` |
| `src/screens/QuestLogScreen.js` | Questline UI, expanded modal, admin create button |

---

## Database Schema

### New Column: `event_challenges.challenge_mode`

```sql
ALTER TABLE event_challenges 
ADD COLUMN challenge_mode TEXT DEFAULT 'progress' 
CHECK (challenge_mode IN ('progress', 'questline'));
```

### New Table: `challenge_quests`

Links challenges to quests with ordering:

```sql
CREATE TABLE challenge_quests (
  id UUID PRIMARY KEY,
  challenge_id TEXT REFERENCES event_challenges(id),
  quest_id UUID REFERENCES quests(id),
  sequence_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  bonus_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, quest_id),
  UNIQUE(challenge_id, sequence_order)
);
```

### New Table: `user_challenge_quest_progress`

Tracks user progress through questlines:

```sql
CREATE TABLE user_challenge_quest_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  challenge_id TEXT REFERENCES event_challenges(id),
  quest_id UUID REFERENCES quests(id),
  status TEXT DEFAULT 'locked' 
    CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, quest_id)
);
```

### Database Functions

| Function | Purpose |
|----------|---------|
| `initialize_questline_progress(user_id, challenge_id)` | Creates progress records, sets first quest to 'available' |
| `complete_questline_quest(user_id, challenge_id, quest_id)` | Marks complete, unlocks next, returns completion status |
| `get_questline_summary(user_id, challenge_id)` | Returns progress summary |

### Views

| View | Purpose |
|------|---------|
| `questline_progress_details` | User progress with quest and challenge details |
| `challenge_quests_with_details` | Challenge quests with full quest information |

---

## Challenge Creation Modal

5-step wizard for admins:

1. **Basic Info**: Title, description, icon, tier, gradient colors
2. **Challenge Mode**: Progress-based or Questline
3. **Quest Selection** (questline only): Search, select, reorder quests
4. **Rewards**: XP reward, physical card selection, claim location
5. **Review & Confirm**: Preview and create

---

## QuestLogScreen Updates

### New Features

- **Admin Create Button**: Opens Challenge Creation Modal
- **Questline Challenges Section**: Distinct card design with progress bar
- **Expanded Challenge Modal**:
  - Challenge header with gradient and stats
  - Quest sequence visualization with status indicators
  - Locked/Available/Completed visual states
  - Reward preview with claim location
  - Start Challenge / Claim Reward buttons

### Quest Sequence Status Indicators

| Status | Visual | Meaning |
|--------|--------|---------|
| `locked` | Gray dot, dimmed card | Previous quest not complete |
| `available` | Primary color dot | Can be started |
| `in_progress` | Yellow dot | Currently active |
| `completed` | Green dot, green border | Finished |

---

## API Reference

### useChallenges Hook

```javascript
const {
  // Data
  challenges,           // All challenges with progress
  questlineChallenges, // Only questline challenges
  progressChallenges,  // Only progress-based
  completedChallenges,
  claimedChallenges,
  availableToClaim,
  questlineProgress,
  
  // Actions
  startChallenge,      // Start a questline
  claimChallenge,      // Claim reward
  getQuestlineDetails, // Get quest sequence with status
  getChallengeStatus,  // not_started/in_progress/completed/claimed
  refreshChallenges,
} = useChallenges();
```

### GameProvider New Functions

```javascript
// Start a questline challenge
await startQuestlineChallenge(challengeId);

// Complete a quest within a questline
await completeQuestlineQuest(challengeId, questId);

// Check if quest belongs to a questline and handle completion
await handleQuestCompletionForQuestline(questId);

// Refresh questline progress
await fetchQuestlineProgress();
```

---

## Integration Notes

### Automatic Quest Completion Handling

When `completeQuest()` is called, it automatically checks if the quest belongs to a questline and updates progress:

```javascript
// In GameProvider.js completeQuest()
const questlineResults = await handleQuestCompletionForQuestline(questId);
```

### Existing Challenges Unchanged

All existing challenges remain as `progress` mode. No existing data was modified. New questline challenges can be created via:

1. **Admin UI**: Challenge Creation Modal in QuestLogScreen
2. **SQL**: Insert into `event_challenges` with `challenge_mode='questline'` and link quests in `challenge_quests`

---

## Example: Creating a Questline Challenge via SQL

```sql
-- 1. Create the challenge
INSERT INTO event_challenges (
  id, key, title, description, type, icon, target, 
  progress_key, xp_reward, tier, gradient, 
  reward, challenge_mode, is_active, sort_order
) VALUES (
  'hidden_codes_explorer',
  'hidden_codes_explorer',
  'Hidden Codes Explorer',
  'Find all hidden QR codes in the park',
  'quest_count',
  'qr-code',
  5,
  'questline_hidden_codes_explorer',
  300,
  'gold',
  '["#8B5CF6", "#7C3AED"]',
  '{"type": "physical_card", "cardId": "roland", "claimLocation": "Info-Stand"}',
  'questline',
  true,
  20
);

-- 2. Link quests in sequence
INSERT INTO challenge_quests (challenge_id, quest_id, sequence_order) VALUES
  ('hidden_codes_explorer', '48956b37-e8c7-49b6-a864-556ec2c250ea', 1),  -- Hidden Codes
  ('hidden_codes_explorer', '66db3818-a11f-4c55-a92f-a7893db443b5', 2),  -- Hidden Codes #1
  ('hidden_codes_explorer', 'e6b34a4f-0b00-409e-9a09-d66d9f6e2abd', 3),  -- Hidden Codes #3
  ('hidden_codes_explorer', '08d89886-7ea7-4a20-a8ef-f7298548a552', 4),  -- Hidden Codes #4
  ('hidden_codes_explorer', '2ed724b7-7b21-4c03-acef-76d8afa26612', 5);  -- Hidden Codes #5
```

---

## Testing Checklist

- [ ] Create questline challenge via admin modal
- [ ] Start questline challenge as user
- [ ] Verify first quest is available, rest locked
- [ ] Complete first quest, verify second unlocks
- [ ] Complete all quests, verify challenge shows as complete
- [ ] Claim reward, verify card and XP awarded
- [ ] Verify progress persists across sessions

---

## Future Enhancements

1. **Optional quests**: Support bonus quests that aren't required for completion
2. **Time limits**: Add time-based questlines
3. **Branching paths**: Allow multiple quest paths within a questline
4. **Progress notifications**: Push notifications when quests unlock
5. **Questline editor**: Drag-and-drop quest sequence editor with visual connections
