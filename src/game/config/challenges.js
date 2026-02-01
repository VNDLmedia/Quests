// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Event Challenges Configuration
// Übergreifende Challenges mit echten Spielkarten als Belohnung
// ═══════════════════════════════════════════════════════════════════════════

import { TEAMS } from '../../config/teams';
import { COLLECTIBLE_CARDS } from './cardCollection';

import { COUNTRIES } from './countries';

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
  networking: {
    id: 'networking',
    name: 'Networking',
    icon: 'git-network',
    color: '#3B82F6',
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
  country: {
    id: 'country',
    name: 'Länder',
    icon: 'globe',
    color: '#06B6D4',
  },
};

// Belohnungs-Typ (nur echte Karten)
export const REWARD_TYPES = {
  physical_card: {
    id: 'physical_card',
    name: 'Echte Sammelkarte',
    icon: 'card',
    description: 'Hole dir deine Karte am Info-Stand ab!',
  },
};

// Event Challenges - Alle belohnen mit echten Sammelkarten!
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
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.marcus,
      claimLocation: 'Info-Stand Halle A',
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
    longDescription: 'Du bist auf dem besten Weg ein echter Pathfinder zu werden! Schließe 15 Quests ab für eine seltene Sammelkarte.',
    type: 'quest_count',
    icon: 'ribbon',
    target: 15,
    progressKey: 'completedQuests',
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.ramy,
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
    longDescription: 'Nur die Besten schaffen es, 30 Quests zu meistern. Dafür gibt es die legendäre Roland Mack Karte!',
    type: 'quest_count',
    icon: 'trophy',
    target: 30,
    progressKey: 'completedQuests',
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.roland,
      claimLocation: 'Info-Stand Halle A',
      special: 'Legendär',
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
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.ivo,
      claimLocation: 'Info-Stand Halle A',
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
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.marcus,
      claimLocation: 'Workshop-Stand',
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
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.ramy,
      claimLocation: 'Info-Stand Halle A',
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
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.marcus,
      claimLocation: 'Info-Stand Halle A',
    },
    xpReward: 100,
    tier: 'bronze',
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: 'card_collector',
    key: 'card_collector',
    title: 'Kartensammler',
    description: 'Sammle alle 4 Sammelkarten',
    longDescription: 'Schließe alle Challenges ab und sammle alle 4 einzigartigen Eternal Path Sammelkarten!',
    type: 'collection',
    icon: 'albums',
    target: 4,
    progressKey: 'collectedCards',
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.ivo,
      claimLocation: 'Info-Stand Halle A',
      special: 'Bonus-Karte',
    },
    xpReward: 300,
    tier: 'gold',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LÄNDER-BASIERTE NETWORKING CHALLENGES
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    id: 'networking_frankreich',
    key: 'networking_frankreich',
    title: 'French Connection',
    description: 'Netzwerke im französischen Bereich',
    longDescription: 'Knüpfe Kontakte im französischen Themenbereich. Scanne 3 QR-Codes von anderen Teilnehmern!',
    type: 'networking',
    icon: 'git-network',
    target: 3,
    progressKey: 'networkingFrankreich',
    country: COUNTRIES.frankreich,
    requiresScan: true,
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.marcus,
      claimLocation: 'Französischer Pavillon',
    },
    xpReward: 120,
    tier: 'country',
    gradient: COUNTRIES.frankreich.bgGradient,
  },
  {
    id: 'networking_england',
    key: 'networking_england',
    title: 'British Business',
    description: 'Netzwerke im englischen Bereich',
    longDescription: 'Tea time für Networking! Verbinde dich mit 3 Teilnehmern im englischen Themenbereich.',
    type: 'networking',
    icon: 'git-network',
    target: 3,
    progressKey: 'networkingEngland',
    country: COUNTRIES.england,
    requiresScan: true,
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.ramy,
      claimLocation: 'Englischer Pavillon',
    },
    xpReward: 120,
    tier: 'country',
    gradient: COUNTRIES.england.bgGradient,
  },
  {
    id: 'networking_luxemburg',
    key: 'networking_luxemburg',
    title: 'Luxembourg Links',
    description: 'Netzwerke im Luxemburger Bereich',
    longDescription: 'Das Herz Europas für dein Netzwerk! Verbinde dich mit 3 Teilnehmern.',
    type: 'networking',
    icon: 'business',
    target: 3,
    progressKey: 'networkingLuxemburg',
    country: COUNTRIES.luxemburg,
    requiresScan: true,
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.ivo,
      claimLocation: 'Luxemburger Pavillon',
    },
    xpReward: 150,
    tier: 'country',
    gradient: COUNTRIES.luxemburg.bgGradient,
  },
  {
    id: 'explorer_deutschland',
    key: 'explorer_deutschland',
    title: 'Deutsche Gründlichkeit',
    description: 'Erkunde alle deutschen Attraktionen',
    longDescription: 'Besuche 5 verschiedene Attraktionen im deutschen Themenbereich!',
    type: 'country',
    icon: 'compass',
    target: 5,
    progressKey: 'exploredDeutschland',
    country: COUNTRIES.deutschland,
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.roland,
      claimLocation: 'Deutscher Pavillon',
      special: 'Legendär',
    },
    xpReward: 200,
    tier: 'gold',
    gradient: COUNTRIES.deutschland.bgGradient,
  },
  {
    id: 'adventure_griechenland',
    key: 'adventure_griechenland',
    title: 'Odyssee',
    description: 'Meistere die griechischen Abenteuer',
    longDescription: 'Wie Odysseus selbst - bezwinge alle Herausforderungen im griechischen Bereich!',
    type: 'country',
    icon: 'boat',
    target: 3,
    progressKey: 'adventureGriechenland',
    country: COUNTRIES.griechenland,
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.marcus,
      claimLocation: 'Griechischer Tempel',
    },
    xpReward: 180,
    tier: 'special',
    gradient: COUNTRIES.griechenland.bgGradient,
  },
  {
    id: 'viking_skandinavien',
    key: 'viking_skandinavien',
    title: 'Wikinger-Saga',
    description: 'Erobere den skandinavischen Bereich',
    longDescription: 'Für Valhalla! Schließe alle Quests im nordischen Themenbereich ab.',
    type: 'country',
    icon: 'snow',
    target: 4,
    progressKey: 'vikingSkandinavia',
    country: COUNTRIES.skandinavien,
    reward: {
      type: 'physical_card',
      card: COLLECTIBLE_CARDS.ivo,
      claimLocation: 'Wikinger-Dorf',
    },
    xpReward: 180,
    tier: 'special',
    gradient: COUNTRIES.skandinavien.bgGradient,
  },
];

// Länder-Challenge Tier hinzufügen
CHALLENGE_TIERS.country = {
  name: 'Länder',
  color: '#06B6D4',
  bgColor: 'rgba(6, 182, 212, 0.15)',
  icon: 'globe',
};

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
    case 'collectedCards':
      // Zählt gesammelte physische Karten (abgeholte Challenge-Belohnungen)
      return playerStats.collectedCards || 0;
    
    // Länder-basierte Networking
    case 'networkingFrankreich':
      return playerStats.networkingByCountry?.frankreich || 0;
    case 'networkingEngland':
      return playerStats.networkingByCountry?.england || 0;
    case 'networkingLuxemburg':
      return playerStats.networkingByCountry?.luxemburg || 0;
    
    // Länder-Exploration
    case 'exploredDeutschland':
      return playerStats.exploredByCountry?.deutschland || 0;
    case 'adventureGriechenland':
      return playerStats.adventureByCountry?.griechenland || 0;
    case 'vikingSkandinavia':
      return playerStats.adventureByCountry?.skandinavien || 0;
    
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
