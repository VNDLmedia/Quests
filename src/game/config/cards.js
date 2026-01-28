// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Collection Cards Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Card visual effect types for 3D rendering
export const CARD_EFFECTS = {
  NONE: 'none',
  HOLOGRAPHIC: 'holographic',      // Rainbow shimmer effect
  FOIL: 'foil',                    // Metallic shine
  ANIMATED: 'animated',            // Subtle particle animation
  PRISMATIC: 'prismatic',          // Multi-color shifting
  GOLDEN: 'golden',                // Gold leaf effect
};

// Animation types for card reveals
export const CARD_ANIMATIONS = {
  STANDARD: 'standard',            // Basic flip
  SPARKLE: 'sparkle',              // Sparkles on reveal
  EXPLOSION: 'explosion',          // Particle explosion
  LIGHTNING: 'lightning',          // Electric effect
  FLAMES: 'flames',                // Fire effect
  COSMIC: 'cosmic',                // Stars and nebula
};

export const RARITY = {
  COMMON: { 
    id: 'common', 
    name: 'Common', 
    color: ['#64748b', '#94a3b8'], 
    borderColor: '#475569',
    glowColor: 'rgba(148, 163, 184, 0.5)',
    probability: 0.6,
    gemValue: 5,  // Gems received if you get a duplicate
  },
  RARE: { 
    id: 'rare', 
    name: 'Rare', 
    color: ['#2563eb', '#60a5fa'], 
    borderColor: '#1d4ed8',
    glowColor: 'rgba(96, 165, 250, 0.6)',
    probability: 0.3,
    gemValue: 15,
  },
  EPIC: { 
    id: 'epic', 
    name: 'Epic', 
    color: ['#7c3aed', '#a78bfa'], 
    borderColor: '#6d28d9',
    glowColor: 'rgba(167, 139, 250, 0.7)',
    probability: 0.09,
    gemValue: 50,
  },
  LEGENDARY: { 
    id: 'legendary', 
    name: 'Legendary', 
    color: ['#d97706', '#fbbf24'], 
    borderColor: '#b45309',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    probability: 0.01,
    gemValue: 200,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CARD COLLECTION - 30 unique cards
// ═══════════════════════════════════════════════════════════════════════════

export const CARDS = [
  // ─────────────────────────────────────────────────────────────────────────
  // COMMON CARDS (12)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'card_001',
    name: 'Urban Explorer',
    description: 'The beginning of every journey. You took your first steps in the city.',
    rarity: RARITY.COMMON,
    icon: 'map-pin',
    power: 10,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'explorer',
  },
  {
    id: 'card_002',
    name: 'Night Walker',
    description: 'The city never sleeps, and neither do you. A ghost of the night.',
    rarity: RARITY.COMMON,
    icon: 'moon',
    power: 12,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'explorer',
  },
  {
    id: 'card_003',
    name: 'Street Wanderer',
    description: 'Every alley tells a story. You listen to them.',
    rarity: RARITY.COMMON,
    icon: 'walk',
    power: 8,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'explorer',
  },
  {
    id: 'card_004',
    name: 'Coffee Addict',
    description: 'No adventure without caffeine. You know every coffee shop.',
    rarity: RARITY.COMMON,
    icon: 'cafe',
    power: 11,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'lifestyle',
  },
  {
    id: 'card_005',
    name: 'Park Chiller',
    description: 'Sometimes the best spot is just a bench in the park.',
    rarity: RARITY.COMMON,
    icon: 'leaf',
    power: 9,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'lifestyle',
  },
  {
    id: 'card_006',
    name: 'Transit Pro',
    description: 'Subway, bus, tram - you master them all.',
    rarity: RARITY.COMMON,
    icon: 'bus',
    power: 10,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'urban',
  },
  {
    id: 'card_007',
    name: 'Foodie Scout',
    description: 'Your stomach is your compass to the best spots.',
    rarity: RARITY.COMMON,
    icon: 'restaurant',
    power: 13,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'lifestyle',
  },
  {
    id: 'card_008',
    name: 'Snapshot Hunter',
    description: 'A moment, a click, a memory forever.',
    rarity: RARITY.COMMON,
    icon: 'camera',
    power: 11,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'creative',
  },
  {
    id: 'card_009',
    name: 'Sunrise Seeker',
    description: 'The early hours belong to the brave.',
    rarity: RARITY.COMMON,
    icon: 'sunny',
    power: 10,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'explorer',
  },
  {
    id: 'card_010',
    name: 'Graffiti Spotter',
    description: 'Art is everywhere if you just look.',
    rarity: RARITY.COMMON,
    icon: 'color-palette',
    power: 12,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'creative',
  },
  {
    id: 'card_011',
    name: 'Rainy Day Warrior',
    description: 'A little rain won\'t stop you.',
    rarity: RARITY.COMMON,
    icon: 'rainy',
    power: 9,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'explorer',
  },
  {
    id: 'card_012',
    name: 'Market Maven',
    description: 'Flea markets, farmers markets - you find the treasures.',
    rarity: RARITY.COMMON,
    icon: 'cart',
    power: 11,
    effect: CARD_EFFECTS.NONE,
    animation: CARD_ANIMATIONS.STANDARD,
    category: 'lifestyle',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RARE CARDS (10)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'card_013',
    name: 'Neon Sprinter',
    description: 'Faster than the neon lights.',
    rarity: RARITY.RARE,
    icon: 'flash',
    power: 35,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'speed',
  },
  {
    id: 'card_014',
    name: 'Social Butterfly',
    description: 'You know every corner and every NPC in this city.',
    rarity: RARITY.RARE,
    icon: 'people',
    power: 40,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'social',
  },
  {
    id: 'card_015',
    name: 'Rooftop Dreamer',
    description: 'The best view belongs to those who climb the highest.',
    rarity: RARITY.RARE,
    icon: 'business',
    power: 38,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'explorer',
  },
  {
    id: 'card_016',
    name: 'Underground Guide',
    description: 'You know paths that aren\'t on any map.',
    rarity: RARITY.RARE,
    icon: 'subway',
    power: 42,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'urban',
  },
  {
    id: 'card_017',
    name: 'Night Owl',
    description: 'When others sleep, your adventure awakens.',
    rarity: RARITY.RARE,
    icon: 'moon',
    power: 36,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'nightlife',
  },
  {
    id: 'card_018',
    name: 'Culinary Artist',
    description: 'Every dish tells a story.',
    rarity: RARITY.RARE,
    icon: 'nutrition',
    power: 34,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'lifestyle',
  },
  {
    id: 'card_019',
    name: 'Event Crasher',
    description: 'No party is complete without you.',
    rarity: RARITY.RARE,
    icon: 'musical-notes',
    power: 37,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'social',
  },
  {
    id: 'card_020',
    name: 'Vintage Hunter',
    description: 'The past holds the most beautiful treasures.',
    rarity: RARITY.RARE,
    icon: 'time',
    power: 33,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'creative',
  },
  {
    id: 'card_021',
    name: 'Streak Master',
    description: '30 days straight - Discipline is your middle name.',
    rarity: RARITY.RARE,
    icon: 'flame',
    power: 45,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'achievement',
  },
  {
    id: 'card_022',
    name: 'Challenge Champion',
    description: 'No challenge is too big for you.',
    rarity: RARITY.RARE,
    icon: 'trophy',
    power: 41,
    effect: CARD_EFFECTS.FOIL,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'achievement',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EPIC CARDS (5)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'card_023',
    name: 'Vibe Master',
    description: 'You control the rhythm of the street.',
    rarity: RARITY.EPIC,
    icon: 'musical-note',
    power: 75,
    effect: CARD_EFFECTS.HOLOGRAPHIC,
    animation: CARD_ANIMATIONS.EXPLOSION,
    category: 'legendary',
  },
  {
    id: 'card_024',
    name: 'Glitch Hunter',
    description: 'You\'ve seen things others mistake for glitches.',
    rarity: RARITY.EPIC,
    icon: 'code-slash',
    power: 80,
    effect: CARD_EFFECTS.HOLOGRAPHIC,
    animation: CARD_ANIMATIONS.LIGHTNING,
    category: 'tech',
  },
  {
    id: 'card_025',
    name: 'Urban Shaman',
    description: 'The city speaks to you in a language only you understand.',
    rarity: RARITY.EPIC,
    icon: 'eye',
    power: 78,
    effect: CARD_EFFECTS.PRISMATIC,
    animation: CARD_ANIMATIONS.COSMIC,
    category: 'mystic',
  },
  {
    id: 'card_026',
    name: 'Shadow Walker',
    description: 'Invisible in the crowd, unstoppable in the shadows.',
    rarity: RARITY.EPIC,
    icon: 'contrast',
    power: 82,
    effect: CARD_EFFECTS.ANIMATED,
    animation: CARD_ANIMATIONS.EXPLOSION,
    category: 'stealth',
  },
  {
    id: 'card_027',
    name: 'Quest Overlord',
    description: '100 quests completed. A living legend.',
    rarity: RARITY.EPIC,
    icon: 'ribbon',
    power: 85,
    effect: CARD_EFFECTS.HOLOGRAPHIC,
    animation: CARD_ANIMATIONS.SPARKLE,
    category: 'achievement',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LEGENDARY CARDS (3)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'card_028',
    name: 'City Legend',
    description: 'Your name will be written in golden letters on the skyscrapers.',
    rarity: RARITY.LEGENDARY,
    icon: 'crown',
    power: 100,
    effect: CARD_EFFECTS.GOLDEN,
    animation: CARD_ANIMATIONS.FLAMES,
    category: 'legendary',
  },
  {
    id: 'card_029',
    name: 'Time Traveler',
    description: 'Past and future are one to you.',
    rarity: RARITY.LEGENDARY,
    icon: 'hourglass',
    power: 95,
    effect: CARD_EFFECTS.PRISMATIC,
    animation: CARD_ANIMATIONS.COSMIC,
    category: 'mystic',
  },
  {
    id: 'card_030',
    name: 'Ethernal One',
    description: 'You have mastered the path. You are Ethernal.',
    rarity: RARITY.LEGENDARY,
    icon: 'infinite',
    power: 120,
    effect: CARD_EFFECTS.GOLDEN,
    animation: CARD_ANIMATIONS.COSMIC,
    category: 'ultimate',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Get card by ID
export const getCardById = (id) => {
  return CARDS.find(card => card.id === id);
};

// Get cards by rarity
export const getCardsByRarity = (rarityId) => {
  return CARDS.filter(card => card.rarity.id === rarityId);
};

// Get cards by category
export const getCardsByCategory = (category) => {
  return CARDS.filter(card => card.category === category);
};

// Calculate total power of a collection
export const calculateCollectionPower = (cardIds) => {
  return cardIds.reduce((total, id) => {
    const card = getCardById(id);
    return total + (card?.power || 0);
  }, 0);
};

// Get collection completion percentage
export const getCollectionCompletion = (ownedCardIds) => {
  const uniqueOwned = [...new Set(ownedCardIds)];
  return {
    owned: uniqueOwned.length,
    total: CARDS.length,
    percentage: Math.round((uniqueOwned.length / CARDS.length) * 100),
  };
};

// Get rarity distribution of owned cards
export const getRarityDistribution = (ownedCardIds) => {
  const uniqueOwned = [...new Set(ownedCardIds)];
  const distribution = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  
  uniqueOwned.forEach(id => {
    const card = getCardById(id);
    if (card) {
      distribution[card.rarity.id]++;
    }
  });
  
  return distribution;
};

// Legacy function for backward compatibility (now deprecated)
export const getCardByLevel = (level) => {
  console.warn('getCardByLevel is deprecated. Cards are now obtained from packs.');
  return null;
};

export default {
  CARD_EFFECTS,
  CARD_ANIMATIONS,
  RARITY,
  CARDS,
  getCardById,
  getCardsByRarity,
  getCardsByCategory,
  calculateCollectionPower,
  getCollectionCompletion,
  getRarityDistribution,
};
