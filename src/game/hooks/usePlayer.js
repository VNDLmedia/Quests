// ═══════════════════════════════════════════════════════════════════════════
// PULSE - usePlayer Hook
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useGame } from '../GameProvider';

export function usePlayer() {
  const gameContext = useGame();
  const player = gameContext?.player || {
    score: 0, loginStreak: 0, displayName: 'Guest', username: 'guest'
  };
  const addScore = gameContext?.addScore || (() => {});
  const claimDailyReward = gameContext?.claimDailyReward || (() => {});
  const hasClaimedDailyReward = gameContext?.hasClaimedDailyReward || false;
  const dailyReward = gameContext?.dailyReward || null;
  const friends = gameContext?.friends || [];
  const uniqueCards = gameContext?.uniqueCards || [];
  const completedQuests = gameContext?.completedQuests || [];

  // Player Stats für Challenges
  const playerStats = useMemo(() => {
    // Einzigartige Team-Farben der Freunde ermitteln
    const friendTeams = [...new Set(friends.map(f => f.team).filter(Boolean))];
    
    return {
      friendCount: friends.length,
      friendTeams,
      totalCompleted: completedQuests.length,
      uniqueCards: uniqueCards.length,
      currentStreak: player?.loginStreak || 0,
      score: player?.score || 0,
    };
  }, [friends, uniqueCards, completedQuests, player?.loginStreak, player?.score]);

  return {
    // Player data
    ...player,
    
    // Score (replaces XP)
    score: player?.score || 0,
    
    // Player Stats für Challenges
    playerStats,
    
    // Daily reward state
    hasClaimedDailyReward,
    dailyReward,
    
    // Actions
    addScore,
    claimDailyReward,
  };
}

export default usePlayer;
