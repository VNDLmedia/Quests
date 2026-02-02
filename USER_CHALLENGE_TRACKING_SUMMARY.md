# User Challenge Tracking - Implementation Summary

## Overview
Added database tracking for user event challenge completion, allowing users to claim challenges and persist their progress across sessions.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/20260202_user_event_challenges.sql`

Created `user_event_challenges` table to track user progress:

**Schema**:
```sql
- id: UUID (primary key)
- user_id: UUID (references profiles)
- challenge_id: TEXT (references event_challenges)
- status: TEXT ('in_progress', 'completed', 'claimed')
- progress: INTEGER
- completed_at: TIMESTAMPTZ
- claimed_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Features**:
- Unique constraint on (user_id, challenge_id) to prevent duplicates
- RLS policies for user privacy (users can only see their own progress)
- Automatic updated_at timestamp trigger
- Performance indices on user_id, challenge_id, status, completed_at
- Helper view `user_event_challenges_with_details` with challenge details

### 2. GameProvider Updates
**File**: `src/game/GameProvider.js`

**State Management**:
- Added `userEventChallenges: []` to state
- Added `SET_USER_EVENT_CHALLENGES` action
- Added `UPDATE_USER_EVENT_CHALLENGE` action
- Implemented reducer cases for both actions

**New Functions**:

**`fetchUserEventChallenges()`**:
```javascript
- Fetches user's challenge progress from database
- Called on login/signup
- Updates state with user's challenge data
```

**`claimEventChallenge(challengeId, xpReward)`**:
```javascript
- Marks challenge as claimed in database
- Updates or creates user_event_challenges record
- Awards XP to user
- Updates local state immediately
```

**Integration Points**:
- Fetch user challenges on login (3 locations)
- Export functions in context value
- Available via `useGame()` hook

### 3. QuestLogScreen Updates
**File**: `src/screens/QuestLogScreen.js`

**Key Changes**:
1. **Removed local state**: Eliminated `claimedChallenges` useState (now from database)

2. **Enhanced challenge data**:
   ```javascript
   - Added isClaimed: boolean (from database)
   - Added claimedAt: timestamp (from database)
   - Added completedAt: timestamp (from database)
   ```

3. **Updated completion logic**:
   ```javascript
   - handleClaimChallenge now uses claimEventChallenge()
   - Async/await for database operations
   - Error handling for failed claims
   ```

4. **UI updates**:
   - All filters use `c.isClaimed` instead of local state
   - Card collection shows claimed challenges from database
   - Completed challenges persist across app restarts

### 4. Data Flow

```
User Claims Challenge
  ↓
handleClaimChallenge()
  ↓
claimEventChallenge(id, xp) in GameProvider
  ↓
Supabase INSERT/UPDATE user_event_challenges
  ↓
Update local state (SET_USER_EVENT_CHALLENGES)
  ↓
useMemo recalculates eventChallenges with isClaimed
  ↓
UI updates to show claimed status
```

## Features

### Persistence
- ✅ Challenge completion persists across sessions
- ✅ Claimed challenges remain claimed after app restart
- ✅ Progress tracked per user in database

### Status Tracking
Three states per user-challenge:
1. **in_progress**: User is working on the challenge
2. **completed**: User has met the requirements
3. **claimed**: User has claimed the reward

### Security
- RLS policies ensure users can only:
  - View their own progress
  - Insert their own records
  - Update their own records
- Admin access via profiles.admin flag

### Performance
- Indices on frequently queried columns
- Single query to fetch all user challenges on login
- Local state updates for immediate UI feedback

## Migration Instructions

To apply both migrations to your Supabase instance:

1. Navigate to Supabase Dashboard → SQL Editor

2. Run the event challenges migration:
   ```sql
   -- Run: supabase/migrations/20260202_event_challenges.sql
   ```

3. Run the user challenges tracking migration:
   ```sql
   -- Run: supabase/migrations/20260202_user_event_challenges.sql
   ```

4. Verify tables:
   ```sql
   SELECT * FROM event_challenges;
   SELECT * FROM user_event_challenges;
   ```

## Testing Checklist

- [x] Migration files syntax validated
- [x] No linter errors in modified files
- [x] GameProvider state properly initialized
- [x] Fetch functions integrated into auth flow
- [x] Claim function handles errors gracefully
- [x] QuestLogScreen uses database completion status
- [x] UI filters work with isClaimed property
- [x] Card collection shows claimed challenges

## API Reference

### useGame Hook

```javascript
const { 
  eventChallenges,           // Array of challenge definitions
  userEventChallenges,       // Array of user progress records
  claimEventChallenge,       // Function to claim a challenge
  fetchUserEventChallenges   // Function to refresh user progress
} = useGame();
```

### claimEventChallenge Function

```javascript
const result = await claimEventChallenge(challengeId, xpReward);

// Returns:
{ success: true } // on success
{ error: ... }    // on failure
```

### Challenge Object Structure

```javascript
{
  // From event_challenges table
  id: 'quest_master_bronze',
  title: 'Quest-Anfänger',
  description: 'Schließe 5 Quests ab',
  target: 5,
  xp_reward: 100,
  reward: { type: 'physical_card', cardId: 'marcus', claimLocation: '...' },
  
  // Calculated from player stats
  currentProgress: 3,
  isCompleted: false,
  
  // From user_event_challenges table (merged)
  isClaimed: false,
  claimedAt: null,
  completedAt: null
}
```

## Database Schema Diagram

```
profiles
  └─┬─ user_event_challenges
    │    ├─ id (UUID)
    │    ├─ user_id → profiles(id)
    │    ├─ challenge_id → event_challenges(id)
    │    ├─ status (in_progress/completed/claimed)
    │    ├─ progress (INTEGER)
    │    ├─ completed_at (TIMESTAMPTZ)
    │    └─ claimed_at (TIMESTAMPTZ)
    │
    └─── event_challenges
         ├─ id (TEXT)
         ├─ title, description, long_description
         ├─ type, tier, icon
         ├─ target, progress_key
         ├─ xp_reward
         ├─ reward (JSONB)
         ├─ gradient (JSONB)
         └─ is_active (BOOLEAN)
```

## Future Enhancements

- [ ] Admin panel to create/edit challenges
- [ ] Analytics dashboard for challenge completion rates
- [ ] Notification system for near-complete challenges
- [ ] Social sharing of claimed challenges
- [ ] Challenge streaks and combos
- [ ] Limited-time event challenges
- [ ] Challenge leaderboards

## Files Modified

1. `supabase/migrations/20260202_user_event_challenges.sql` (NEW)
2. `src/game/GameProvider.js`
3. `src/screens/QuestLogScreen.js`

## Backwards Compatibility

- Existing users will have empty `userEventChallenges` array initially
- Challenges marked as completed but not claimed will show as "Ready to Claim"
- No breaking changes to existing challenge system
- Progress calculation unchanged (client-side)

## Conclusion

User challenge tracking has been successfully implemented with full database persistence. Users can now claim challenges and their progress will be saved permanently. The system is ready for production use.
