// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Central Game State Provider
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getSession, onAuthStateChange } from '../config/supabase';
import { DAILY_REWARDS } from './config/rewards';
import { ACHIEVEMENTS, getAllAchievements } from './config/achievements';
import { QUEST_TEMPLATES } from './config/quests';
import { CARDS, getCardById } from './config/cards';
// Pack system removed - cards are now earned through quest completion

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
    score: 0, // Score-System ersetzt XP
    loginStreak: 0,
    lastLoginDate: null,
    streakFreezeCount: 0,
    totalQuestsCompleted: 0,
    totalDistanceWalked: 0,
    friendsCount: 0,
    // Social Features
    bio: '',
    linkedinUrl: '',
    leaderboardVisible: false,
    // Team System
    team: null, // blue, yellow, green, or purple
  },
  
  // Collection (cards earned through quests)
  collection: [], // Array of owned card IDs (can have duplicates for count)
  uniqueCards: [], // Array of unique card IDs owned
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
  
  // Game Data
  quests: [], // Available quest templates
  locations: [], // POI locations
  
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
  // Cards (earned through quests)
  ADD_CARDS_TO_COLLECTION: 'ADD_CARDS_TO_COLLECTION',
  
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
  SET_GAME_DATA: 'SET_GAME_DATA',
  
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
      
    // ─────────────────────────────────────────────────────────────────────────
    // CARDS (earned through quests)
    // ─────────────────────────────────────────────────────────────────────────
    case ACTIONS.ADD_CARDS_TO_COLLECTION: {
      const cardIds = action.payload;
      const updatedCollection = [...state.collection, ...cardIds];
      const updatedUniqueCards = [...new Set(updatedCollection)];
      
      return {
        ...state,
        collection: updatedCollection,
        uniqueCards: updatedUniqueCards,
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
          score: (state.player.score || 0) + 10, // Award score for achievements
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
      
    case ACTIONS.SET_GAME_DATA:
      return { 
        ...state, 
        quests: action.payload.quests || state.quests,
        locations: action.payload.locations || state.locations 
      };
      
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

        // Assign random team if not set
        let playerTeam = profile.team;
        if (!playerTeam) {
          const teams = ['blue', 'yellow', 'green', 'purple'];
          playerTeam = teams[Math.floor(Math.random() * teams.length)];
          // Save to database
          await supabase
            .from('profiles')
            .update({ team: playerTeam })
            .eq('id', profile.id);
        }

        // Map profile fields to player state
        dispatch({
          type: ACTIONS.SET_PLAYER,
          payload: {
            id: profile.id,
            username: profile.username || 'User',
            displayName: displayName,
            avatarUrl: profile.avatar_url,
            score: profile.score || 0,
            loginStreak: profile.login_streak || 0,
            lastLoginDate: profile.last_login_date,
            streakFreezeCount: profile.streak_freeze_count || 0,
            totalQuestsCompleted: profile.total_quests_completed || 0,
            totalDistanceWalked: profile.total_distance_walked || 0,
            admin: profile.admin || false,
            // Social Features
            bio: profile.bio || '',
            linkedinUrl: profile.linkedin_url || '',
            leaderboardVisible: profile.leaderboard_visible || false,
            // Team System
            team: playerTeam,
          },
        });
        
        // Load user's card collection
        if (profile.card_collection) {
          const collection = typeof profile.card_collection === 'string' 
            ? JSON.parse(profile.card_collection) 
            : profile.card_collection;
          dispatch({
            type: ACTIONS.ADD_CARDS_TO_COLLECTION,
            payload: collection || [],
          });
        }
      }

      return { profile, error: null };
    } catch (error) {
      console.error('Error loading profile:', error);
      return { profile: null, error };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD GAME DATA (Quests & Locations)
  // ─────────────────────────────────────────────────────────────────────────
  const fetchGameData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const [questsResult, locationsResult] = await Promise.all([
        supabase.from('quests').select('*'),
        supabase.from('locations').select('*')
      ]);
      
      if (questsResult.error) console.error('Error fetching quests:', questsResult.error);
      if (locationsResult.error) console.error('Error fetching locations:', locationsResult.error);
      
      const quests = questsResult.data || [];
      const locations = locationsResult.data || [];
      
      // Transform quests to match internal format if needed
      const normalizedQuests = quests.map(q => ({
        ...q,
        xpReward: q.xp_reward,
        gemReward: q.gem_reward || Math.floor(q.xp_reward / 2), // Default gem reward
        timeLimit: q.time_limit,
        expiresIn: q.expires_in,
        requiresScan: q.requires_scan,
        target: q.target_value,
        location: q.location_id,
        locations: q.multi_locations,
      }));
      
      // Transform locations to object map for easy lookup
      const locationsMap = locations.reduce((acc, loc) => {
        acc[loc.id] = loc;
        return acc;
      }, {});
      
      dispatch({ 
        type: ACTIONS.SET_GAME_DATA, 
        payload: { quests: normalizedQuests, locations: locationsMap } 
      });
      
      console.log('Game data loaded:', normalizedQuests.length, 'quests', Object.keys(locationsMap).length, 'locations');
      return { quests: normalizedQuests, locations: locationsMap };
    } catch (error) {
      console.error('Failed to fetch game data:', error);
      return { quests: [], locations: {} };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH USER QUESTS FROM SUPABASE
  // ─────────────────────────────────────────────────────────────────────────
  const fetchUserQuests = useCallback(async (userId) => {
    if (!isSupabaseConfigured() || !userId) return;
    
    try {
      // Fetch user's active quests with quest details
      const { data: userQuests, error } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quest_id (*)
        `)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user quests:', error);
        return;
      }
      
      // Transform to internal format
      const activeQuests = [];
      const completedQuests = [];
      
      for (const uq of userQuests || []) {
        // Extract coordinates from quest metadata if available
        const metadata = uq.quest?.metadata || {};
        
        const questData = {
          id: uq.id,
          questId: uq.quest_id,
          ...uq.quest,
          xpReward: uq.quest?.xp_reward,
          gemReward: uq.quest?.gem_reward || Math.floor((uq.quest?.xp_reward || 0) / 2),
          timeLimit: uq.quest?.time_limit,
          expiresIn: uq.quest?.expires_in,
          requiresScan: uq.quest?.requires_scan,
          target: uq.quest?.target_value || 1,
          location: uq.quest?.location_id,
          progress: uq.progress || 0,
          status: uq.status,
          startedAt: uq.started_at,
          completedAt: uq.completed_at,
          expiresAt: uq.expires_at,
          // Include coordinates from metadata for map display
          lat: metadata.lat,
          lng: metadata.lng,
          metadata: metadata,
        };
        
        if (uq.status === 'completed') {
          completedQuests.push(questData);
        } else if (uq.status === 'active') {
          activeQuests.push(questData);
        }
      }
      
      dispatch({
        type: ACTIONS.SET_QUESTS,
        payload: { active: activeQuests, completed: completedQuests }
      });
      
      console.log('User quests loaded:', activeQuests.length, 'active,', completedQuests.length, 'completed');
    } catch (error) {
      console.error('Failed to fetch user quests:', error);
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

    // Load static game data (quests, locations)
    fetchGameData();

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
            dispatch({ type: ACTIONS.SET_USER, payload: null });
          } else {
            dispatch({ type: ACTIONS.SET_USER, payload: session.user });
            // Fetch user's quests from Supabase
            await fetchUserQuests(session.user.id);
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
          // Fetch user's quests from Supabase
          await fetchUserQuests(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: ACTIONS.SET_USER, payload: null });
        // Reset to initial state
        dispatch({
          type: ACTIONS.SET_PLAYER,
          payload: {
            id: null,
            username: 'Guest',
            displayName: 'New Player',
            avatarUrl: null,
            score: 0,
            loginStreak: 0,
            lastLoginDate: null,
            streakFreezeCount: 0,
            totalQuestsCompleted: 0,
            totalDistanceWalked: 0,
            friendsCount: 0,
            bio: '',
            linkedinUrl: '',
            leaderboardVisible: false,
          },
        });
        // Clear quests
        dispatch({ type: ACTIONS.SET_QUESTS, payload: { active: [], completed: [] } });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        dispatch({ type: ACTIONS.SET_USER, payload: session.user });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserProfile, fetchUserQuests, fetchGameData]);

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
        // Fetch user's quests from Supabase
        await fetchUserQuests(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      return { error: { message: error.message || 'Failed to sign in' } };
    }
  }, [loadUserProfile, fetchUserQuests]);

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

      // The onAuthStateChange listener will handle resetting state
      return { error: null };
    } catch (error) {
      return { error: { message: error.message || 'Failed to sign out' } };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // SCORE SYSTEM (ersetzt XP und Gems)
  // ─────────────────────────────────────────────────────────────────────────
  
  // Add score points
  const addScore = useCallback((amount, reason = '') => {
    const newScore = state.player.score + amount;
    dispatch({ type: ACTIONS.UPDATE_PLAYER, payload: { score: newScore } });
    
    // Sync to Supabase if online
    if (isSupabaseConfigured() && state.user) {
      supabase
        .from('profiles')
        .update({ score: newScore })
        .eq('id', state.user.id);
    }
    
    return amount;
  }, [state.player.score, state.user]);

  // ─────────────────────────────────────────────────────────────────────────
  // CARD REWARD SYSTEM (Karten als Quest-Belohnung)
  // ─────────────────────────────────────────────────────────────────────────
  
  // Award a random card (called when completing a quest)
  const awardRandomCard = useCallback(() => {
    // Get a random card that the player doesn't have yet
    const unownedCards = CARDS.filter(card => !state.uniqueCards.includes(card.id));
    
    let cardToAward;
    if (unownedCards.length > 0) {
      // Award a new card
      cardToAward = unownedCards[Math.floor(Math.random() * unownedCards.length)];
    } else {
      // All cards owned, give a random duplicate
      cardToAward = CARDS[Math.floor(Math.random() * CARDS.length)];
    }
    
    // Add card to collection
    const updatedCollection = [...state.collection, cardToAward.id];
    const updatedUniqueCards = [...new Set(updatedCollection)];
    
    dispatch({
      type: ACTIONS.ADD_CARDS_TO_COLLECTION,
      payload: [cardToAward.id],
    });
    
    // Add score for new card
    if (!state.uniqueCards.includes(cardToAward.id)) {
      addScore(5, 'New card collected');
    }
    
    // Sync collection to Supabase
    if (isSupabaseConfigured() && state.user) {
      supabase
        .from('profiles')
        .update({ card_collection: updatedCollection })
        .eq('id', state.user.id);
    }
    
    return cardToAward;
  }, [state.collection, state.uniqueCards, state.user, addScore]);

  // Claim daily reward - now only updates streak, no XP/Gems
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
    
    const rewardData = {
      newStreak,
      streakDay: streakDay + 1,
    };
    
    dispatch({ type: ACTIONS.CLAIM_DAILY_REWARD, payload: rewardData });
    
    // Check streak achievements
    checkAchievements({ loginStreak: newStreak });
    
    // Sync to Supabase
    if (isSupabaseConfigured() && state.user) {
      supabase.rpc('update_streak', { p_user_id: state.user.id });
    }
    
    return rewardData;
  }, [state.hasClaimedDailyReward, state.player, state.user]);

  // Complete a quest - awards score and a random card
  const completeQuest = useCallback(async (questId) => {
    const quest = state.activeQuests.find(q => q.id === questId);
    
    // Update local state first (optimistic)
    dispatch({ type: ACTIONS.COMPLETE_QUEST, payload: questId });
    
    // Award score points
    const scoreEarned = 10;
    addScore(scoreEarned, 'Quest completed');
    
    // Award a random card
    const awardedCard = awardRandomCard();
    
    // Update Supabase
    if (isSupabaseConfigured() && state.user) {
      try {
        await supabase
          .from('user_quests')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', questId);
        
        // Update profile stats
        await supabase
          .from('profiles')
          .update({ 
            total_quests_completed: state.player.totalQuestsCompleted + 1,
            score: state.player.score + scoreEarned,
          })
          .eq('id', state.user.id);
      } catch (error) {
        console.error('Failed to update quest completion in DB:', error);
      }
    }
    
    // Check quest achievements
    checkAchievements({ 
      questsCompleted: state.player.totalQuestsCompleted + 1 
    });
    
    // Add activity
    if (quest) {
      dispatch({ type: ACTIONS.ADD_ACTIVITY, payload: {
        type: 'quest_complete',
        title: `Completed "${quest.title}"`,
        score: scoreEarned,
        card: awardedCard?.name,
        timestamp: new Date().toISOString(),
      }});
    }
    
    return { score: scoreEarned, card: awardedCard };
  }, [addScore, awardRandomCard, state.player.totalQuestsCompleted, state.player.score, state.activeQuests, state.user]);

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
        case 'packs_opened':
          currentValue = playerStats.totalPacksOpened;
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
        
        // Award score for achievement (replaces gems)
        addScore(10, `Achievement: ${achievement.name}`);
        
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
  }, [state.achievements, state.player, state.user, addScore]);

  // Add friend
  const addFriend = useCallback(async (friendId) => {
    if (!isSupabaseConfigured() || !state.user) {
      return { error: 'Not connected', friend: null };
    }

    // Check if already friends
    const existingFriend = state.friends.find(f => f.id === friendId);
    if (existingFriend) {
      return { error: 'already_friends', friend: existingFriend };
    }

    // Get friend profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .single();
    
    if (profileError || !profile) {
      return { error: 'User not found', friend: null };
    }

    // Create friendship
    const { error } = await supabase
      .from('friendships')
      .insert({ user_id: state.user.id, friend_id: friendId });
    
    if (error) {
      // Might be duplicate - check if already friends in DB
      if (error.code === '23505') {
        return { error: 'already_friends', friend: profile };
      }
      return { error: error.message, friend: null };
    }

    // Map profile to friend object with all social info
    const friendData = {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      score: profile.score || 0,
      team: profile.team,
      bio: profile.bio || '',
      linkedin_url: profile.linkedin_url || '',
    };

    dispatch({ type: ACTIONS.ADD_FRIEND, payload: friendData });
    checkAchievements({ friendsCount: state.player.friendsCount + 1 });
    
    return { error: null, friend: friendData };
  }, [state.user, state.player.friendsCount, state.friends, checkAchievements]);

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
        gem_reward: quest.gemReward * 2, // Double gems for challenges
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
  // Update player profile (bio, linkedin, etc.)
  const updateProfile = useCallback(async (updates) => {
    dispatch({ type: ACTIONS.UPDATE_PLAYER, payload: updates });
    
    if (isSupabaseConfigured() && state.user) {
      const dbUpdates = {};
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl;
      if (updates.leaderboardVisible !== undefined) dbUpdates.leaderboard_visible = updates.leaderboardVisible;
      
      await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', state.user.id);
    }
  }, [state.user]);

  const value = React.useMemo(() => ({
    ...state,
    
    // Auth Actions
    signIn,
    signUp,
    signOut,
    
    // Actions
    addScore,
    awardRandomCard,
    claimDailyReward,
    completeQuest,
    checkAchievements,
    addFriend,
    createChallenge,
    fetchLeaderboard,
    fetchChallenges,
    fetchUserQuests,
    fetchGameData,
    updateLocation,
    updateProfile,
    clearNewAchievement,
    removeToast,
    acknowledgeCard,
    
    // Utilities
    dispatch,
  }), [
    state,
    signIn,
    signUp,
    signOut,
    addScore,
    awardRandomCard,
    claimDailyReward,
    completeQuest,
    checkAchievements,
    addFriend,
    createChallenge,
    fetchLeaderboard,
    fetchChallenges,
    fetchUserQuests,
    fetchGameData,
    updateLocation,
    updateProfile,
    clearNewAchievement,
    removeToast,
    acknowledgeCard
  ]);

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
