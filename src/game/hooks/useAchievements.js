// ═══════════════════════════════════════════════════════════════════════════
// PULSE - useAchievements Hook
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useGame } from '../GameProvider';
import { 
  ACHIEVEMENTS, 
  ACHIEVEMENT_CATEGORIES, 
  RARITY,
  getAllAchievements,
  getAchievementsByCategory 
} from '../config/achievements';

export function useAchievements() {
  const gameContext = useGame();
  const achievements = gameContext?.achievements || [];
  const achievementProgress = gameContext?.achievementProgress || {};
  const newAchievement = gameContext?.newAchievement || null;
  const clearNewAchievement = gameContext?.clearNewAchievement || (() => {});
  const checkAchievements = gameContext?.checkAchievements || (() => {});
  const player = gameContext?.player || { xp: 0 };

  // Get full achievement data for unlocked achievements
  const unlockedAchievements = useMemo(() => {
    return achievements.map(key => ({
      ...ACHIEVEMENTS[key],
      unlockedAt: new Date().toISOString(), // Would come from DB in production
    })).filter(Boolean);
  }, [achievements]);

  // Get locked achievements with progress
  const lockedAchievements = useMemo(() => {
    const allAchievements = getAllAchievements();
    return allAchievements
      .filter(a => !achievements.includes(a.key))
      .map(a => ({
        ...a,
        currentProgress: achievementProgress[a.key] || 0,
        progressPercent: Math.min(100, ((achievementProgress[a.key] || 0) / a.condition.value) * 100),
      }));
  }, [achievements, achievementProgress]);

  // Group by category
  const byCategory = useMemo(() => {
    const result = {};
    
    for (const cat of Object.values(ACHIEVEMENT_CATEGORIES)) {
      const catAchievements = getAchievementsByCategory(cat.id);
      result[cat.id] = {
        ...cat,
        achievements: catAchievements.map(a => ({
          ...a,
          unlocked: achievements.includes(a.key),
          currentProgress: achievementProgress[a.key] || 0,
          progressPercent: Math.min(100, ((achievementProgress[a.key] || 0) / a.condition.value) * 100),
        })),
        unlockedCount: catAchievements.filter(a => achievements.includes(a.key)).length,
        totalCount: catAchievements.length,
      };
    }
    
    return result;
  }, [achievements, achievementProgress]);

  // Group by rarity
  const byRarity = useMemo(() => {
    const result = {};
    
    for (const [rarityKey, rarityData] of Object.entries(RARITY)) {
      const rarityAchievements = getAllAchievements().filter(a => a.rarity === rarityKey);
      result[rarityKey] = {
        ...rarityData,
        key: rarityKey,
        achievements: rarityAchievements,
        unlockedCount: rarityAchievements.filter(a => achievements.includes(a.key)).length,
        totalCount: rarityAchievements.length,
      };
    }
    
    return result;
  }, [achievements]);

  // Stats
  const stats = useMemo(() => {
    const all = getAllAchievements();
    const totalXPFromAchievements = unlockedAchievements.reduce((sum, a) => sum + a.xp, 0);
    
    return {
      totalUnlocked: achievements.length,
      totalAchievements: all.length,
      completionPercent: Math.round((achievements.length / all.length) * 100),
      totalXPEarned: totalXPFromAchievements,
      mostRecentUnlock: unlockedAchievements[unlockedAchievements.length - 1] || null,
    };
  }, [achievements, unlockedAchievements]);

  // Get next achievements close to unlocking
  const nearlyUnlocked = useMemo(() => {
    return lockedAchievements
      .filter(a => a.progressPercent >= 50)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 5);
  }, [lockedAchievements]);

  // Check if specific achievement is unlocked
  const isUnlocked = useCallback((key) => {
    return achievements.includes(key);
  }, [achievements]);

  // Get achievement by key with status
  const getAchievement = useCallback((key) => {
    const achievement = ACHIEVEMENTS[key];
    if (!achievement) return null;
    
    return {
      ...achievement,
      unlocked: achievements.includes(key),
      currentProgress: achievementProgress[key] || 0,
      progressPercent: Math.min(100, ((achievementProgress[key] || 0) / achievement.condition.value) * 100),
    };
  }, [achievements, achievementProgress]);

  return {
    // Achievement lists
    unlockedAchievements,
    lockedAchievements,
    nearlyUnlocked,
    
    // Grouped
    byCategory,
    byRarity,
    
    // Stats
    stats,
    
    // New achievement for toast
    newAchievement,
    clearNewAchievement,
    
    // Actions
    checkAchievements,
    isUnlocked,
    getAchievement,
    
    // Static data
    categories: ACHIEVEMENT_CATEGORIES,
    rarities: RARITY,
  };
}

export default useAchievements;

