// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Event Challenges Configuration
// Cross-game challenges with collectible cards as rewards
// NO external dependencies except TEAMS to avoid circular imports
// Supports both progress-based and questline-based challenges
// ═══════════════════════════════════════════════════════════════════════════

import { TEAMS } from '../../config/teams';
import { supabase } from '../../config/supabase';

// Challenge modes
export const CHALLENGE_MODES = {
  progress: { id: 'progress', name: 'Progress-basiert', description: 'Fortschritt wird automatisch berechnet' },
  questline: { id: 'questline', name: 'Quest-Reihe', description: 'Besteht aus mehreren Quests in Reihenfolge' },
};

// Country data inline for challenges (avoids circular imports)
const COUNTRY_DATA = {
  france: { flag: '🇫🇷', name: 'France', gradient: ['#002395', '#ED2939'] },
  england: { flag: '🇬🇧', name: 'England', gradient: ['#012169', '#C8102E'] },
  luxembourg: { flag: '🇱🇺', name: 'Luxembourg', gradient: ['#00A3E0', '#006699'] },
  germany: { flag: '🇩🇪', name: 'Germany', gradient: ['#1a1a1a', '#DD0000'] },
  greece: { flag: '🇬🇷', name: 'Greece', gradient: ['#0D5EAF', '#1a3a5c'] },
  scandinavia: { flag: '🇸🇪', name: 'Scandinavia', gradient: ['#006AA7', '#004F7F'] },
};

// Challenge Types
export const CHALLENGE_TYPES = {
  quest_count: { id: 'quest_count', name: 'Quest Master', icon: 'ribbon', color: '#F59E0B' },
  social: { id: 'social', name: 'Social', icon: 'people', color: '#EC4899' },
  networking: { id: 'networking', name: 'Networking', icon: 'git-network', color: '#3B82F6' },
  location: { id: 'location', name: 'Explorer', icon: 'location', color: '#10B981' },
  collection: { id: 'collection', name: 'Collector', icon: 'albums', color: '#8B5CF6' },
  streak: { id: 'streak', name: 'Streak', icon: 'flame', color: '#EF4444' },
  country: { id: 'country', name: 'Countries', icon: 'globe', color: '#06B6D4' },
};

// Reward Type
export const REWARD_TYPES = {
  physical_card: {
    id: 'physical_card',
    name: 'Collectible Card',
    icon: 'card',
    description: 'Claim your card at the Info Stand!',
  },
};

// Tier colors and icons
export const CHALLENGE_TIERS = {
  bronze: { name: 'Bronze', color: '#CD7F32', bgColor: 'rgba(205, 127, 50, 0.15)', icon: 'star-outline' },
  silver: { name: 'Silver', color: '#C0C0C0', bgColor: 'rgba(192, 192, 192, 0.15)', icon: 'star-half' },
  gold: { name: 'Gold', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.15)', icon: 'star' },
  special: { name: 'Special', color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.15)', icon: 'sparkles' },
  event: { name: 'Event', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: 'calendar' },
  country: { name: 'Country', color: '#06B6D4', bgColor: 'rgba(6, 182, 212, 0.15)', icon: 'globe' },
};

// Event Challenges - using cardId from CARDS config
export const EVENT_CHALLENGES = [
  {
    id: 'quest_master_bronze',
    key: 'quest_master_bronze',
    title: 'Quest Beginner',
    description: 'Complete 5 quests',
    longDescription: 'Show your determination and complete 5 quests. Daily, Story or Social – every quest counts!',
    type: 'quest_count',
    icon: 'ribbon-outline',
    target: 5,
    progressKey: 'completedQuests',
    reward: { type: 'physical_card', cardId: 'card_001', claimLocation: 'Info Stand Hall A' },
    scoreReward: 100,
    tier: 'bronze',
    gradient: ['#CD7F32', '#8B4513'],
  },
  {
    id: 'quest_master_silver',
    key: 'quest_master_silver',
    title: 'Quest Veteran',
    description: 'Complete 15 quests',
    longDescription: 'You are on your way to becoming a true Pathfinder! Complete 15 quests for a rare collectible card.',
    type: 'quest_count',
    icon: 'ribbon',
    target: 15,
    progressKey: 'completedQuests',
    reward: { type: 'physical_card', cardId: 'card_013', claimLocation: 'Info Stand Hall A' },
    scoreReward: 250,
    tier: 'silver',
    gradient: ['#C0C0C0', '#808080'],
  },
  {
    id: 'quest_master_gold',
    key: 'quest_master_gold',
    title: 'Quest Legend',
    description: 'Complete 30 quests',
    longDescription: 'Only the best achieve 30 quests. Earn the legendary City Legend card!',
    type: 'quest_count',
    icon: 'trophy',
    target: 30,
    progressKey: 'completedQuests',
    reward: { type: 'physical_card', cardId: 'card_028', claimLocation: 'Info Stand Hall A', special: 'Legendary' },
    scoreReward: 500,
    tier: 'gold',
    gradient: ['#FFD700', '#FFA500'],
  },
  {
    id: 'rainbow_friends',
    key: 'rainbow_friends',
    title: 'Rainbow Connections',
    description: 'Add friends from each team',
    longDescription: 'Connect with players from all four teams: Blue, Yellow, Green, and Purple. True Pathfinders know no boundaries!',
    type: 'social',
    icon: 'color-palette',
    target: 4,
    progressKey: 'friendTeams',
    checklistItems: [
      { key: 'blue', label: 'Blue Team', color: TEAMS.blue.color, icon: TEAMS.blue.icon },
      { key: 'yellow', label: 'Yellow Team', color: TEAMS.yellow.color, icon: TEAMS.yellow.icon },
      { key: 'green', label: 'Green Team', color: TEAMS.green.color, icon: TEAMS.green.icon },
      { key: 'purple', label: 'Purple Team', color: TEAMS.purple.color, icon: TEAMS.purple.icon },
    ],
    reward: { type: 'physical_card', cardId: 'card_014', claimLocation: 'Info Stand Hall A' },
    scoreReward: 200,
    tier: 'special',
    gradient: ['#EC4899', '#8B5CF6'],
  },
  {
    id: 'workshop_visitor',
    key: 'workshop_visitor',
    title: 'Workshop Explorer',
    description: 'Visit the workshop',
    longDescription: 'Attend the workshop and learn the secrets of cartography. Scan the QR code on site!',
    type: 'location',
    icon: 'school',
    target: 1,
    progressKey: 'workshopVisited',
    locationId: 'workshop_main',
    requiresScan: true,
    reward: { type: 'physical_card', cardId: 'card_016', claimLocation: 'Workshop Stand' },
    scoreReward: 150,
    tier: 'event',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'social_butterfly',
    key: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Add 10 friends',
    longDescription: 'Build your network! Connect with 10 other players and become a Social Butterfly.',
    type: 'social',
    icon: 'people-circle',
    target: 10,
    progressKey: 'friendCount',
    reward: { type: 'physical_card', cardId: 'card_014', claimLocation: 'Info Stand Hall A' },
    scoreReward: 150,
    tier: 'silver',
    gradient: ['#EC4899', '#F472B6'],
  },
  {
    id: 'daily_dedication',
    key: 'daily_dedication',
    title: 'Daily Dedication',
    description: 'Complete daily quests 3 days in a row',
    longDescription: 'Show your consistency! Complete at least one daily quest for 3 consecutive days.',
    type: 'streak',
    icon: 'flame',
    target: 3,
    progressKey: 'dailyStreak',
    reward: { type: 'physical_card', cardId: 'card_021', claimLocation: 'Info Stand Hall A' },
    scoreReward: 100,
    tier: 'bronze',
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: 'card_collector',
    key: 'card_collector',
    title: 'Card Collector',
    description: 'Collect 10 unique cards',
    longDescription: 'Complete challenges and collect 10 unique Ethernal Paths collectible cards!',
    type: 'collection',
    icon: 'albums',
    target: 10,
    progressKey: 'uniqueCards',
    reward: { type: 'physical_card', cardId: 'card_023', claimLocation: 'Info Stand Hall A', special: 'Epic Bonus' },
    scoreReward: 300,
    tier: 'gold',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  
  // COUNTRY-BASED NETWORKING CHALLENGES
  {
    id: 'networking_france',
    key: 'networking_france',
    title: 'French Connection',
    description: 'Network in the French area',
    longDescription: 'Make connections in the French themed area. Scan 3 QR codes from other participants!',
    type: 'networking',
    icon: 'git-network',
    target: 3,
    progressKey: 'networkingFrance',
    country: COUNTRY_DATA.france,
    requiresScan: true,
    reward: { type: 'physical_card', cardId: 'card_018', claimLocation: 'French Pavilion' },
    scoreReward: 120,
    tier: 'country',
    gradient: COUNTRY_DATA.france.gradient,
  },
  {
    id: 'networking_england',
    key: 'networking_england',
    title: 'British Business',
    description: 'Network in the English area',
    longDescription: 'Tea time for networking! Connect with 3 participants in the English themed area.',
    type: 'networking',
    icon: 'git-network',
    target: 3,
    progressKey: 'networkingEngland',
    country: COUNTRY_DATA.england,
    requiresScan: true,
    reward: { type: 'physical_card', cardId: 'card_019', claimLocation: 'English Pavilion' },
    scoreReward: 120,
    tier: 'country',
    gradient: COUNTRY_DATA.england.gradient,
  },
  {
    id: 'networking_luxembourg',
    key: 'networking_luxembourg',
    title: 'Luxembourg Links',
    description: 'Network in the Luxembourg area',
    longDescription: 'The heart of Europe for your network! Connect with 3 participants.',
    type: 'networking',
    icon: 'business',
    target: 3,
    progressKey: 'networkingLuxembourg',
    country: COUNTRY_DATA.luxembourg,
    requiresScan: true,
    reward: { type: 'physical_card', cardId: 'card_020', claimLocation: 'Luxembourg Pavilion' },
    scoreReward: 150,
    tier: 'country',
    gradient: COUNTRY_DATA.luxembourg.gradient,
  },
  {
    id: 'explorer_germany',
    key: 'explorer_germany',
    title: 'German Thoroughness',
    description: 'Explore all German attractions',
    longDescription: 'Visit 5 different attractions in the German themed area!',
    type: 'country',
    icon: 'compass',
    target: 5,
    progressKey: 'exploredGermany',
    country: COUNTRY_DATA.germany,
    reward: { type: 'physical_card', cardId: 'card_028', claimLocation: 'German Pavilion', special: 'Legendary' },
    scoreReward: 200,
    tier: 'gold',
    gradient: COUNTRY_DATA.germany.gradient,
  },
  {
    id: 'adventure_greece',
    key: 'adventure_greece',
    title: 'Odyssey',
    description: 'Master the Greek adventures',
    longDescription: 'Like Odysseus himself - conquer all challenges in the Greek area!',
    type: 'country',
    icon: 'boat',
    target: 3,
    progressKey: 'adventureGreece',
    country: COUNTRY_DATA.greece,
    reward: { type: 'physical_card', cardId: 'card_025', claimLocation: 'Greek Temple' },
    scoreReward: 180,
    tier: 'special',
    gradient: COUNTRY_DATA.greece.gradient,
  },
  {
    id: 'viking_scandinavia',
    key: 'viking_scandinavia',
    title: 'Viking Saga',
    description: 'Conquer the Scandinavian area',
    longDescription: 'For Valhalla! Complete all quests in the Nordic themed area.',
    type: 'country',
    icon: 'snow',
    target: 4,
    progressKey: 'vikingScandinavia',
    country: COUNTRY_DATA.scandinavia,
    reward: { type: 'physical_card', cardId: 'card_026', claimLocation: 'Viking Village' },
    scoreReward: 180,
    tier: 'special',
    gradient: COUNTRY_DATA.scandinavia.gradient,
  },
];

// Helper: Calculate challenge progress
export const getChallengeProgress = (challenge, playerStats) => {
  if (!playerStats) return 0;
  
  switch (challenge.progressKey) {
    case 'completedQuests':
      return playerStats.totalCompleted || 0;
    case 'friendCount':
      return playerStats.friendCount || 0;
    case 'friendTeams':
      return playerStats.friendTeams?.length || 0;
    case 'workshopVisited':
      return playerStats.workshopVisited ? 1 : 0;
    case 'dailyStreak':
      return playerStats.currentStreak || 0;
    case 'uniqueCards':
      return playerStats.uniqueCards || 0;
    case 'collectedCards':
      return playerStats.collectedCards || 0;
    case 'networkingFrance':
      return playerStats.networkingByCountry?.france || 0;
    case 'networkingEngland':
      return playerStats.networkingByCountry?.england || 0;
    case 'networkingLuxembourg':
      return playerStats.networkingByCountry?.luxembourg || 0;
    case 'exploredGermany':
      return playerStats.exploredByCountry?.germany || 0;
    case 'adventureGreece':
      return playerStats.adventureByCountry?.greece || 0;
    case 'vikingScandinavia':
      return playerStats.adventureByCountry?.scandinavia || 0;
    default:
      return 0;
  }
};

// Helper: All challenges with current progress
export const getChallengesWithProgress = (challenges, playerStats, questlineProgress = {}) => {
  // If called with old signature (single argument), treat it as playerStats for backwards compatibility
  if (!Array.isArray(challenges) && typeof challenges === 'object') {
    playerStats = challenges;
    challenges = EVENT_CHALLENGES;
  }
  
  // Fallback to hardcoded challenges if no challenges provided
  if (!challenges || challenges.length === 0) {
    challenges = EVENT_CHALLENGES;
  }
  
  return challenges.map(challenge => {
    // Handle questline challenges differently
    if (challenge.challenge_mode === 'questline') {
      const qlProgress = questlineProgress[challenge.id] || { completed: 0, total: 0 };
      return {
        ...challenge,
        currentProgress: qlProgress.completed,
        target: qlProgress.total || challenge.target || 1,
        isCompleted: qlProgress.completed >= (qlProgress.total || challenge.target || 1),
        questlineQuests: qlProgress.quests || [],
      };
    }
    
    // Progress-based challenges use the original logic
    return {
      ...challenge,
      currentProgress: getChallengeProgress(challenge, playerStats),
      isCompleted: getChallengeProgress(challenge, playerStats) >= challenge.target,
    };
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// QUESTLINE CHALLENGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// Fetch questline quests for a challenge
export const fetchChallengeQuests = async (challengeId) => {
  try {
    const { data, error } = await supabase
      .from('challenge_quests_with_details')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('sequence_order', { ascending: true });
    
    if (error) throw error;
    return { success: true, quests: data || [] };
  } catch (error) {
    console.error('Error fetching challenge quests:', error);
    return { success: false, error: error.message, quests: [] };
  }
};

// Fetch user's questline progress for a specific challenge
export const fetchUserQuestlineProgress = async (userId, challengeId) => {
  try {
    const { data, error } = await supabase
      .from('questline_progress_details')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .order('sequence_order', { ascending: true });
    
    if (error) throw error;
    
    const completed = data?.filter(q => q.status === 'completed').length || 0;
    const total = data?.length || 0;
    
    return {
      success: true,
      progress: {
        completed,
        total,
        quests: data || [],
        isComplete: completed >= total && total > 0,
      }
    };
  } catch (error) {
    console.error('Error fetching questline progress:', error);
    return { success: false, error: error.message, progress: null };
  }
};

// Fetch questline progress for all questline challenges for a user
export const fetchAllQuestlineProgress = async (userId) => {
  try {
    // First, get all questline challenges
    const { data: questlineChallenges, error: challengeError } = await supabase
      .from('event_challenges')
      .select('id')
      .eq('challenge_mode', 'questline')
      .eq('is_active', true);
    
    if (challengeError) throw challengeError;
    
    if (!questlineChallenges || questlineChallenges.length === 0) {
      return { success: true, progress: {} };
    }
    
    // Fetch progress for each questline challenge
    const { data: progressData, error: progressError } = await supabase
      .from('questline_progress_details')
      .select('*')
      .eq('user_id', userId)
      .in('challenge_id', questlineChallenges.map(c => c.id))
      .order('sequence_order', { ascending: true });
    
    if (progressError) throw progressError;
    
    // Group by challenge_id
    const progressByChallenge = {};
    
    questlineChallenges.forEach(challenge => {
      const challengeQuests = progressData?.filter(q => q.challenge_id === challenge.id) || [];
      const completed = challengeQuests.filter(q => q.status === 'completed').length;
      const total = challengeQuests.length;
      
      progressByChallenge[challenge.id] = {
        completed,
        total,
        quests: challengeQuests,
        isComplete: completed >= total && total > 0,
      };
    });
    
    return { success: true, progress: progressByChallenge };
  } catch (error) {
    console.error('Error fetching all questline progress:', error);
    return { success: false, error: error.message, progress: {} };
  }
};

// Initialize questline progress for a user (when they start a questline challenge)
export const initializeQuestlineProgress = async (userId, challengeId) => {
  try {
    const { data, error } = await supabase
      .rpc('initialize_questline_progress', {
        p_user_id: userId,
        p_challenge_id: challengeId
      });
    
    if (error) throw error;
    return { success: true, progress: data };
  } catch (error) {
    console.error('Error initializing questline progress:', error);
    return { success: false, error: error.message };
  }
};

// Complete a quest in a questline
export const completeQuestlineQuest = async (userId, challengeId, questId) => {
  try {
    const { data, error } = await supabase
      .rpc('complete_questline_quest', {
        p_user_id: userId,
        p_challenge_id: challengeId,
        p_quest_id: questId
      });
    
    if (error) throw error;
    
    const result = data?.[0] || {};
    return {
      success: true,
      nextQuestId: result.next_quest_id,
      isChallengeComplete: result.is_challenge_complete,
      totalQuests: result.total_quests,
      completedQuests: result.completed_quests,
    };
  } catch (error) {
    console.error('Error completing questline quest:', error);
    return { success: false, error: error.message };
  }
};

// Get current quest status for a specific quest in a questline
export const getQuestlineQuestStatus = async (userId, challengeId, questId) => {
  try {
    const { data, error } = await supabase
      .from('user_challenge_quest_progress')
      .select('status, completed_at')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('quest_id', questId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    
    return {
      success: true,
      status: data?.status || 'not_started',
      completedAt: data?.completed_at,
    };
  } catch (error) {
    console.error('Error getting questline quest status:', error);
    return { success: false, error: error.message, status: 'error' };
  }
};

// Check if a quest belongs to a questline challenge
export const getQuestChallengeInfo = async (questId) => {
  console.log('[getQuestChallengeInfo] Looking up quest:', questId);
  try {
    const { data, error } = await supabase
      .from('challenge_quests')
      .select(`
        challenge_id,
        sequence_order,
        is_required,
        bonus_xp,
        event_challenges (
          id,
          title,
          challenge_mode
        )
      `)
      .eq('quest_id', questId);
    
    if (error) throw error;
    
    console.log('[getQuestChallengeInfo] Found challenges:', data?.length || 0, data);
    
    return {
      success: true,
      challenges: data || [],
      isInQuestline: data?.some(c => c.event_challenges?.challenge_mode === 'questline') || false,
    };
  } catch (error) {
    console.error('Error checking quest challenge info:', error);
    return { success: false, error: error.message, challenges: [], isInQuestline: false };
  }
};

// Get questline summary (for display)
export const getQuestlineSummary = async (userId, challengeId) => {
  try {
    const { data, error } = await supabase
      .rpc('get_questline_summary', {
        p_user_id: userId,
        p_challenge_id: challengeId
      });
    
    if (error) throw error;
    
    const result = data?.[0] || {};
    return {
      success: true,
      summary: {
        totalQuests: result.total_quests || 0,
        completedQuests: result.completed_quests || 0,
        currentQuestId: result.current_quest_id,
        currentQuestOrder: result.current_quest_order,
        isComplete: result.is_complete || false,
      }
    };
  } catch (error) {
    console.error('Error getting questline summary:', error);
    return { success: false, error: error.message, summary: null };
  }
};

export default {
  CHALLENGE_TYPES,
  CHALLENGE_MODES,
  REWARD_TYPES,
  EVENT_CHALLENGES,
  CHALLENGE_TIERS,
  getChallengeProgress,
  getChallengesWithProgress,
  // Questline helpers
  fetchChallengeQuests,
  fetchUserQuestlineProgress,
  fetchAllQuestlineProgress,
  initializeQuestlineProgress,
  completeQuestlineQuest,
  getQuestlineQuestStatus,
  getQuestChallengeInfo,
  getQuestlineSummary,
};
