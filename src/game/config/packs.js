// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Card Pack Configuration
// ═══════════════════════════════════════════════════════════════════════════

import { RARITY } from './cards';

// Pack rarities and visual styles
export const PACK_RARITY = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    colors: ['#64748b', '#475569'],
    glowColor: '#94a3b8',
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    colors: ['#3b82f6', '#1d4ed8'],
    glowColor: '#60a5fa',
  },
  LEGENDARY: {
    id: 'legendary',
    name: 'Legendary',
    colors: ['#f59e0b', '#d97706'],
    glowColor: '#fbbf24',
  },
  MYTHIC: {
    id: 'mythic',
    name: 'Mythic',
    colors: ['#8b5cf6', '#6d28d9'],
    glowColor: '#a78bfa',
  },
};

// Pack types available in the shop
export const PACK_TYPES = {
  STARTER: {
    id: 'starter',
    name: 'Starter Pack',
    description: '3 zufällige Karten - perfekt für Anfänger',
    cost: 100,
    cardCount: 3,
    packRarity: PACK_RARITY.BASIC,
    icon: 'cube-outline',
    // Probability distribution for this pack (overrides base RARITY probabilities)
    rarityWeights: {
      common: 0.70,
      rare: 0.25,
      epic: 0.04,
      legendary: 0.01,
    },
    guarantees: {
      minRare: 0, // No guaranteed rare
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Pack',
    description: '5 Karten mit garantierter Rare!',
    cost: 300,
    cardCount: 5,
    packRarity: PACK_RARITY.PREMIUM,
    icon: 'diamond-outline',
    rarityWeights: {
      common: 0.55,
      rare: 0.35,
      epic: 0.08,
      legendary: 0.02,
    },
    guarantees: {
      minRare: 1, // At least 1 rare or better
    },
  },
  ELITE: {
    id: 'elite',
    name: 'Elite Pack',
    description: '5 Karten mit garantierter Epic!',
    cost: 750,
    cardCount: 5,
    packRarity: PACK_RARITY.LEGENDARY,
    icon: 'star-outline',
    rarityWeights: {
      common: 0.40,
      rare: 0.40,
      epic: 0.15,
      legendary: 0.05,
    },
    guarantees: {
      minEpic: 1, // At least 1 epic or better
    },
  },
  MYTHIC: {
    id: 'mythic',
    name: 'Mythic Pack',
    description: 'Das Beste vom Besten - garantierte Legendary!',
    cost: 2000,
    cardCount: 5,
    packRarity: PACK_RARITY.MYTHIC,
    icon: 'flame-outline',
    rarityWeights: {
      common: 0.20,
      rare: 0.40,
      epic: 0.30,
      legendary: 0.10,
    },
    guarantees: {
      minLegendary: 1, // At least 1 legendary
    },
  },
};

// Helper function to roll a card rarity based on weights
export const rollRarity = (weights) => {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity;
    }
  }
  
  return 'common'; // Fallback
};

// Get rarity object from rarity id
export const getRarityById = (rarityId) => {
  const rarityMap = {
    common: RARITY.COMMON,
    rare: RARITY.RARE,
    epic: RARITY.EPIC,
    legendary: RARITY.LEGENDARY,
  };
  return rarityMap[rarityId] || RARITY.COMMON;
};

// Generate cards for a pack based on pack type
export const generatePackCards = (packType, allCards) => {
  const pack = PACK_TYPES[packType];
  if (!pack) return [];
  
  const { cardCount, rarityWeights, guarantees } = pack;
  const rolledCards = [];
  
  // Group cards by rarity
  const cardsByRarity = {
    common: allCards.filter(c => c.rarity.id === 'common'),
    rare: allCards.filter(c => c.rarity.id === 'rare'),
    epic: allCards.filter(c => c.rarity.id === 'epic'),
    legendary: allCards.filter(c => c.rarity.id === 'legendary'),
  };
  
  // First, handle guarantees
  let guaranteedSlots = 0;
  
  if (guarantees.minLegendary > 0) {
    for (let i = 0; i < guarantees.minLegendary; i++) {
      const legendaryCards = cardsByRarity.legendary;
      if (legendaryCards.length > 0) {
        const randomCard = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
        rolledCards.push({ ...randomCard, isGuaranteed: true });
        guaranteedSlots++;
      }
    }
  }
  
  if (guarantees.minEpic > 0) {
    for (let i = 0; i < guarantees.minEpic; i++) {
      // Can be epic or legendary
      const eligibleCards = [...cardsByRarity.epic, ...cardsByRarity.legendary];
      if (eligibleCards.length > 0) {
        const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
        rolledCards.push({ ...randomCard, isGuaranteed: true });
        guaranteedSlots++;
      }
    }
  }
  
  if (guarantees.minRare > 0) {
    for (let i = 0; i < guarantees.minRare; i++) {
      // Can be rare, epic, or legendary
      const eligibleCards = [...cardsByRarity.rare, ...cardsByRarity.epic, ...cardsByRarity.legendary];
      if (eligibleCards.length > 0) {
        const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
        rolledCards.push({ ...randomCard, isGuaranteed: true });
        guaranteedSlots++;
      }
    }
  }
  
  // Fill remaining slots with random rolls
  const remainingSlots = cardCount - guaranteedSlots;
  
  for (let i = 0; i < remainingSlots; i++) {
    const rarityId = rollRarity(rarityWeights);
    const eligibleCards = cardsByRarity[rarityId];
    
    if (eligibleCards.length > 0) {
      const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
      rolledCards.push({ ...randomCard, isGuaranteed: false });
    } else {
      // Fallback to common if no cards of that rarity
      const commonCards = cardsByRarity.common;
      if (commonCards.length > 0) {
        const randomCard = commonCards[Math.floor(Math.random() * commonCards.length)];
        rolledCards.push({ ...randomCard, isGuaranteed: false });
      }
    }
  }
  
  // Shuffle the cards so guaranteed ones aren't always first
  return rolledCards.sort(() => Math.random() - 0.5);
};

// Calculate the "pity" system - increases legendary chance after many packs without one
export const calculatePityBonus = (packsSinceLastLegendary) => {
  // Every 10 packs without a legendary increases the chance by 1%
  const bonus = Math.floor(packsSinceLastLegendary / 10) * 0.01;
  return Math.min(bonus, 0.10); // Cap at 10% bonus
};

export default {
  PACK_RARITY,
  PACK_TYPES,
  rollRarity,
  getRarityById,
  generatePackCards,
  calculatePityBonus,
};
