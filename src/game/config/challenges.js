// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Event Challenges Configuration
// Übergreifende Challenges mit echten Belohnungen
// ═══════════════════════════════════════════════════════════════════════════

import { TEAMS } from '../../config/teams';

// Challenge-Typen
export const CHALLENGE_TYPES = {
  quest_count: {
    id: 'quest_count',
    name: 'Quest Meister',
    icon: 'ribbon',
    color: '#F59E0B',
  },
  social: {
    id: 'social',
    name: 'Social',
    icon: 'people',
    color: '#EC4899',
  },
  location: {
    id: 'location',
    name: 'Explorer',
    icon: 'location',
    color: '#10B981',
  },
  collection: {
    id: 'collection',
    name: 'Sammler',
    icon: 'albums',
    color: '#8B5CF6',
  },
  streak: {
    id: 'streak',
    name: 'Streak',
    icon: 'flame',
    color: '#EF4444',
  },
};

// Belohnungs-Typen
export const REWARD_TYPES = {
  physical_card: {
    id: 'physical_card',
    name: 'Echte Sammelkarte',
    icon: 'card',
    description: 'Hole dir deine Karte am Info-Stand ab!',
  },
  digital_card: {
    id: 'digital_card',
    name: 'Digitale Karte',
    icon: 'sparkles',
    description: 'Seltene digitale Sammelkarte',
  },
  badge: {
    id: 'badge',
    name: 'Abzeichen',
    icon: 'medal',
    description: 'Exklusives Profil-Abzeichen',
  },
  xp_boost: {
    id: 'xp_boost',
    name: 'XP Boost',
    icon: 'flash',
    description: 'Doppelte XP für 1 Stunde',
  },
  pack: {
    id: 'pack',
    name: 'Karten-Pack',
    icon: 'gift',
    description: 'Kostenloses Karten-Pack',
  },
};

// Event Challenges
export const EVENT_CHALLENGES = [
  {
    id: 'quest_master_bronze',
    key: 'quest_master_bronze',
    title: 'Quest-Anfänger',
    description: 'Schließe 5 Quests ab',
    longDescription: 'Zeige deine Entschlossenheit und schließe 5 beliebige Quests ab. Egal ob Daily, Story oder Social – jede Quest zählt!',
    type: 'quest_count',
    icon: 'ribbon-outline',
    target: 5,
    progressKey: 'completedQuests',
    reward: {
      type: 'digital_card',
      value: 1,
      rarity: 'uncommon',
    },
    xpReward: 100,
    tier: 'bronze',
    gradient: ['#CD7F32', '#8B4513'],
  },
  {
    id: 'quest_master_silver',
    key: 'quest_master_silver',
    title: 'Quest-Veteran',
    description: 'Schließe 15 Quests ab',
    longDescription: 'Du bist auf dem besten Weg ein echter Pathfinder zu werden! Schließe 15 Quests ab für eine echte Sammelkarte.',
    type: 'quest_count',
    icon: 'ribbon',
    target: 15,
    progressKey: 'completedQuests',
    reward: {
      type: 'physical_card',
      value: 1,
      rarity: 'rare',
      claimLocation: 'Info-Stand Halle A',
    },
    xpReward: 250,
    tier: 'silver',
    gradient: ['#C0C0C0', '#808080'],
  },
  {
    id: 'quest_master_gold',
    key: 'quest_master_gold',
    title: 'Quest-Legende',
    description: 'Schließe 30 Quests ab',
    longDescription: 'Nur die Besten schaffen es, 30 Quests zu meistern. Dafür gibt es eine limitierte holografische Sammelkarte!',
    type: 'quest_count',
    icon: 'trophy',
    target: 30,
    progressKey: 'completedQuests',
    reward: {
      type: 'physical_card',
      value: 1,
      rarity: 'legendary',
      claimLocation: 'Info-Stand Halle A',
      special: 'Holografisch',
    },
    xpReward: 500,
    tier: 'gold',
    gradient: ['#FFD700', '#FFA500'],
  },
  {
    id: 'rainbow_friends',
    key: 'rainbow_friends',
    title: 'Rainbow Connections',
    description: 'Füge Freunde aus jedem Team hinzu',
    longDescription: 'Vernetze dich mit Spielern aus allen vier Teams: Blau, Gelb, Grün und Lila. Echte Pathfinder kennen keine Grenzen!',
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
    reward: {
      type: 'badge',
      value: 'rainbow_connector',
      name: 'Rainbow Connector',
    },
    xpReward: 200,
    tier: 'special',
    gradient: ['#EC4899', '#8B5CF6'],
  },
  {
    id: 'workshop_visitor',
    key: 'workshop_visitor',
    title: 'Workshop-Entdecker',
    description: 'Besuche den Workshop',
    longDescription: 'Nimm am Workshop teil und lerne die Geheimnisse der Kartografie. Scanne den QR-Code vor Ort!',
    type: 'location',
    icon: 'school',
    target: 1,
    progressKey: 'workshopVisited',
    locationId: 'workshop_main',
    requiresScan: true,
    reward: {
      type: 'pack',
      value: 1,
      packType: 'workshop_special',
    },
    xpReward: 150,
    tier: 'event',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'social_butterfly',
    key: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Füge 10 Freunde hinzu',
    longDescription: 'Baue dein Netzwerk aus! Verbinde dich mit 10 anderen Spielern und werde zum Social Butterfly.',
    type: 'social',
    icon: 'people-circle',
    target: 10,
    progressKey: 'friendCount',
    reward: {
      type: 'badge',
      value: 'social_butterfly',
      name: 'Social Butterfly',
    },
    xpReward: 150,
    tier: 'silver',
    gradient: ['#EC4899', '#F472B6'],
  },
  {
    id: 'daily_dedication',
    key: 'daily_dedication',
    title: 'Tägliche Hingabe',
    description: 'Schließe 3 Tage hintereinander Daily Quests ab',
    longDescription: 'Zeige deine Beständigkeit! Erfülle an 3 aufeinanderfolgenden Tagen mindestens eine Daily Quest.',
    type: 'streak',
    icon: 'flame',
    target: 3,
    progressKey: 'dailyStreak',
    reward: {
      type: 'xp_boost',
      value: 60, // Minuten
      description: '2x XP für 1 Stunde',
    },
    xpReward: 100,
    tier: 'bronze',
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: 'card_collector',
    key: 'card_collector',
    title: 'Kartensammler',
    description: 'Sammle 20 verschiedene Karten',
    longDescription: 'Erweitere deine Sammlung! Sammle 20 einzigartige digitale Karten.',
    type: 'collection',
    icon: 'albums',
    target: 20,
    progressKey: 'uniqueCards',
    reward: {
      type: 'physical_card',
      value: 1,
      rarity: 'epic',
      claimLocation: 'Info-Stand Halle A',
    },
    xpReward: 300,
    tier: 'gold',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
];

// Tier-Farben und Icons
export const CHALLENGE_TIERS = {
  bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    bgColor: 'rgba(205, 127, 50, 0.15)',
    icon: 'star-outline',
  },
  silver: {
    name: 'Silber',
    color: '#C0C0C0',
    bgColor: 'rgba(192, 192, 192, 0.15)',
    icon: 'star-half',
  },
  gold: {
    name: 'Gold',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.15)',
    icon: 'star',
  },
  special: {
    name: 'Spezial',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    icon: 'sparkles',
  },
  event: {
    name: 'Event',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: 'calendar',
  },
};

// Helper: Challenge-Fortschritt berechnen
export const getChallengeProgress = (challenge, playerStats) => {
  if (!playerStats) return 0;
  
  switch (challenge.progressKey) {
    case 'completedQuests':
      return playerStats.totalCompleted || 0;
    case 'friendCount':
      return playerStats.friendCount || 0;
    case 'friendTeams':
      // Zähle einzigartige Team-Farben der Freunde
      return playerStats.friendTeams?.length || 0;
    case 'workshopVisited':
      return playerStats.workshopVisited ? 1 : 0;
    case 'dailyStreak':
      return playerStats.currentStreak || 0;
    case 'uniqueCards':
      return playerStats.uniqueCards || 0;
    default:
      return 0;
  }
};

// Helper: Alle Challenges mit aktuellem Fortschritt
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
