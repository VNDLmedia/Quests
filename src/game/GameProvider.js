// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Central Game State Provider
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured, getSession, onAuthStateChange } from '../config/supabase';
import { LEVEL_CONFIG, calculateFinalXP, DAILY_REWARDS } from './config/rewards';
import { ACHIEVEMENTS, getAllAchievements } from './config/achievements';
import { getDailyQuests, QUEST_TEMPLATES } from './config/quests';
import { getCardByLevel } from './config/cards';

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════
const initialState = {
  // User
  user: null,
  isLoading: true,
  isOnline: false,
  
  // Player Stats
  player: {
    id: null,
    username: 'Guest',
    displayName: 'New Player',
    avatarUrl: null,
    xp: 0,
    level: 1,
    loginStreak: 0,
    lastLoginDate: null,
    streakFreezeCount: 0,
    totalQuestsCompleted: 0,
    totalDistanceWalked: 0,
    friendsCount: 0,
    challengesWon: 0,
    challengeWinStreak: 0,
    rewardsRedeemed: 0,
  },
  
  // Collection
  collection: [], 
  justUnlockedCard: null,

  // Achievements
  achievements: [], // Unlocked achievement keys
  achievementProgress: {}, // Progress tracking
  newAchievement: null, // For toast notification
  
  // Quests
  activeQuests: [],
  completedQuests: [],
  dailyQuestsClaimedToday: false,
  
  // Daily Rewards
  dailyReward: null, // Today's reward if available
  hasClaimedDailyReward: false,
  
  // Social
  friends: [],
  incomingFriendRequests: [],
  activeChallenges: [],
  activityFeed: [],
  
  // Leaderboard
  leaderboard: [],
  myRank: null,
  
  // Location
  currentLocation: null,
  nearbyQuests: [],
  
  // UI State
  toasts: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// ACTION TYPES
// ═══════════════════════════════════════════════════════════════════════════
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_PLAYER: 'SET_PLAYER',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  ADD_XP: 'ADD_XP',
  LEVEL_UP: 'LEVEL_UP',
  
  UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',
  UPDATE_ACHIEVEMENT_PROGRESS: 'UPDATE_ACHIEVEMENT_PROGRESS',
  CLEAR_NEW_ACHIEVEMENT: 'CLEAR_NEW_ACHIEVEMENT',
  
  SET_QUESTS: 'SET_QUESTS',
  ADD_QUEST: 'ADD_QUEST',
  UPDATE_QUEST: 'UPDATE_QUEST',
  COMPLETE_QUEST: 'COMPLETE_QUEST',
  
  CLAIM_DAILY_REWARD: 'CLAIM_DAILY_REWARD',
  UPDATE_STREAK: 'UPDATE_STREAK',
  
  SET_FRIENDS: 'SET_FRIENDS',
  ADD_FRIEND: 'ADD_FRIEND',
  SET_CHALLENGES: 'SET_CHALLENGES',
  UPDATE_CHALLENGE: 'UPDATE_CHALLENGE',
  SET_ACTIVITY_FEED: 'SET_ACTIVITY_FEED',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  
  SET_LEADERBOARD: 'SET_LEADERBOARD',
  
  SET_LOCATION: 'SET_LOCATION',
  SET_NEARBY_QUESTS: 'SET_NEARBY_QUESTS',
  
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  
  ACKNOWLEDGE_CARD: 'ACKNOWLEDGE_CARD',

  HYDRATE_STATE: 'HYDRATE_STATE',
};

// ═══════════════════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════════════════
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload, isOnline: !!action.payload };
      
    case ACTIONS.SET_PLAYER:
      return { ...state, player: { ...state.player, ...action.payload } };
      
    case ACTIONS.UPDATE_PLAYER:
      return { 
        ...state, 
        player: { ...state.player, ...action.payload }
      };
      
    case ACTIONS.ADD_XP: {
      const newXP = state.player.xp + action.payload;
      const newLevel = LEVEL_CONFIG.getLevelFromXP(newXP);
      const leveledUp = newLevel > state.player.level;
      
      // Check for Card Unlock
      let newUnlockedCard = null;
      let newCollection = state.collection;
      
      if (leveledUp) {
        const cardReward = getCardByLevel(newLevel);
        if (cardReward && !state.collection.includes(cardReward.id)) {
          newUnlockedCard = cardReward;
          newCollection = [...state.collection, cardReward.id];
        }
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          xp: newXP,
          level: newLevel,
        },
        collection: newCollection,
        justUnlockedCard: newUnlockedCard,
        toasts: leveledUp 
          ? [...state.toasts, { id: Date.now(), type: 'level_up', level: newLevel }]
          : state.toasts,
      };
    }
    
    case ACTIONS.ACKNOWLEDGE_CARD:
      return { ...state, justUnlockedCard: null };
      
    case ACTIONS.UNLOCK_ACHIEVEMENT: {
      const achievement = ACHIEVEMENTS[action.payload];
      if (!achievement || state.achievements.includes(action.payload)) {
        return state;
      }
      
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
        newAchievement: achievement,
        player: {
          ...state.player,
          xp: state.player.xp + achievement.xp,
        },
      };
    }
    
    case ACTIONS.UPDATE_ACHIEVEMENT_PROGRESS:
      return {
        ...state,
        achievementProgress: {
          ...state.achievementProgress,
          [action.payload.key]: action.payload.progress,
        },
      };
      
    case ACTIONS.CLEAR_NEW_ACHIEVEMENT:
      return { ...state, newAchievement: null };
      
    case ACTIONS.SET_QUESTS:
      return { 
        ...state, 
        activeQuests: action.payload.active || state.activeQuests,
        completedQuests: action.payload.completed || state.completedQuests,
      };
      
    case ACTIONS.ADD_QUEST:
      return {
        ...state,
        activeQuests: [...state.activeQuests, action.payload],
      };
      
    case ACTIONS.UPDATE_QUEST:
      return {
        ...state,
        activeQuests: state.activeQuests.map(q => 
          q.id === action.payload.id ? { ...q, ...action.payload } : q
        ),
      };
      
    case ACTIONS.COMPLETE_QUEST: {
      const quest = state.activeQuests.find(q => q.id === action.payload);
      if (!quest) return state;
      
      return {
        ...state,
        activeQuests: state.activeQuests.filter(q => q.id !== action.payload),
        completedQuests: [...state.completedQuests, { ...quest, completedAt: new Date().toISOString() }],
        player: {
          ...state.player,
          totalQuestsCompleted: state.player.totalQuestsCompleted + 1,
        },
      };
    }
    
    case ACTIONS.CLAIM_DAILY_REWARD:
      return {
        ...state,
        hasClaimedDailyReward: true,
        dailyReward: action.payload,
        player: {
          ...state.player,
          loginStreak: action.payload.newStreak,
          lastLoginDate: new Date().toDateString(),
        },
      };
      
    case ACTIONS.UPDATE_STREAK:
      return {
        ...state,
        player: {
          ...state.player,
          loginStreak: action.payload.streak,
          lastLoginDate: action.payload.date,
        },
      };
      
    case ACTIONS.SET_FRIENDS:
      return { 
        ...state, 
        friends: action.payload.friends || state.friends,
        incomingFriendRequests: action.payload.requests || state.incomingFriendRequests,
        player: {
          ...state.player,
          friendsCount: (action.payload.friends || state.friends).length,
        },
      };
      
    case ACTIONS.ADD_FRIEND:
      return {
        ...state,
        friends: [...state.friends, action.payload],
        incomingFriendRequests: state.incomingFriendRequests.filter(r => r.id !== action.payload.id),
        player: {
          ...state.player,
          friendsCount: state.player.friendsCount + 1,
        },
      };
      
    case ACTIONS.SET_CHALLENGES:
      return { ...state, activeChallenges: action.payload };
      
    case ACTIONS.UPDATE_CHALLENGE:
      return {
        ...state,
        activeChallenges: state.activeChallenges.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
      
    case ACTIONS.SET_ACTIVITY_FEED:
      return { ...state, activityFeed: action.payload };
      
    case ACTIONS.ADD_ACTIVITY:
      return {
        ...state,
        activityFeed: [action.payload, ...state.activityFeed].slice(0, 50),
      };
      
    case ACTIONS.SET_LEADERBOARD:
      return { 
        ...state, 
        leaderboard: action.payload.data,
        myRank: action.payload.myRank,
      };
      
    case ACTIONS.SET_LOCATION:
      return { ...state, currentLocation: action.payload };
      
    case ACTIONS.SET_NEARBY_QUESTS:
      return { ...state, nearbyQuests: action.payload };
      
    case ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, { id: Date.now(), ...action.payload }],
      };
      
    case ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };
      
    case ACTIONS.HYDRATE_STATE:
      return { ...state, ...action.payload, isLoading: false };
      
    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════
const GameContext = createContext(null);

// Storage keys
const STORAGE_KEYS = {
  PLAYER: '@ethernal_player',
  ACHIEVEMENTS: '@ethernal_achievements',
  QUESTS: '@ethernal_quests',
  DAILY_REWARD: '@ethernal_daily_reward',
  COLLECTION: '@ethernal_collection',
};

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD PROFILE FROM SUPABASE
  // ─────────────────────────────────────────────────────────────────────────
  const loadUserProfile = useCallback(async (userId, authUser = null) => {
    if (!isSupabaseConfigured() || !userId) return { profile: null, error: null };

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to load profile:', error);
        // Return error so caller can handle it (e.g., sign out deleted users)
        return { profile: null, error };
      }

      if (profile) {
        // Get display name from profile, or fall back to auth metadata
        const authMetadata = authUser?.user_metadata || {};
        const displayName = profile.display_name && profile.display_name !== 'New Player'
          ? profile.display_name
          : authMetadata.display_name || profile.display_name || 'New Player';
        
        // If profile has default name but auth has real name, update the profile
        if (profile.display_name === 'New Player' && authMetadata.display_name) {
          await supabase
            .from('profiles')
            .update({ display_name: authMetadata.display_name })
            .eq('id', userId);
        }

        // Map profile fields to player state
        dispatch({
          type: ACTIONS.SET_PLAYER,
          payload: {
            id: profile.id,
            username: profile.username || 'User',
            displayName: displayName,
            avatarUrl: profile.avatar_url,
            xp: profile.xp || 0,
            level: profile.level || 1,
            loginStreak: profile.login_streak || 0,
            lastLoginDate: profile.last_login_date,
            streakFreezeCount: profile.streak_freeze_count || 0,
            totalQuestsCompleted: profile.total_quests_completed || 0,
            totalDistanceWalked: profile.total_distance_walked || 0,
          },
        });
      }

      return { profile, error: null };
    } catch (error) {
      console.error('Error loading profile:', error);
      return { profile: null, error };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return;
    }

    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          const { profile, error } = await loadUserProfile(session.user.id, session.user);
          
          // If profile doesn't exist (user was deleted), sign out
          if (error || !profile) {
            console.log('User profile not found, signing out stale session');
            await supabase.auth.signOut();
            // Clear persisted state
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.PLAYER,
              STORAGE_KEYS.ACHIEVEMENTS,
              STORAGE_KEYS.QUESTS,
              STORAGE_KEYS.DAILY_REWARD,
              STORAGE_KEYS.COLLECTION,
            ]);
            dispatch({ type: ACTIONS.SET_USER, payload: null });
          } else {
            dispatch({ type: ACTIONS.SET_USER, payload: session.user });
          }
        } else {
          dispatch({ type: ACTIONS.SET_USER, payload: null });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        dispatch({ type: ACTIONS.SET_USER, payload: null });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { profile, error } = await loadUserProfile(session.user.id, session.user);
        
        // If profile doesn't exist, sign out
        if (error || !profile) {
          console.log('User profile not found after sign in');
          await supabase.auth.signOut();
          dispatch({ type: ACTIONS.SET_USER, payload: null });
        } else {
          dispatch({ type: ACTIONS.SET_USER, payload: session.user });
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: ACTIONS.SET_USER, payload: null });
        // Reset player state to guest
        dispatch({
          type: ACTIONS.SET_PLAYER,
          payload: {
            id: null,
            username: 'Guest',
            displayName: 'New Player',
            avatarUrl: null,
            xp: 0,
            level: 1,
            loginStreak: 0,
            lastLoginDate: null,
            streakFreezeCount: 0,
            totalQuestsCompleted: 0,
            totalDistanceWalked: 0,
            friendsCount: 0,
            challengesWon: 0,
            challengeWinStreak: 0,
            rewardsRedeemed: 0,
          },
        });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        dispatch({ type: ACTIONS.SET_USER, payload: session.user });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserProfile]);

  // ─────────────────────────────────────────────────────────────────────────
  // PERSISTENCE - Load from AsyncStorage
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const [playerData, achievementsData, questsData, dailyData, collectionData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PLAYER),
          AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.QUESTS),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_REWARD),
          AsyncStorage.getItem(STORAGE_KEYS.COLLECTION),
        ]);

        const hydratedState = {};
        
        if (playerData) {
          hydratedState.player = { ...initialState.player, ...JSON.parse(playerData) };
        }
        
        if (achievementsData) {
          hydratedState.achievements = JSON.parse(achievementsData);
        }

        if (collectionData) {
          hydratedState.collection = JSON.parse(collectionData);
        } else {
          hydratedState.collection = [];
        }
        
        if (questsData) {
          const quests = JSON.parse(questsData);
          hydratedState.activeQuests = quests.active || [];
          hydratedState.completedQuests = quests.completed || [];
        }
        
        if (dailyData) {
          const daily = JSON.parse(dailyData);
          const today = new Date().toDateString();
          hydratedState.hasClaimedDailyReward = daily.date === today;
          hydratedState.dailyReward = daily.date === today ? daily.reward : null;
        }

        // Check for daily quests refresh
        const lastQuestDate = hydratedState.activeQuests?.[0]?.generatedAt;
        const today = new Date().toDateString();
        if (lastQuestDate !== today) {
          // Generate fresh daily quests
          const dailyQuests = getDailyQuests();
          hydratedState.activeQuests = [
            ...dailyQuests,
            ...(hydratedState.activeQuests || []).filter(q => !q.isDaily),
          ];
        }

        dispatch({ type: ACTIONS.HYDRATE_STATE, payload: hydratedState });
      } catch (error) {
        console.error('Failed to load persisted state:', error);
        // Don't set loading to false here, let auth init handle it
      }
    };

    loadPersistedState();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PERSISTENCE - Save to AsyncStorage
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.isLoading) return;

    const persistState = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(state.player)),
          AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(state.achievements)),
          AsyncStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify({
            active: state.activeQuests,
            completed: state.completedQuests,
          })),
          AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(state.collection)),
        ]);
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    };

    persistState();
  }, [state.player, state.achievements, state.activeQuests, state.completedQuests, state.isLoading]);

  // ─────────────────────────────────────────────────────────────────────────
  // SUPABASE REALTIME SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !state.user) return;

    // Subscribe to leaderboard changes
    const leaderboardChannel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leaderboard' 
      }, (payload) => {
        // Refresh leaderboard on changes
        fetchLeaderboard();
      })
      .subscribe();

    // Subscribe to activity feed
    const activityChannel = supabase
      .channel('activity_feed_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
      }, (payload) => {
        dispatch({ type: ACTIONS.ADD_ACTIVITY, payload: payload.new });
      })
      .subscribe();

    // Subscribe to challenges
    const challengeChannel = supabase
      .channel('challenge_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges',
        filter: `opponent_id=eq.${state.user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // New challenge received
          dispatch({ type: ACTIONS.ADD_TOAST, payload: { type: 'challenge', data: payload.new } });
        }
        fetchChallenges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leaderboardChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(challengeChannel);
    };
  }, [state.user]);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  // Sign up with email and password
  const signUp = useCallback(async (email, password, displayName) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase is not configured' } };
    }

    // Display name is required
    if (!displayName || displayName.trim().length < 2) {
      return { error: { message: 'Display name is required' } };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            username: displayName.trim().toLowerCase().replace(/\s+/g, '_'),
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        dispatch({ type: ACTIONS.SET_USER, payload: data.user });
        // Update player state with display name immediately
        dispatch({
          type: ACTIONS.UPDATE_PLAYER,
          payload: {
            displayName: displayName.trim(),
            username: displayName.trim().toLowerCase().replace(/\s+/g, '_'),
          },
        });
        // Profile will be created by database trigger, load it after a short delay
        setTimeout(async () => {
          const { error: profileError } = await loadUserProfile(data.user.id, data.user);
          if (profileError) {
            console.error('Failed to load profile after signup:', profileError);
          }
        }, 500);
      }

      return { data, error: null };
    } catch (error) {
      return { error: { message: error.message || 'Failed to sign up' } };
    }
  }, [loadUserProfile]);

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase is not configured' } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        const { profile, error: profileError } = await loadUserProfile(data.user.id, data.user);
        if (profileError || !profile) {
          // Profile doesn't exist - this shouldn't happen on normal sign in
          await supabase.auth.signOut();
          return { error: { message: 'Account not found. Please sign up again.' } };
        }
        dispatch({ type: ACTIONS.SET_USER, payload: data.user });
      }

      return { data, error: null };
    } catch (error) {
      return { error: { message: error.message || 'Failed to sign in' } };
    }
  }, [loadUserProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase is not configured' } };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
      }

      // Clear persisted state
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.PLAYER,
          STORAGE_KEYS.ACHIEVEMENTS,
          STORAGE_KEYS.QUESTS,
          STORAGE_KEYS.DAILY_REWARD,
          STORAGE_KEYS.COLLECTION,
        ]);
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError);
      }

      dispatch({ type: ACTIONS.SET_USER, payload: null });
      // Reset to initial state
      dispatch({
        type: ACTIONS.SET_PLAYER,
        payload: {
          id: null,
          username: 'Guest',
          displayName: 'New Player',
          avatarUrl: null,
          xp: 0,
          level: 1,
          loginStreak: 0,
          lastLoginDate: null,
          streakFreezeCount: 0,
          totalQuestsCompleted: 0,
          totalDistanceWalked: 0,
          friendsCount: 0,
          challengesWon: 0,
          challengeWinStreak: 0,
          rewardsRedeemed: 0,
        },
      });

      return { error: null };
    } catch (error) {
      return { error: { message: error.message || 'Failed to sign out' } };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  // Add XP with multipliers
  const addXP = useCallback((amount, reason = '') => {
    const finalXP = calculateFinalXP(amount, state.player.loginStreak);
    dispatch({ type: ACTIONS.ADD_XP, payload: finalXP });
    
    // Check for XP-based achievements
    checkAchievements({ totalXP: state.player.xp + finalXP });
    
    // Sync to Supabase if online
    if (isSupabaseConfigured() && state.user) {
      supabase.rpc('add_xp', { p_user_id: state.user.id, p_amount: finalXP });
    }
    
    return finalXP;
  }, [state.player.loginStreak, state.player.xp, state.user]);

  // Claim daily reward
  const claimDailyReward = useCallback(async () => {
    if (state.hasClaimedDailyReward) return null;
    
    const today = new Date().toDateString();
    const lastLogin = state.player.lastLoginDate;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let newStreak = state.player.loginStreak;
    
    if (lastLogin === yesterday) {
      // Continue streak
      newStreak += 1;
    } else if (lastLogin !== today) {
      // Streak broken (unless we have a freeze)
      if (state.player.streakFreezeCount > 0) {
        // Use streak freeze
        dispatch({ type: ACTIONS.UPDATE_PLAYER, payload: { 
          streakFreezeCount: state.player.streakFreezeCount - 1 
        }});
      } else {
        newStreak = 1;
      }
    }
    
    // Get reward for this streak day (cycles every 7 days)
    const streakDay = ((newStreak - 1) % 7);
    const reward = DAILY_REWARDS[streakDay];
    const xpReward = calculateFinalXP(reward.xp, newStreak);
    
    const rewardData = {
      ...reward,
      xpReward,
      newStreak,
      streakDay: streakDay + 1,
    };
    
    dispatch({ type: ACTIONS.CLAIM_DAILY_REWARD, payload: rewardData });
    dispatch({ type: ACTIONS.ADD_XP, payload: xpReward });
    
    // Persist daily reward claim
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_REWARD, JSON.stringify({
      date: today,
      reward: rewardData,
    }));
    
    // Check streak achievements
    checkAchievements({ loginStreak: newStreak });
    
    // Sync to Supabase
    if (isSupabaseConfigured() && state.user) {
      supabase.rpc('update_streak', { p_user_id: state.user.id });
    }
    
    return rewardData;
  }, [state.hasClaimedDailyReward, state.player, state.user]);

  // Complete a quest
  const completeQuest = useCallback((questId, xpReward) => {
    dispatch({ type: ACTIONS.COMPLETE_QUEST, payload: questId });
    
    const finalXP = addXP(xpReward, 'Quest completed');
    
    // Check quest achievements
    checkAchievements({ 
      questsCompleted: state.player.totalQuestsCompleted + 1 
    });
    
    // Add activity
    const quest = state.activeQuests.find(q => q.id === questId);
    if (quest) {
      dispatch({ type: ACTIONS.ADD_ACTIVITY, payload: {
        type: 'quest_complete',
        title: `Completed "${quest.title}"`,
        xp: finalXP,
        timestamp: new Date().toISOString(),
      }});
    }
    
    return finalXP;
  }, [addXP, state.player.totalQuestsCompleted, state.activeQuests]);

  // Check and unlock achievements
  const checkAchievements = useCallback((stats) => {
    const allAchievements = getAllAchievements();
    const playerStats = { ...state.player, ...stats };
    
    for (const achievement of allAchievements) {
      // Skip already unlocked
      if (state.achievements.includes(achievement.key)) continue;
      
      const { type, value } = achievement.condition;
      let currentValue = 0;
      
      switch (type) {
        case 'quests_completed':
          currentValue = playerStats.totalQuestsCompleted;
          break;
        case 'friends_count':
          currentValue = playerStats.friendsCount;
          break;
        case 'login_streak':
          currentValue = playerStats.loginStreak;
          break;
        case 'level':
          currentValue = playerStats.level;
          break;
        case 'total_xp':
          currentValue = playerStats.xp || playerStats.totalXP;
          break;
        case 'challenges_won':
          currentValue = playerStats.challengesWon;
          break;
        case 'distance_walked':
          currentValue = playerStats.totalDistanceWalked;
          break;
        case 'rewards_redeemed':
          currentValue = playerStats.rewardsRedeemed;
          break;
        default:
          continue;
      }
      
      // Update progress
      dispatch({ 
        type: ACTIONS.UPDATE_ACHIEVEMENT_PROGRESS, 
        payload: { key: achievement.key, progress: currentValue }
      });
      
      // Check if unlocked
      if (currentValue >= value) {
        dispatch({ type: ACTIONS.UNLOCK_ACHIEVEMENT, payload: achievement.key });
        
        // Post to activity feed
        if (isSupabaseConfigured() && state.user) {
          supabase.from('activity_feed').insert({
            user_id: state.user.id,
            activity_type: 'achievement',
            title: `Unlocked "${achievement.name}"`,
            metadata: { achievement_key: achievement.key },
          });
        }
      }
    }
  }, [state.achievements, state.player, state.user]);

  // Add friend
  const addFriend = useCallback(async (friendId) => {
    if (isSupabaseConfigured() && state.user) {
      const { data, error } = await supabase
        .from('friendships')
        .insert({ user_id: state.user.id, friend_id: friendId });
      
      if (!error) {
        // Get friend profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', friendId)
          .single();
        
        if (profile) {
          dispatch({ type: ACTIONS.ADD_FRIEND, payload: profile });
          checkAchievements({ friendsCount: state.player.friendsCount + 1 });
        }
      }
      return { data, error };
    }
    return { error: 'Not connected' };
  }, [state.user, state.player.friendsCount, checkAchievements]);

  // Create challenge
  const createChallenge = useCallback(async (opponentId, questKey) => {
    if (!isSupabaseConfigured() || !state.user) return { error: 'Not connected' };
    
    const quest = QUEST_TEMPLATES[questKey];
    if (!quest) return { error: 'Invalid quest' };
    
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        challenger_id: state.user.id,
        opponent_id: opponentId,
        quest_key: questKey,
        xp_reward: quest.xpReward * 2, // Double XP for challenges
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();
    
    return { data, error };
  }, [state.user]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    
    const { data, error } = await supabase
      .from('leaderboard')
      .select(`
        weekly_xp,
        profiles:user_id (id, username, display_name, avatar_url, level)
      `)
      .order('weekly_xp', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      const leaderboardData = data.map((item, index) => ({
        rank: index + 1,
        ...item.profiles,
        weeklyXP: item.weekly_xp,
      }));
      
      const myRank = state.user 
        ? leaderboardData.findIndex(p => p.id === state.user.id) + 1 
        : null;
      
      dispatch({ 
        type: ACTIONS.SET_LEADERBOARD, 
        payload: { data: leaderboardData, myRank: myRank || null }
      });
    }
  }, [state.user]);

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    if (!isSupabaseConfigured() || !state.user) return;
    
    const { data } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:challenger_id (username, display_name, avatar_url),
        opponent:opponent_id (username, display_name, avatar_url)
      `)
      .or(`challenger_id.eq.${state.user.id},opponent_id.eq.${state.user.id}`)
      .in('status', ['pending', 'active']);
    
    if (data) {
      dispatch({ type: ACTIONS.SET_CHALLENGES, payload: data });
    }
  }, [state.user]);

  // Update location
  const updateLocation = useCallback((coords) => {
    dispatch({ type: ACTIONS.SET_LOCATION, payload: coords });
  }, []);

  // Clear new achievement (after toast shown)
  const clearNewAchievement = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_NEW_ACHIEVEMENT });
  }, []);

  // Remove toast
  const removeToast = useCallback((toastId) => {
    dispatch({ type: ACTIONS.REMOVE_TOAST, payload: toastId });
  }, []);

  const acknowledgeCard = useCallback(() => {
    dispatch({ type: ACTIONS.ACKNOWLEDGE_CARD });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────
  const value = {
    ...state,
    
    // Auth Actions
    signIn,
    signUp,
    signOut,
    
    // Actions
    addXP,
    claimDailyReward,
    completeQuest,
    checkAchievements,
    addFriend,
    createChallenge,
    fetchLeaderboard,
    fetchChallenges,
    updateLocation,
    clearNewAchievement,
    removeToast,
    acknowledgeCard,
    
    // Utilities
    dispatch,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export default GameProvider;

