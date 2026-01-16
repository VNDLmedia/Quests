// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Collection Cards Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const RARITY = {
  COMMON: { 
    id: 'common', 
    name: 'Common', 
    color: ['#64748b', '#94a3b8'], 
    borderColor: '#475569',
    probability: 0.6 
  },
  RARE: { 
    id: 'rare', 
    name: 'Rare', 
    color: ['#2563eb', '#60a5fa'], 
    borderColor: '#1d4ed8',
    probability: 0.3 
  },
  EPIC: { 
    id: 'epic', 
    name: 'Epic', 
    color: ['#7c3aed', '#a78bfa'], 
    borderColor: '#6d28d9',
    probability: 0.09 
  },
  LEGENDARY: { 
    id: 'legendary', 
    name: 'Legendary', 
    color: ['#d97706', '#fbbf24'], 
    borderColor: '#b45309',
    probability: 0.01 
  },
};

export const CARDS = [
  {
    id: 'card_001',
    name: 'Urban Explorer',
    description: 'Der Anfang jeder Reise. Du hast deine ersten Schritte in der Stadt gemacht.',
    rarity: RARITY.COMMON,
    unlockLevel: 2,
    icon: 'map-pin',
    power: 10,
  },
  {
    id: 'card_002',
    name: 'Night Walker',
    description: 'Die Stadt schläft nie, und du auch nicht. Ein Geist der Nacht.',
    rarity: RARITY.COMMON,
    unlockLevel: 3,
    icon: 'moon',
    power: 15,
  },
  {
    id: 'card_003',
    name: 'Neon Sprinter',
    description: 'Schneller als das Licht der Reklametafeln.',
    rarity: RARITY.RARE,
    unlockLevel: 5,
    icon: 'zap',
    power: 35,
  },
  {
    id: 'card_004',
    name: 'Social Butterfly',
    description: 'Du kennst jeden Winkel und jeden NPC dieser Stadt.',
    rarity: RARITY.RARE,
    unlockLevel: 7,
    icon: 'users',
    power: 40,
  },
  {
    id: 'card_005',
    name: 'Vibe Master',
    description: 'Du kontrollierst den Rhythmus der Straße.',
    rarity: RARITY.EPIC,
    unlockLevel: 10,
    icon: 'music',
    power: 75,
  },
  {
    id: 'card_006',
    name: 'City Legend',
    description: 'Dein Name wird in goldenen Lettern an den Wolkenkratzern stehen.',
    rarity: RARITY.LEGENDARY,
    unlockLevel: 15,
    icon: 'crown',
    power: 100,
  },
  {
    id: 'card_007',
    name: 'Glitch Hunter',
    description: 'Du hast Dinge gesehen, die andere für Fehler halten.',
    rarity: RARITY.EPIC,
    unlockLevel: 20,
    icon: 'cpu',
    power: 80,
  },
  {
    id: 'card_008',
    name: 'Time Traveler',
    description: 'Vergangenheit und Zukunft sind für dich eins.',
    rarity: RARITY.LEGENDARY,
    unlockLevel: 25,
    icon: 'clock',
    power: 95,
  }
];

export const getCardByLevel = (level) => {
  return CARDS.find(card => card.unlockLevel === level);
};
