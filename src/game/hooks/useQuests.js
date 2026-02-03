// ═══════════════════════════════════════════════════════════════════════════
// PULSE - useQuests Hook
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useGame } from '../GameProvider';
import { QUEST_TEMPLATES, isWithinLocation, calculateDistance } from '../config/quests';
import { supabase } from '../../config/supabase';

export function useQuests() {
  const { 
    activeQuests, 
    completedQuests, 
    completeQuest, 
    currentLocation,
    dispatch,
    quests: allQuests, // Now available from context
    user
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
    
    // We can't easily check 'near' without the locations list here
    // For now, let's just return quests that have a location defined
    // In a real app, this hook would need access to the locations list from GameProvider
    return activeQuests.filter(quest => !!quest.location);
  }, [activeQuests, currentLocation]);

  // Start a quest - Supabase first, then update local state
  const startQuest = useCallback(async (questOrKey) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to start quests');
      return null;
    }

    // Handle both quest object or key string
    let template;
    if (typeof questOrKey === 'string') {
        template = allQuests?.find(q => q.key === questOrKey) || QUEST_TEMPLATES[questOrKey];
    } else {
        template = questOrKey;
    }

    if (!template) {
        console.error('Quest template not found for:', questOrKey);
        return null;
    }

    // Find the quest ID from the database
    let dbQuestId = template.id;
    if (template.key) {
      const dbQuest = allQuests?.find(q => q.key === template.key);
      if (dbQuest) dbQuestId = dbQuest.id;
    }

    if (!dbQuestId) {
      console.error('Could not find DB ID for quest:', template);
      Alert.alert('Error', 'Could not start quest: Invalid Quest ID');
      return null;
    }

    const expiresAt = template.expiresIn 
      ? new Date(Date.now() + template.expiresIn).toISOString()
      : null;

    try {
      // Insert into Supabase FIRST
      // console.log('Inserting user_quest:', { user_id: user.id, quest_id: dbQuestId });
      // Insert the user_quest first
      const { data: insertedData, error: insertError } = await supabase.from('user_quests').insert({
        user_id: user.id,
        quest_id: dbQuestId,
        status: 'active',
        progress: 0,
        started_at: new Date().toISOString(),
        expires_at: expiresAt
      }).select('*').single();
      
      if (insertError) {
        console.error('Failed to insert user_quest:', insertError);
        Alert.alert('Error', 'Failed to start quest. ' + (insertError.message || ''));
        return null;
      }

      // Fetch the quest details separately
      const { data: questDetails, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', dbQuestId)
        .single();
      
      const data = insertedData;
      const error = questError;
      
      if (error) {
        console.error('Failed to fetch quest details:', error);
        // Still continue - we have the basic data
      }

      // Build local quest object from DB response
      // IMPORTANT: Spread questDetails first, then override with user_quest specific fields
      const newQuest = {
        ...questDetails,
        // Override with user_quest specific data (MUST come after spread!)
        id: data.id, // Use the user_quest ID from DB, NOT quests.id!
        questId: data.quest_id, // This is the actual quests.id
        // Normalize snake_case
        xpReward: questDetails?.xp_reward,
        timeLimit: questDetails?.time_limit,
        requiresScan: questDetails?.requires_scan,
        target: questDetails?.target_value || 1,
        location: questDetails?.location_id,
        // User-specific data
        progress: data.progress || 0,
        status: data.status,
        startedAt: data.started_at,
        expiresAt: data.expires_at,
      };
      
      // Update local state with the DB data
      dispatch({ type: 'ADD_QUEST', payload: newQuest });

      return newQuest;
    } catch (err) {
      console.error('Error starting quest:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return null;
    }
  }, [dispatch, allQuests, user]);

  // Update quest progress - Supabase first
  const updateProgress = useCallback(async (questId, progress) => {
    const quest = activeQuests.find(q => q.id === questId);
    if (!quest) return;
    
    const newProgress = Math.min(progress, quest.target || 1);
    const isComplete = newProgress >= (quest.target || 1);
    
    // Update Supabase first (questId is now the user_quest.id from DB)
    if (user) {
      try {
        const { error } = await supabase.from('user_quests')
          .update({ 
            progress: newProgress,
            status: isComplete ? 'completed' : 'active',
            completed_at: isComplete ? new Date().toISOString() : null
          })
          .eq('id', questId); // questId IS the user_quest.id
        
        if (error) {
          console.error('Failed to update progress:', error);
        }
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    }

    // Update local state
    dispatch({ type: 'UPDATE_QUEST', payload: { id: questId, progress: newProgress } });

    // Auto-complete if target reached
    if (isComplete) {
      completeQuest(questId);
    }
  }, [activeQuests, dispatch, completeQuest, user]);

  // Check location-based quest completion
  const checkLocationQuests = useCallback((coords) => {
    if (!coords) return [];
    
    const completedIds = [];
    
    // Disabled for now as we migrated away from hardcoded locations
    // Needs to be updated to use locations from context
    
    return completedIds;
  }, []);

  // Get distance to quest location
  const getDistanceToQuest = useCallback((quest) => {
    if (!currentLocation || !quest.location) return null;
    
    // Disabled: Requires locations from context
    return null;
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

