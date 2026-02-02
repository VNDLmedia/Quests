// ═══════════════════════════════════════════════════════════════════════════
// PULSE - useLeaderboard Hook
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback, useEffect } from 'react';
import { useGame } from '../GameProvider';

export function useLeaderboard() {
  const gameContext = useGame();
  const leaderboard = gameContext?.leaderboard || [];
  const myRank = gameContext?.myRank || null;
  const friends = gameContext?.friends || [];
  const player = gameContext?.player || { id: null, xp: 0, level: 1, username: 'Guest', displayName: 'Guest' };
  const fetchLeaderboard = gameContext?.fetchLeaderboard || (() => Promise.resolve());
  const isOnline = gameContext?.isOnline || false;

  // Fetch on mount
  useEffect(() => {
    if (isOnline) {
      fetchLeaderboard();
    }
  }, [isOnline, fetchLeaderboard]);

  // Top 3 players
  const topThree = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  // Rest of leaderboard (4+)
  const restOfLeaderboard = useMemo(() => {
    return leaderboard.slice(3);
  }, [leaderboard]);

  // Friends-only leaderboard
  const friendsLeaderboard = useMemo(() => {
    const friendIds = friends.map(f => f.id);
    const friendsInLeaderboard = leaderboard.filter(p => friendIds.includes(p.id));
    
    // Add current player
    const me = {
      id: player.id,
      username: player.username,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
      score: player.score || 0,
      weeklyXP: player.score || 0, // For backwards compatibility
      isMe: true,
    };
    
    const combined = [...friendsInLeaderboard, me]
      .sort((a, b) => (b.score || b.weeklyXP || 0) - (a.score || a.weeklyXP || 0))
      .map((p, i) => ({ ...p, rank: i + 1 }));
    
    return combined;
  }, [leaderboard, friends, player]);

  // My position in friends leaderboard
  const myFriendsRank = useMemo(() => {
    const index = friendsLeaderboard.findIndex(p => p.isMe);
    return index >= 0 ? index + 1 : null;
  }, [friendsLeaderboard]);

  // Players near my rank
  const nearbyPlayers = useMemo(() => {
    if (!myRank || myRank <= 3) return [];
    
    const startIndex = Math.max(0, myRank - 3);
    const endIndex = Math.min(leaderboard.length, myRank + 2);
    
    return leaderboard.slice(startIndex, endIndex);
  }, [leaderboard, myRank]);

  // Stats
  const stats = useMemo(() => ({
    totalPlayers: leaderboard.length,
    myGlobalRank: myRank,
    myFriendsRank,
    topPlayerScore: topThree[0]?.score || topThree[0]?.weeklyXP || 0,
    scoreToNextRank: myRank && myRank > 1 
      ? (leaderboard[myRank - 2]?.score || leaderboard[myRank - 2]?.weeklyXP || 0) - (player.score || 0)
      : 0,
  }), [leaderboard, myRank, myFriendsRank, topThree, player.score]);

  // Refresh leaderboard
  const refresh = useCallback(() => {
    return fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    // Leaderboard data
    leaderboard,
    topThree,
    restOfLeaderboard,
    friendsLeaderboard,
    nearbyPlayers,
    
    // Rankings
    myRank,
    myFriendsRank,
    
    // Stats
    stats,
    
    // Actions
    refresh,
    
    // State
    isOnline,
  };
}

export default useLeaderboard;

