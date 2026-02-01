// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Sammelkarten Basis-Daten
// Keine Abhängigkeiten - wird von challenges.js und cardCollection.js importiert
// ═══════════════════════════════════════════════════════════════════════════

// Rarity-Farben
export const RARITY_COLORS = {
  common: { bg: '#6B7280', text: '#FFF', glow: 'rgba(107, 114, 128, 0.3)' },
  uncommon: { bg: '#10B981', text: '#FFF', glow: 'rgba(16, 185, 129, 0.3)' },
  rare: { bg: '#3B82F6', text: '#FFF', glow: 'rgba(59, 130, 246, 0.3)' },
  epic: { bg: '#8B5CF6', text: '#FFF', glow: 'rgba(139, 92, 246, 0.4)' },
  legendary: { bg: '#FFD700', text: '#000', glow: 'rgba(255, 215, 0, 0.5)' },
};

export const RARITY_LABELS = {
  common: 'Gewöhnlich',
  uncommon: 'Ungewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

export const RARITY_ORDER = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

// ═══════════════════════════════════════════════════════════════════════════
// SAMMELKARTEN MIT BONI
// ═══════════════════════════════════════════════════════════════════════════

export const COLLECTIBLE_CARDS = {
  // === PERSÖNLICHKEITEN ===
  ivo: {
    id: 'ivo',
    name: 'Ivo Strohammer',
    image: '/cards/Ivo Strohammer.jpeg',
    category: 'persoenlichkeiten',
    country: 'deutschland',
    rarity: 'legendary',
    description: 'Der Visionär von toSUMMIT',
    individualBonus: {
      type: 'xp_multiplier',
      value: 1.1, // +10% XP
      label: '+10% XP permanent',
    },
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus Ernst',
    image: '/cards/Marcus Ernst.jpeg',
    category: 'persoenlichkeiten',
    country: 'deutschland',
    rarity: 'epic',
    description: 'Meister der Imagination',
    individualBonus: {
      type: 'quest_xp',
      value: 25, // +25 XP pro Quest
      label: '+25 XP pro Quest',
    },
  },
  ramy: {
    id: 'ramy',
    name: 'Ramy Töpperwien',
    image: '/cards/Ramy Töpperwien.jpeg',
    category: 'persoenlichkeiten',
    country: 'deutschland',
    rarity: 'epic',
    description: 'Leader von Lucram Media',
    individualBonus: {
      type: 'social_bonus',
      value: 2, // 2x Punkte für Social-Quests
      label: '2x Punkte für Social-Quests',
    },
  },
  roland: {
    id: 'roland',
    name: 'Roland Mack',
    image: '/cards/Roland Mack.jpeg',
    category: 'persoenlichkeiten',
    country: 'deutschland',
    rarity: 'legendary',
    description: 'Gründer des Europa-Park',
    individualBonus: {
      type: 'discount',
      value: 0.15, // 15% Rabatt
      label: '15% Rabatt im Park',
    },
  },
};

// Karten nach Rarity sortieren
export const sortCardsByRarity = (cards) => {
  return [...cards].sort((a, b) => 
    (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0)
  );
};

export default {
  COLLECTIBLE_CARDS,
  RARITY_COLORS,
  RARITY_LABELS,
  RARITY_ORDER,
  sortCardsByRarity,
};
