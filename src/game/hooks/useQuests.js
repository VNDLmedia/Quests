// ═══════════════════════════════════════════════════════════════════════════
// PULSE - useQuests Hook
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useGame } from '../GameProvider';
import { QUEST_TEMPLATES, getDailyQuests, isWithinLocation, calculateDistance } from '../config/quests';

export function useQuests() {
  const { 
    activeQuests, 
    completedQuests, 
    completeQuest, 
    currentLocation,
    dispatch 
  } = useGame();

  // Categorized quests
  const categorized = useMemo(() => {
    const daily = activeQuests.filter(q => q.isDaily || q.category === 'daily');
    const story = activeQuests.filter(q => q.category === 'story');
    const challenges = activeQuests.filter(q => q.category === 'challenge');
    const social = activeQuests.filter(q => q.category === 'social');
    const timed = activeQuests.filter(q => q.type === 'timed' && q.startedAt);
    
    return { daily, story, challenges, social, timed, all: activeQuests };
  }, [activeQuests]);

  // Quests near current location
  const nearbyQuests = useMemo(() => {
    if (!currentLocation) return [];
    
    return activeQuests.filter(quest => {
      if (!quest.location) return false;
      
      const isNear = isWithinLocation(
        currentLocation.latitude,
        currentLocation.longitude,
        quest.location
      );
      
      return isNear;
    });
  }, [activeQuests, currentLocation]);

  // Start a quest
  const startQuest = useCallback((questKey) => {
    const template = QUEST_TEMPLATES[questKey];
    if (!template) return null;
    
    const newQuest = {
      id: `${questKey}_${Date.now()}`,
      ...template,
      progress: 0,
      startedAt: new Date().toISOString(),
      expiresAt: template.expiresIn 
        ? new Date(Date.now() + template.expiresIn).toISOString()
        : null,
    };
    
    dispatch({ type: 'ADD_QUEST', payload: newQuest });
    return newQuest;
  }, [dispatch]);

  // Update quest progress
  const updateProgress = useCallback((questId, progress) => {
    const quest = activeQuests.find(q => q.id === questId);
    if (!quest) return;
    
    const newProgress = Math.min(progress, quest.target);
    dispatch({ type: 'UPDATE_QUEST', payload: { id: questId, progress: newProgress } });
    
    // Auto-complete if target reached
    if (newProgress >= quest.target) {
      completeQuest(questId, quest.xpReward);
    }
  }, [activeQuests, dispatch, completeQuest]);

  // Check location-based quest completion
  const checkLocationQuests = useCallback((coords) => {
    if (!coords) return [];
    
    const completedIds = [];
    
    for (const quest of activeQuests) {
      if (quest.type !== 'location' || !quest.location) continue;
      
      const isAtLocation = isWithinLocation(coords.latitude, coords.longitude, quest.location);
      
      if (isAtLocation && quest.progress < quest.target) {
        updateProgress(quest.id, quest.progress + 1);
        completedIds.push(quest.id);
      }
    }
    
    return completedIds;
  }, [activeQuests, updateProgress]);

  // Get distance to quest location
  const getDistanceToQuest = useCallback((quest) => {
    if (!currentLocation || !quest.location) return null;
    
    const { EUROPARK_LOCATIONS } = require('../config/quests');
    const location = EUROPARK_LOCATIONS[quest.location];
    if (!location) return null;
    
    return calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      location.lat,
      location.lng
    );
  }, [currentLocation]);

  // Check for expired quests
  const expiredQuests = useMemo(() => {
    const now = new Date();
    return activeQuests.filter(q => q.expiresAt && new Date(q.expiresAt) < now);
  }, [activeQuests]);

  // Stats
  const stats = useMemo(() => ({
    totalActive: activeQuests.length,
    totalCompleted: completedQuests.length,
    dailyCompleted: completedQuests.filter(q => {
      const completedDate = new Date(q.completedAt).toDateString();
      return completedDate === new Date().toDateString();
    }).length,
    weeklyCompleted: completedQuests.filter(q => {
      const completedDate = new Date(q.completedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return completedDate > weekAgo;
    }).length,
  }), [activeQuests, completedQuests]);

  return {
    // Quest lists
    activeQuests,
    completedQuests,
    nearbyQuests,
    expiredQuests,
    ...categorized,
    
    // Stats
    stats,
    
    // Actions
    startQuest,
    updateProgress,
    completeQuest,
    checkLocationQuests,
    getDistanceToQuest,
  };
}

export default useQuests;

