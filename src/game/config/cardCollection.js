// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Kartensammlungs-System mit Boni & Multiplikatoren
// Sammelkarten werden in Sets organisiert mit stackbaren Rabatten
// ═══════════════════════════════════════════════════════════════════════════

import { COUNTRIES } from './countries';
import { 
  COLLECTIBLE_CARDS, 
  RARITY_COLORS, 
  RARITY_LABELS, 
  RARITY_ORDER, 
  sortCardsByRarity 
} from './cardsData';

// Re-export für einfacheren Zugriff
export { COLLECTIBLE_CARDS, RARITY_COLORS, RARITY_LABELS, RARITY_ORDER, sortCardsByRarity };

// ═══════════════════════════════════════════════════════════════════════════
// KARTEN-KATEGORIEN
// ═══════════════════════════════════════════════════════════════════════════

export const CARD_CATEGORIES = {
  achterbahnen: {
    id: 'achterbahnen',
    name: 'Achterbahnen',
    icon: 'rocket',
    description: 'Die aufregendsten Fahrgeschäfte',
    setBonus: {
      partial: { count: 2, bonus: '+5% XP' },
      complete: { bonus: '+15% XP, +10% Rabatt' },
    },
  },
  maskottchen: {
    id: 'maskottchen',
    name: 'Maskottchen',
    icon: 'happy',
    description: 'Die beliebten Park-Charaktere',
    setBonus: {
      partial: { count: 2, bonus: '+3% Rabatt' },
      complete: { bonus: '+10% Rabatt (stackbar)' },
    },
  },
  attraktionen: {
    id: 'attraktionen',
    name: 'Attraktionen',
    icon: 'star',
    description: 'Besondere Erlebnisse im Park',
    setBonus: {
      partial: { count: 3, bonus: '+5% XP' },
      complete: { bonus: '+20% XP' },
    },
  },
  persoenlichkeiten: {
    id: 'persoenlichkeiten',
    name: 'Persönlichkeiten',
    icon: 'person',
    description: 'Die Menschen hinter dem Erlebnis',
    setBonus: {
      partial: { count: 2, bonus: 'Exklusiver Zugang' },
      complete: { bonus: 'VIP-Status, +25% auf alles' },
    },
  },
  laender: {
    id: 'laender',
    name: 'Länder-Sammlung',
    icon: 'globe',
    description: 'Karten aus allen Themenbereichen',
    setBonus: {
      partial: { count: 5, bonus: '+10% XP' },
      complete: { bonus: 'Weltenbummler-Badge, +30% XP' },
    },
  },
};


// ═══════════════════════════════════════════════════════════════════════════
// BONUS-BERECHNUNG
// ═══════════════════════════════════════════════════════════════════════════

// Einzelkarten-Bonus berechnen
export const getCardBonus = (cardId) => {
  const card = COLLECTIBLE_CARDS[cardId];
  if (!card) return null;
  return card.individualBonus;
};

// Set-Fortschritt berechnen
export const getSetProgress = (collectedCardIds, categoryId) => {
  const cardsInCategory = Object.values(COLLECTIBLE_CARDS)
    .filter(card => card.category === categoryId);
  
  const collected = cardsInCategory.filter(card => 
    collectedCardIds.includes(card.id)
  );
  
  return {
    collected: collected.length,
    total: cardsInCategory.length,
    percentage: (collected.length / cardsInCategory.length) * 100,
    isComplete: collected.length === cardsInCategory.length,
  };
};

// Länder-Set-Fortschritt berechnen
export const getCountrySetProgress = (collectedCardIds, countryId) => {
  const cardsInCountry = Object.values(COLLECTIBLE_CARDS)
    .filter(card => card.country === countryId);
  
  const collected = cardsInCountry.filter(card => 
    collectedCardIds.includes(card.id)
  );
  
  return {
    collected: collected.length,
    total: cardsInCountry.length,
    percentage: cardsInCountry.length > 0 
      ? (collected.length / cardsInCountry.length) * 100 
      : 0,
    isComplete: cardsInCountry.length > 0 && collected.length === cardsInCountry.length,
  };
};

// Gesamt-Bonus berechnen (alle aktiven Boni)
export const calculateTotalBonuses = (collectedCardIds) => {
  const bonuses = {
    xpMultiplier: 1.0,
    questXpBonus: 0,
    socialMultiplier: 1.0,
    discountPercent: 0,
    specialBadges: [],
  };

  // Einzelkarten-Boni addieren
  collectedCardIds.forEach(cardId => {
    const card = COLLECTIBLE_CARDS[cardId];
    if (!card?.individualBonus) return;

    switch (card.individualBonus.type) {
      case 'xp_multiplier':
        bonuses.xpMultiplier *= card.individualBonus.value;
        break;
      case 'quest_xp':
        bonuses.questXpBonus += card.individualBonus.value;
        break;
      case 'social_bonus':
        bonuses.socialMultiplier *= card.individualBonus.value;
        break;
      case 'discount':
        bonuses.discountPercent += card.individualBonus.value * 100;
        break;
    }
  });

  // Set-Boni prüfen (Kategorie-Sets)
  Object.keys(CARD_CATEGORIES).forEach(categoryId => {
    const progress = getSetProgress(collectedCardIds, categoryId);
    const category = CARD_CATEGORIES[categoryId];
    
    if (progress.isComplete) {
      bonuses.specialBadges.push({
        name: `${category.name} Komplett`,
        bonus: category.setBonus.complete.bonus,
        icon: category.icon,
      });
      
      // Zusätzliche Boni für komplette Sets
      if (categoryId === 'persoenlichkeiten') {
        bonuses.xpMultiplier *= 1.25; // +25% auf alles
        bonuses.discountPercent += 10;
      }
      if (categoryId === 'maskottchen') {
        bonuses.discountPercent += 10; // Stackbar
      }
    } else if (progress.collected >= (category.setBonus.partial?.count || 2)) {
      // Partial Set Bonus
      bonuses.specialBadges.push({
        name: `${category.name} Sammler`,
        bonus: category.setBonus.partial.bonus,
        icon: category.icon,
        partial: true,
      });
    }
  });

  // Länder-Boni
  Object.keys(COUNTRIES).forEach(countryId => {
    const progress = getCountrySetProgress(collectedCardIds, countryId);
    const country = COUNTRIES[countryId];
    
    if (progress.isComplete && progress.total > 0) {
      bonuses.xpMultiplier *= country.bonusMultiplier;
      bonuses.specialBadges.push({
        name: `${country.name} Meister`,
        bonus: `${Math.round((country.bonusMultiplier - 1) * 100)}% Bonus`,
        icon: country.icon,
        flag: country.flag,
      });
    }
  });

  // Rabatt auf max 50% begrenzen
  bonuses.discountPercent = Math.min(bonuses.discountPercent, 50);

  return bonuses;
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNKTIONEN
// ═══════════════════════════════════════════════════════════════════════════

// Alle Karten einer Kategorie
export const getCardsByCategory = (categoryId) => {
  return Object.values(COLLECTIBLE_CARDS)
    .filter(card => card.category === categoryId);
};

// Alle Karten eines Landes
export const getCardsByCountry = (countryId) => {
  return Object.values(COLLECTIBLE_CARDS)
    .filter(card => card.country === countryId);
};

export default {
  CARD_CATEGORIES,
  COLLECTIBLE_CARDS,
  getCardBonus,
  getSetProgress,
  getCountrySetProgress,
  calculateTotalBonuses,
  getCardsByCategory,
  getCardsByCountry,
  sortCardsByRarity,
  RARITY_COLORS,
  RARITY_LABELS,
};
