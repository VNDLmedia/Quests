// ═══════════════════════════════════════════════════════════════════════════
// PULSE - usePlayer Hook
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useGame } from '../GameProvider';
import { LEVEL_CONFIG, getLevelTitle, getStreakMultiplier } from '../config/rewards';

export function usePlayer() {
  const gameContext = useGame();
  const player = gameContext?.player || {
    xp: 0, level: 1, loginStreak: 0, displayName: 'Guest', username: 'guest'
  };
  const addXP = gameContext?.addXP || (() => {});
  const claimDailyReward = gameContext?.claimDailyReward || (() => {});
  const hasClaimedDailyReward = gameContext?.hasClaimedDailyReward || false;
  const dailyReward = gameContext?.dailyReward || null;
  const friends = gameContext?.friends || [];
  const cards = gameContext?.cards || [];
  const completedQuests = gameContext?.completedQuests || [];

  // Computed values
  const computed = useMemo(() => {
    const safeXP = player?.xp || 0;
    const safeLevel = player?.level || 1;
    const safeStreak = player?.loginStreak || 0;
    
    const levelProgress = LEVEL_CONFIG.getLevelProgress(safeXP);
    const xpForCurrentLevel = LEVEL_CONFIG.getXPForLevel(safeLevel - 1);
    const xpForNextLevel = LEVEL_CONFIG.getXPForLevel(safeLevel);
    const xpInCurrentLevel = safeXP - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const levelTitle = getLevelTitle(safeLevel);
    const streakMultiplier = getStreakMultiplier(safeStreak);
    
    return {
      levelProgress: levelProgress || 0,
      xpForNextLevel: xpForNextLevel || 100,
      xpInCurrentLevel: xpInCurrentLevel || 0,
      xpNeededForNext: xpNeededForNext || 100,
      levelTitle: levelTitle || { title: 'Newcomer', color: '#94A3B8' },
      streakMultiplier: streakMultiplier || 1,
      hasActiveStreak: safeStreak > 0,
      isStreakAtRisk: safeStreak > 0 && !hasClaimedDailyReward,
    };
  }, [player?.xp, player?.level, player?.loginStreak, hasClaimedDailyReward]);

  // Player Stats für Challenges
  const playerStats = useMemo(() => {
    // Einzigartige Team-Farben der Freunde ermitteln
    const friendTeams = [...new Set(friends.map(f => f.team).filter(Boolean))];
    
    // Einzigartige Karten zählen
    const uniqueCards = [...new Set(cards.map(c => c.id || c.key))].length;
    
    return {
      friendCount: friends.length,
      friendTeams,
      totalCompleted: completedQuests.length,
      uniqueCards,
      currentStreak: player?.loginStreak || 0,
      workshopVisited: player?.workshopVisited || false,
    };
  }, [friends, cards, completedQuests, player?.loginStreak, player?.workshopVisited]);

  return {
    // Player data
    ...player,
    
    // Computed
    ...computed,
    
    // Player Stats für Challenges
    playerStats,
    
    // Daily reward state
    hasClaimedDailyReward,
    dailyReward,
    
    // Actions
    addXP,
    claimDailyReward,
  };
}

export default usePlayer;

