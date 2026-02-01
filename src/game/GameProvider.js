// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Central Game State Provider
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getSession, onAuthStateChange } from '../config/supabase';
import { LEVEL_CONFIG, calculateFinalXP, DAILY_REWARDS } from './config/rewards';
import { ACHIEVEMENTS, getAllAchievements } from './config/achievements';
import { QUEST_TEMPLATES } from './config/quests';
import { CARDS, getCardById } from './config/cards';
import { PACK_TYPES, generatePackCards } from './config/packs';

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
    gems: 100, // Starting gems for new players
    loginStreak: 0,
    lastLoginDate: null,
    streakFreezeCount: 0,
    totalQuestsCompleted: 0,
    totalDistanceWalked: 0,
    friendsCount: 0,
    challengesWon: 0,
    challengeWinStreak: 0,
    rewardsRedeemed: 0,
    totalPacksOpened: 0,
    packsSinceLastLegendary: 0,
  },
  
  // Collection
  collection: [], // Array of owned card IDs (can have duplicates for count)
  uniqueCards: [], // Array of unique card IDs owned
  justUnlockedCard: null,
  
  // Pack Opening
  packOpeningResult: null, // { packType, cards: [] } - set when opening a pack
  ownedPacks: [], // Packs bought but not yet opened

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
  ADD_XP: 'ADD_XP',
  LEVEL_UP: 'LEVEL_UP',
  
  // Gems & Packs
  ADD_GEMS: 'ADD_GEMS',
  SPEND_GEMS: 'SPEND_GEMS',
  BUY_PACK: 'BUY_PACK',
  OPEN_PACK: 'OPEN_PACK',
  CLEAR_PACK_RESULT: 'CLEAR_PACK_RESULT',
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
      
    case ACTIONS.ADD_XP: {
      const newXP = state.player.xp + action.payload;
      const newLevel = LEVEL_CONFIG.getLevelFromXP(newXP);
      const leveledUp = newLevel > state.player.level;
      
      return {
        ...state,
        player: {
          ...state.player,
          xp: newXP,
          level: newLevel,
        },
        toasts: leveledUp 
          ? [...state.toasts, { id: Date.now(), type: 'level_up', level: newLevel }]
          : state.toasts,
      };
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // GEMS & PACKS
    // ─────────────────────────────────────────────────────────────────────────
    case ACTIONS.ADD_GEMS: {
      return {
        ...state,
        player: {
          ...state.player,
          gems: state.player.gems + action.payload,
        },
        toasts: [...state.toasts, { 
          id: Date.now(), 
          type: 'gems_earned', 
          amount: action.payload 
        }],
      };
    }
    
    case ACTIONS.SPEND_GEMS: {
      return {
        ...state,
        player: {
          ...state.player,
          gems: Math.max(0, state.player.gems - action.payload),
        },
      };
    }
    
    case ACTIONS.BUY_PACK: {
      const packType = PACK_TYPES[action.payload];
      if (!packType) return state;
      
      return {
        ...state,
        player: {
          ...state.player,
          gems: state.player.gems - packType.cost,
        },
        ownedPacks: [...state.ownedPacks, { 
          id: `pack_${Date.now()}`, 
          type: action.payload, 
          purchasedAt: new Date().toISOString() 
        }],
      };
    }
    
    case ACTIONS.OPEN_PACK: {
      const { packId, cards } = action.payload;
      const hasLegendary = cards.some(c => c.rarity.id === 'legendary');
      
      // Calculate new card IDs
      const newCardIds = cards.map(c => c.id);
      const updatedCollection = [...state.collection, ...newCardIds];
      const updatedUniqueCards = [...new Set(updatedCollection)];
      
      return {
        ...state,
        ownedPacks: state.ownedPacks.filter(p => p.id !== packId),
        collection: updatedCollection,
        uniqueCards: updatedUniqueCards,
        packOpeningResult: { packId, cards },
        player: {
          ...state.player,
          totalPacksOpened: state.player.totalPacksOpened + 1,
          packsSinceLastLegendary: hasLegendary ? 0 : state.player.packsSinceLastLegendary + 1,
        },
      };
    }
    
    case ACTIONS.CLEAR_PACK_RESULT: {
      return {
        ...state,
        packOpeningResult: null,
      };
    }
    
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
            gems: profile.gems || 100, // Default starting gems
            loginStreak: profile.login_streak || 0,
            lastLoginDate: profile.last_login_date,
            streakFreezeCount: profile.streak_freeze_count || 0,
            totalQuestsCompleted: profile.total_quests_completed || 0,
            totalDistanceWalked: profile.total_distance_walked || 0,
            totalPacksOpened: profile.total_packs_opened || 0,
            packsSinceLastLegendary: profile.packs_since_last_legendary || 0,
            admin: profile.admin || false, // Admin flag for quest creation
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
            xp: 0,
            level: 1,
            gems: 100,
            loginStreak: 0,
            lastLoginDate: null,
            streakFreezeCount: 0,
            totalQuestsCompleted: 0,
            totalDistanceWalked: 0,
            friendsCount: 0,
            challengesWon: 0,
            challengeWinStreak: 0,
            rewardsRedeemed: 0,
            totalPacksOpened: 0,
            packsSinceLastLegendary: 0,
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

  // ─────────────────────────────────────────────────────────────────────────
  // GEMS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  // Add gems to player
  const addGems = useCallback((amount, reason = '') => {
    dispatch({ type: ACTIONS.ADD_GEMS, payload: amount });
    
    // Sync to Supabase
    if (isSupabaseConfigured() && state.user) {
      supabase
        .from('profiles')
        .update({ gems: state.player.gems + amount })
        .eq('id', state.user.id);
    }
    
    return amount;
  }, [state.player.gems, state.user]);
  
  // Spend gems (returns true if successful, false if not enough)
  const spendGems = useCallback((amount) => {
    if (state.player.gems < amount) {
      return false;
    }
    
    dispatch({ type: ACTIONS.SPEND_GEMS, payload: amount });
    
    // Sync to Supabase
    if (isSupabaseConfigured() && state.user) {
      supabase
        .from('profiles')
        .update({ gems: state.player.gems - amount })
        .eq('id', state.user.id);
    }
    
    return true;
  }, [state.player.gems, state.user]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // PACK MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  // Buy a pack (returns pack or null if failed)
  const buyPack = useCallback((packTypeKey) => {
    const packType = PACK_TYPES[packTypeKey];
    if (!packType) {
      console.error('Invalid pack type:', packTypeKey);
      return null;
    }
    
    if (state.player.gems < packType.cost) {
      return { error: 'Nicht genug Gems!' };
    }
    
    dispatch({ type: ACTIONS.BUY_PACK, payload: packTypeKey });
    
    // Return the pack info
    const newPack = {
      id: `pack_${Date.now()}`,
      type: packTypeKey,
      packType: packType,
    };
    
    // Sync to Supabase
    if (isSupabaseConfigured() && state.user) {
      supabase
        .from('profiles')
        .update({ gems: state.player.gems - packType.cost })
        .eq('id', state.user.id);
    }
    
    return newPack;
  }, [state.player.gems, state.user]);
  
  // Open a pack and get cards
  const openPack = useCallback((packTypeKey) => {
    const packType = PACK_TYPES[packTypeKey];
    if (!packType) {
      console.error('Invalid pack type for opening:', packTypeKey);
      return null;
    }
    
    // Generate cards for the pack
    const cards = generatePackCards(packTypeKey, CARDS);
    
    // Dispatch the open pack action
    dispatch({
      type: ACTIONS.OPEN_PACK,
      payload: {
        packId: `opened_${Date.now()}`,
        cards: cards,
      },
    });
    
    // Sync collection to Supabase
    if (isSupabaseConfigured() && state.user) {
      const newCardIds = cards.map(c => c.id);
      const updatedCollection = [...state.collection, ...newCardIds];
      
      supabase
        .from('profiles')
        .update({ 
          card_collection: updatedCollection,
          total_packs_opened: state.player.totalPacksOpened + 1,
        })
        .eq('id', state.user.id);
    }
    
    return cards;
  }, [state.collection, state.player.totalPacksOpened, state.user]);
  
  // Clear pack opening result (after animation is done)
  const clearPackResult = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_PACK_RESULT });
  }, []);

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
    const gemReward = reward.gems || Math.floor(reward.xp / 2); // Gems from daily reward
    
    const rewardData = {
      ...reward,
      xpReward,
      gemReward,
      newStreak,
      streakDay: streakDay + 1,
    };
    
    dispatch({ type: ACTIONS.CLAIM_DAILY_REWARD, payload: rewardData });
    dispatch({ type: ACTIONS.ADD_XP, payload: xpReward });
    dispatch({ type: ACTIONS.ADD_GEMS, payload: gemReward });
    
    // Check streak achievements
    checkAchievements({ loginStreak: newStreak });
    
    // Sync to Supabase
    if (isSupabaseConfigured() && state.user) {
      supabase.rpc('update_streak', { p_user_id: state.user.id });
    }
    
    return rewardData;
  }, [state.hasClaimedDailyReward, state.player, state.user]);

  // Complete a quest
  const completeQuest = useCallback(async (questId, xpReward, gemReward = 0) => {
    const quest = state.activeQuests.find(q => q.id === questId);
    
    // Calculate gem reward if not provided
    const finalGemReward = gemReward || quest?.gemReward || Math.floor(xpReward / 2);
    
    // Update local state first (optimistic)
    dispatch({ type: ACTIONS.COMPLETE_QUEST, payload: questId });
    
    const finalXP = addXP(xpReward, 'Quest completed');
    addGems(finalGemReward, 'Quest completed');
    
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
            xp: state.player.xp + finalXP,
            gems: state.player.gems + finalGemReward,
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
        xp: finalXP,
        gems: finalGemReward,
        timestamp: new Date().toISOString(),
      }});
    }
    
    return { xp: finalXP, gems: finalGemReward };
  }, [addXP, addGems, state.player.totalQuestsCompleted, state.player.xp, state.player.gems, state.activeQuests, state.user]);

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
        
        // Award gems for achievement
        if (achievement.gems) {
          addGems(achievement.gems, `Achievement: ${achievement.name}`);
        }
        
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
  }, [state.achievements, state.player, state.user, addGems]);

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
  const value = React.useMemo(() => ({
    ...state,
    
    // Auth Actions
    signIn,
    signUp,
    signOut,
    
    // Actions
    addXP,
    addGems,
    spendGems,
    buyPack,
    openPack,
    clearPackResult,
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
    addXP,
    addGems,
    spendGems,
    buyPack,
    openPack,
    clearPackResult,
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
