// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Rewards & Daily Bonus Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Daily login rewards (7-day cycle) - Now includes gems!
export const DAILY_REWARDS = [
  { day: 1, xp: 50, gems: 25, bonus: null, icon: 'star' },
  { day: 2, xp: 75, gems: 35, bonus: null, icon: 'star' },
  { day: 3, xp: 100, gems: 50, bonus: null, icon: 'star' },
  { day: 4, xp: 150, gems: 75, bonus: null, icon: 'star-half' },
  { day: 5, xp: 200, gems: 100, bonus: null, icon: 'star-half' },
  { day: 6, xp: 300, gems: 150, bonus: null, icon: 'stars' },
  { day: 7, xp: 500, gems: 300, bonus: { type: 'streak_freeze', count: 1 }, icon: 'gift' },
];

// Streak multipliers for XP gains
export const STREAK_MULTIPLIERS = {
  0: 1.0,    // No streak
  3: 1.1,    // 3-day streak: +10%
  7: 1.25,   // 7-day streak: +25%
  14: 1.5,   // 14-day streak: +50%
  30: 2.0,   // 30-day streak: +100%
};

// Get multiplier for current streak
export const getStreakMultiplier = (streak) => {
  const thresholds = Object.keys(STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const threshold of thresholds) {
    if (streak >= threshold) {
      return STREAK_MULTIPLIERS[threshold];
    }
  }
  return 1.0;
};

// Level requirements and rewards
export const LEVEL_CONFIG = {
  // XP needed for each level: level^2 * 100
  getXPForLevel: (level) => Math.pow(level, 2) * 100,
  
  // Get level from XP
  getLevelFromXP: (xp) => Math.floor(Math.sqrt(xp / 100)) + 1,
  
  // XP progress within current level (0-100%)
  getLevelProgress: (xp) => {
    const currentLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
    const nextLevelXP = Math.pow(currentLevel, 2) * 100;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(100, Math.max(0, progress));
  },
};

// Level titles/ranks
export const LEVEL_TITLES = [
  { minLevel: 1, title: 'Newcomer', color: '#94A3B8' },
  { minLevel: 3, title: 'Explorer', color: '#10B981' },
  { minLevel: 5, title: 'Adventurer', color: '#3B82F6' },
  { minLevel: 8, title: 'Veteran', color: '#8B5CF6' },
  { minLevel: 12, title: 'Champion', color: '#EC4899' },
  { minLevel: 16, title: 'Elite', color: '#0F172A' },
  { minLevel: 20, title: 'Master', color: '#D97706' },
  { minLevel: 25, title: 'Legend', color: '#DC2626' },
  { minLevel: 30, title: 'Mythic', color: '#7C3AED' },
];

// Get title for level
export const getLevelTitle = (level) => {
  const titles = [...LEVEL_TITLES].reverse();
  for (const tier of titles) {
    if (level >= tier.minLevel) {
      return tier;
    }
  }
  return LEVEL_TITLES[0];
};

// Level-up rewards - Now includes gems!
export const LEVEL_REWARDS = {
  5: { xpBonus: 500, gems: 100, badge: 'level_up' },
  10: { xpBonus: 1000, gems: 250, badge: 'elite_status', streakFreeze: 1 },
  15: { xpBonus: 1500, gems: 500, badge: null, streakFreeze: 2 },
  20: { xpBonus: 2000, gems: 1000, badge: null, streakFreeze: 3 },
  25: { xpBonus: 5000, gems: 2000, badge: 'legend', streakFreeze: 5 },
};

// Weekly challenge bonus XP and gems
export const WEEKLY_CHALLENGE_BONUS = {
  xp: 1000,
  gems: 200,
};

// Special event multipliers
export const EVENT_MULTIPLIERS = {
  weekend: 1.5,      // Weekend XP boost
  holiday: 2.0,      // Holiday events
  special: 3.0,      // Special promotions
};

// Check if weekend
export const isWeekend = () => {
  const day = new Date().getDay();
  return day === 0 || day === 6;
};

// Get current event multiplier
export const getCurrentEventMultiplier = () => {
  if (isWeekend()) return EVENT_MULTIPLIERS.weekend;
  return 1.0;
};

// Calculate final XP with all multipliers
export const calculateFinalXP = (baseXP, streak = 0) => {
  const streakMult = getStreakMultiplier(streak);
  const eventMult = getCurrentEventMultiplier();
  return Math.floor(baseXP * streakMult * eventMult);
};

// Calculate final gems with streak bonus
export const calculateFinalGems = (baseGems, streak = 0) => {
  // Gems get a smaller streak bonus (half of XP multiplier)
  const streakMult = 1 + (getStreakMultiplier(streak) - 1) / 2;
  return Math.floor(baseGems * streakMult);
};

// Quest difficulty gem multipliers
export const QUEST_GEM_REWARDS = {
  easy: 10,
  medium: 25,
  hard: 50,
  legendary: 100,
};

// Achievement gem rewards
export const ACHIEVEMENT_GEM_REWARDS = {
  common: 25,
  uncommon: 50,
  rare: 100,
  epic: 250,
  legendary: 500,
};

export default {
  DAILY_REWARDS,
  STREAK_MULTIPLIERS,
  LEVEL_CONFIG,
  LEVEL_TITLES,
  LEVEL_REWARDS,
  WEEKLY_CHALLENGE_BONUS,
  QUEST_GEM_REWARDS,
  ACHIEVEMENT_GEM_REWARDS,
  getStreakMultiplier,
  getLevelTitle,
  calculateFinalXP,
  calculateFinalGems,
};
