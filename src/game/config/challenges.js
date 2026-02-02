// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Event Challenges Configuration
// Cross-game challenges with collectible cards as rewards
// NO external dependencies except TEAMS to avoid circular imports
// ═══════════════════════════════════════════════════════════════════════════

import { TEAMS } from '../../config/teams';

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
export const getChallengesWithProgress = (playerStats) => {
  return EVENT_CHALLENGES.map(challenge => ({
    ...challenge,
    currentProgress: getChallengeProgress(challenge, playerStats),
    isCompleted: getChallengeProgress(challenge, playerStats) >= challenge.target,
  }));
};

export default {
  CHALLENGE_TYPES,
  REWARD_TYPES,
  EVENT_CHALLENGES,
  CHALLENGE_TIERS,
  getChallengeProgress,
  getChallengesWithProgress,
};
