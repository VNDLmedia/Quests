// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - useChallenges Hook
// Manages challenge-related state and actions including questline challenges
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useGame } from '../GameProvider';
import {
  getChallengesWithProgress,
  fetchChallengeQuests,
  fetchUserQuestlineProgress,
  getQuestlineSummary,
  CHALLENGE_MODES,
  CHALLENGE_TIERS,
  CHALLENGE_TYPES,
} from '../config/challenges';

/**
 * Hook for managing challenges including questline challenges
 * 
 * @returns {Object} Challenge state and actions
 */
export function useChallenges() {
  const {
    user,
    player,
    eventChallenges,
    userEventChallenges,
    questlineProgress,
    completedQuests,
    collectedCardIds,
    // Actions
    fetchEventChallenges,
    fetchUserEventChallenges,
    fetchQuestlineProgress,
    claimEventChallenge,
    startQuestlineChallenge,
    completeQuestlineQuest,
    handleQuestCompletionForQuestline,
  } = useGame();

  // Build player stats for progress calculation
  const playerStats = useMemo(() => ({
    totalCompleted: completedQuests?.length || 0,
    friendCount: player?.friendsCount || 0,
    friendTeams: [], // TODO: Implement team tracking
    workshopVisited: false, // TODO: Implement workshop tracking
    currentStreak: player?.loginStreak || 0,
    collectedCards: collectedCardIds?.length || 0,
    networkingByCountry: {}, // TODO: Implement networking tracking
    exploredByCountry: {}, // TODO: Implement exploration tracking
    adventureByCountry: {}, // TODO: Implement adventure tracking
  }), [completedQuests, player, collectedCardIds]);

  // Get challenges with computed progress
  const challengesWithProgress = useMemo(() => {
    if (!eventChallenges || eventChallenges.length === 0) return [];
    
    return getChallengesWithProgress(eventChallenges, playerStats, questlineProgress);
  }, [eventChallenges, playerStats, questlineProgress]);

  // Filter challenges by type
  const getChallengesByType = useCallback((type) => {
    return challengesWithProgress.filter(c => c.type === type);
  }, [challengesWithProgress]);

  // Filter challenges by tier
  const getChallengesByTier = useCallback((tier) => {
    return challengesWithProgress.filter(c => c.tier === tier);
  }, [challengesWithProgress]);

  // Filter challenges by mode (progress or questline)
  const getChallengesByMode = useCallback((mode) => {
    return challengesWithProgress.filter(c => 
      (c.challenge_mode || 'progress') === mode
    );
  }, [challengesWithProgress]);

  // Get only questline challenges
  const questlineChallenges = useMemo(() => {
    return challengesWithProgress.filter(c => c.challenge_mode === 'questline');
  }, [challengesWithProgress]);

  // Get only progress-based challenges
  const progressChallenges = useMemo(() => {
    return challengesWithProgress.filter(c => 
      !c.challenge_mode || c.challenge_mode === 'progress'
    );
  }, [challengesWithProgress]);

  // Get completed challenges
  const completedChallenges = useMemo(() => {
    return challengesWithProgress.filter(c => c.isCompleted);
  }, [challengesWithProgress]);

  // Get claimed challenges
  const claimedChallenges = useMemo(() => {
    const claimedIds = userEventChallenges
      ?.filter(uc => uc.status === 'claimed')
      .map(uc => uc.challenge_id) || [];
    
    return challengesWithProgress.filter(c => claimedIds.includes(c.id));
  }, [challengesWithProgress, userEventChallenges]);

  // Get available (unclaimed but completed) challenges
  const availableToClaim = useMemo(() => {
    const claimedIds = userEventChallenges
      ?.filter(uc => uc.status === 'claimed')
      .map(uc => uc.challenge_id) || [];
    
    return challengesWithProgress.filter(c => 
      c.isCompleted && !claimedIds.includes(c.id)
    );
  }, [challengesWithProgress, userEventChallenges]);

  // Check if a challenge is claimed
  const isChallengeClaimedById = useCallback((challengeId) => {
    return userEventChallenges?.some(
      uc => uc.challenge_id === challengeId && uc.status === 'claimed'
    ) || false;
  }, [userEventChallenges]);

  // Get challenge status (not_started, in_progress, completed, claimed)
  const getChallengeStatus = useCallback((challengeId) => {
    const userChallenge = userEventChallenges?.find(uc => uc.challenge_id === challengeId);
    
    if (userChallenge?.status === 'claimed') return 'claimed';
    
    const challenge = challengesWithProgress.find(c => c.id === challengeId);
    if (challenge?.isCompleted) return 'completed';
    
    if (userChallenge?.status === 'in_progress') return 'in_progress';
    
    // For questline challenges, check if started
    if (challenge?.challenge_mode === 'questline') {
      const progress = questlineProgress[challengeId];
      if (progress && progress.quests && progress.quests.length > 0) {
        return 'in_progress';
      }
    }
    
    return 'not_started';
  }, [userEventChallenges, challengesWithProgress, questlineProgress]);

  // Get questline details for a specific challenge
  const getQuestlineDetails = useCallback(async (challengeId) => {
    if (!user) return { error: 'Not authenticated' };
    
    // First fetch the quests for this challenge
    const questsResult = await fetchChallengeQuests(challengeId);
    if (!questsResult.success) {
      return { error: questsResult.error, quests: [] };
    }
    
    // Then fetch user progress
    const progressResult = await fetchUserQuestlineProgress(user.id, challengeId);
    if (!progressResult.success) {
      return { 
        quests: questsResult.quests, 
        progress: null,
        error: progressResult.error 
      };
    }
    
    // Merge quest data with progress
    const questsWithProgress = questsResult.quests.map(quest => {
      const userProgress = progressResult.progress?.quests?.find(
        p => p.quest_id === quest.quest_id
      );
      
      return {
        ...quest,
        userStatus: userProgress?.status || 'locked',
        completedAt: userProgress?.completed_at,
      };
    });
    
    return {
      quests: questsWithProgress,
      progress: progressResult.progress,
      summary: {
        total: questsResult.quests.length,
        completed: progressResult.progress?.completed || 0,
        isComplete: progressResult.progress?.isComplete || false,
      },
    };
  }, [user]);

  // Start a questline challenge
  const startChallenge = useCallback(async (challengeId) => {
    const challenge = challengesWithProgress.find(c => c.id === challengeId);
    
    if (!challenge) {
      return { error: 'Challenge not found' };
    }
    
    if (challenge.challenge_mode === 'questline') {
      return await startQuestlineChallenge(challengeId);
    }
    
    // For progress-based challenges, nothing special to start
    return { success: true };
  }, [challengesWithProgress, startQuestlineChallenge]);

  // Claim a challenge reward
  const claimChallenge = useCallback(async (challengeId) => {
    const challenge = challengesWithProgress.find(c => c.id === challengeId);
    
    if (!challenge) {
      return { error: 'Challenge not found' };
    }
    
    if (!challenge.isCompleted) {
      return { error: 'Challenge not completed' };
    }
    
    return await claimEventChallenge(challengeId, challenge.xp_reward || challenge.xpReward, challenge);
  }, [challengesWithProgress, claimEventChallenge]);

  // Refresh all challenge data
  const refreshChallenges = useCallback(async () => {
    await Promise.all([
      fetchEventChallenges(),
      fetchUserEventChallenges(),
      fetchQuestlineProgress(),
    ]);
  }, [fetchEventChallenges, fetchUserEventChallenges, fetchQuestlineProgress]);

  return {
    // Data
    challenges: challengesWithProgress,
    questlineChallenges,
    progressChallenges,
    completedChallenges,
    claimedChallenges,
    availableToClaim,
    questlineProgress,
    playerStats,
    
    // Metadata
    challengeModes: CHALLENGE_MODES,
    challengeTiers: CHALLENGE_TIERS,
    challengeTypes: CHALLENGE_TYPES,
    
    // Filters
    getChallengesByType,
    getChallengesByTier,
    getChallengesByMode,
    
    // Status
    getChallengeStatus,
    isChallengeClaimedById,
    
    // Questline specific
    getQuestlineDetails,
    
    // Actions
    startChallenge,
    claimChallenge,
    completeQuestlineQuest,
    handleQuestCompletionForQuestline,
    refreshChallenges,
  };
}

export default useChallenges;
