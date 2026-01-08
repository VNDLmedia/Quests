// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Achievement Definitions
// ═══════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENT_CATEGORIES = {
  explorer: { id: 'explorer', name: 'Explorer', icon: 'compass', color: '#0D9488' },
  social: { id: 'social', name: 'Social', icon: 'people', color: '#EC4899' },
  collector: { id: 'collector', name: 'Collector', icon: 'diamond', color: '#8B5CF6' },
  speedrunner: { id: 'speedrunner', name: 'Speedrunner', icon: 'flash', color: '#EF4444' },
  veteran: { id: 'veteran', name: 'Veteran', icon: 'medal', color: '#F59E0B' },
};

export const ACHIEVEMENTS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPLORER - Orte besuchen, Quests abschließen
  // ═══════════════════════════════════════════════════════════════════════════
  first_steps: {
    key: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first quest',
    category: 'explorer',
    icon: 'footsteps',
    color: '#0D9488',
    xp: 100,
    condition: { type: 'quests_completed', value: 1 },
    rarity: 'common',
  },
  pathfinder: {
    key: 'pathfinder',
    name: 'Pathfinder',
    description: 'Complete 10 quests',
    category: 'explorer',
    icon: 'map',
    color: '#0D9488',
    xp: 300,
    condition: { type: 'quests_completed', value: 10 },
    rarity: 'uncommon',
  },
  trailblazer: {
    key: 'trailblazer',
    name: 'Trailblazer',
    description: 'Complete 25 quests',
    category: 'explorer',
    icon: 'trail-sign',
    color: '#0D9488',
    xp: 500,
    condition: { type: 'quests_completed', value: 25 },
    rarity: 'rare',
  },
  europark_master: {
    key: 'europark_master',
    name: 'Europark Master',
    description: 'Complete 50 quests',
    category: 'explorer',
    icon: 'trophy',
    color: '#D97706',
    xp: 2000,
    condition: { type: 'quests_completed', value: 50 },
    rarity: 'legendary',
  },
  distance_walker: {
    key: 'distance_walker',
    name: 'Distance Walker',
    description: 'Walk 5km in total',
    category: 'explorer',
    icon: 'walk',
    color: '#0D9488',
    xp: 250,
    condition: { type: 'distance_walked', value: 5000 },
    rarity: 'uncommon',
  },
  marathon_man: {
    key: 'marathon_man',
    name: 'Marathon Man',
    description: 'Walk 42km in total',
    category: 'explorer',
    icon: 'fitness',
    color: '#0D9488',
    xp: 1500,
    condition: { type: 'distance_walked', value: 42000 },
    rarity: 'epic',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL - Freunde, Challenges
  // ═══════════════════════════════════════════════════════════════════════════
  social_starter: {
    key: 'social_starter',
    name: 'Social Starter',
    description: 'Add your first friend',
    category: 'social',
    icon: 'person-add',
    color: '#EC4899',
    xp: 100,
    condition: { type: 'friends_count', value: 1 },
    rarity: 'common',
  },
  social_butterfly: {
    key: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Add 5 friends',
    category: 'social',
    icon: 'people',
    color: '#EC4899',
    xp: 300,
    condition: { type: 'friends_count', value: 5 },
    rarity: 'uncommon',
  },
  networker: {
    key: 'networker',
    name: 'Networker',
    description: 'Add 20 friends',
    category: 'social',
    icon: 'globe',
    color: '#EC4899',
    xp: 750,
    condition: { type: 'friends_count', value: 20 },
    rarity: 'rare',
  },
  challenger: {
    key: 'challenger',
    name: 'Challenger',
    description: 'Win your first challenge',
    category: 'social',
    icon: 'flag',
    color: '#EC4899',
    xp: 200,
    condition: { type: 'challenges_won', value: 1 },
    rarity: 'common',
  },
  champion: {
    key: 'champion',
    name: 'Champion',
    description: 'Win 10 challenges',
    category: 'social',
    icon: 'ribbon',
    color: '#EC4899',
    xp: 600,
    condition: { type: 'challenges_won', value: 10 },
    rarity: 'rare',
  },
  undefeated: {
    key: 'undefeated',
    name: 'Undefeated',
    description: 'Win 5 challenges in a row',
    category: 'social',
    icon: 'shield-checkmark',
    color: '#EC4899',
    xp: 1000,
    condition: { type: 'challenge_win_streak', value: 5 },
    rarity: 'epic',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEEDRUNNER - Zeit-basierte Challenges
  // ═══════════════════════════════════════════════════════════════════════════
  speed_demon: {
    key: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a timed quest under 5 minutes',
    category: 'speedrunner',
    icon: 'flash',
    color: '#EF4444',
    xp: 250,
    condition: { type: 'quest_time_under', value: 300 },
    rarity: 'uncommon',
  },
  lightning_fast: {
    key: 'lightning_fast',
    name: 'Lightning Fast',
    description: 'Complete a timed quest under 2 minutes',
    category: 'speedrunner',
    icon: 'thunderstorm',
    color: '#EF4444',
    xp: 500,
    condition: { type: 'quest_time_under', value: 120 },
    rarity: 'rare',
  },
  rush_hour: {
    key: 'rush_hour',
    name: 'Rush Hour',
    description: 'Complete 3 quests in one hour',
    category: 'speedrunner',
    icon: 'time',
    color: '#EF4444',
    xp: 400,
    condition: { type: 'quests_per_hour', value: 3 },
    rarity: 'uncommon',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLECTOR - Rewards sammeln
  // ═══════════════════════════════════════════════════════════════════════════
  reward_hunter: {
    key: 'reward_hunter',
    name: 'Reward Hunter',
    description: 'Redeem your first reward',
    category: 'collector',
    icon: 'gift',
    color: '#8B5CF6',
    xp: 100,
    condition: { type: 'rewards_redeemed', value: 1 },
    rarity: 'common',
  },
  treasure_seeker: {
    key: 'treasure_seeker',
    name: 'Treasure Seeker',
    description: 'Redeem 10 rewards',
    category: 'collector',
    icon: 'diamond',
    color: '#8B5CF6',
    xp: 400,
    condition: { type: 'rewards_redeemed', value: 10 },
    rarity: 'uncommon',
  },
  xp_collector: {
    key: 'xp_collector',
    name: 'XP Collector',
    description: 'Earn 5,000 XP total',
    category: 'collector',
    icon: 'star',
    color: '#8B5CF6',
    xp: 500,
    condition: { type: 'total_xp', value: 5000 },
    rarity: 'rare',
  },
  xp_hoarder: {
    key: 'xp_hoarder',
    name: 'XP Hoarder',
    description: 'Earn 25,000 XP total',
    category: 'collector',
    icon: 'sparkles',
    color: '#D97706',
    xp: 1500,
    condition: { type: 'total_xp', value: 25000 },
    rarity: 'epic',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VETERAN - Streaks, Login-Tage
  // ═══════════════════════════════════════════════════════════════════════════
  daily_visitor: {
    key: 'daily_visitor',
    name: 'Daily Visitor',
    description: 'Login 3 days in a row',
    category: 'veteran',
    icon: 'calendar',
    color: '#F59E0B',
    xp: 100,
    condition: { type: 'login_streak', value: 3 },
    rarity: 'common',
  },
  on_fire: {
    key: 'on_fire',
    name: 'On Fire',
    description: 'Maintain a 7-day login streak',
    category: 'veteran',
    icon: 'flame',
    color: '#F59E0B',
    xp: 500,
    condition: { type: 'login_streak', value: 7 },
    rarity: 'uncommon',
  },
  dedicated: {
    key: 'dedicated',
    name: 'Dedicated',
    description: 'Maintain a 14-day login streak',
    category: 'veteran',
    icon: 'ribbon',
    color: '#F59E0B',
    xp: 1000,
    condition: { type: 'login_streak', value: 14 },
    rarity: 'rare',
  },
  unstoppable: {
    key: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 30-day login streak',
    category: 'veteran',
    icon: 'rocket',
    color: '#D97706',
    xp: 3000,
    condition: { type: 'login_streak', value: 30 },
    rarity: 'legendary',
  },
  level_up: {
    key: 'level_up',
    name: 'Level Up',
    description: 'Reach level 5',
    category: 'veteran',
    icon: 'arrow-up-circle',
    color: '#F59E0B',
    xp: 200,
    condition: { type: 'level', value: 5 },
    rarity: 'common',
  },
  elite_status: {
    key: 'elite_status',
    name: 'Elite Status',
    description: 'Reach level 10',
    category: 'veteran',
    icon: 'shield',
    color: '#F59E0B',
    xp: 500,
    condition: { type: 'level', value: 10 },
    rarity: 'uncommon',
  },
  legend: {
    key: 'legend',
    name: 'Legend',
    description: 'Reach level 25',
    category: 'veteran',
    icon: 'medal',
    color: '#D97706',
    xp: 2500,
    condition: { type: 'level', value: 25 },
    rarity: 'legendary',
  },
};

// Rarity colors and multipliers
export const RARITY = {
  common: { name: 'Common', color: '#94A3B8', bgColor: '#F1F5F9', multiplier: 1 },
  uncommon: { name: 'Uncommon', color: '#10B981', bgColor: '#ECFDF5', multiplier: 1.25 },
  rare: { name: 'Rare', color: '#3B82F6', bgColor: '#EFF6FF', multiplier: 1.5 },
  epic: { name: 'Epic', color: '#8B5CF6', bgColor: '#F5F3FF', multiplier: 2 },
  legendary: { name: 'Legendary', color: '#D97706', bgColor: '#FFFBEB', multiplier: 3 },
};

// Get achievement by key
export const getAchievement = (key) => ACHIEVEMENTS[key];

// Get all achievements for a category
export const getAchievementsByCategory = (category) => 
  Object.values(ACHIEVEMENTS).filter(a => a.category === category);

// Get all achievements as array
export const getAllAchievements = () => Object.values(ACHIEVEMENTS);

export default ACHIEVEMENTS;

