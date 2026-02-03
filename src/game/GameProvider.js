// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Central Game State Provider
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getSession, onAuthStateChange } from '../config/supabase';
import { DAILY_REWARDS } from './config/rewards';
import { ACHIEVEMENTS, getAllAchievements } from './config/achievements';
import { QUEST_TEMPLATES } from './config/quests';
import { CARDS, getCardById } from './config/cards';
import {
  initializeQuestlineProgress,
  completeQuestlineQuest as completeQuestlineQuestDB,
  fetchAllQuestlineProgress,
  getQuestChallengeInfo,
} from './config/challenges';
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
    admin: false, // Admin flag from profiles table
    // Social Features
    bio: '',
    linkedinUrl: '',
    leaderboardVisible: false,
    // Team System
    team: null, // blue, yellow, green, or purple
  },
  
  // Collection (cards earned through quests and challenges)
  collection: [], // Array of owned card IDs (can have duplicates for count)
  uniqueCards: [], // Array of unique card IDs owned
  collectedCardIds: [], // Array of card IDs from claimed challenges
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
  eventChallenges: [], // Event challenges from database
  userEventChallenges: [], // User's progress on event challenges
  questlineProgress: {}, // User's progress on questline challenges { challengeId: { completed, total, quests } }
  
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
  SET_EVENT_CHALLENGES: 'SET_EVENT_CHALLENGES',
  SET_USER_EVENT_CHALLENGES: 'SET_USER_EVENT_CHALLENGES',
  UPDATE_USER_EVENT_CHALLENGE: 'UPDATE_USER_EVENT_CHALLENGE',
  SET_COLLECTED_CARDS: 'SET_COLLECTED_CARDS',
  ADD_COLLECTED_CARD: 'ADD_COLLECTED_CARD',
  REMOVE_COLLECTED_CARD: 'REMOVE_COLLECTED_CARD',
  REMOVE_USER_EVENT_CHALLENGE: 'REMOVE_USER_EVENT_CHALLENGE',
  
  // Questline challenges
  SET_QUESTLINE_PROGRESS: 'SET_QUESTLINE_PROGRESS',
  UPDATE_QUESTLINE_QUEST: 'UPDATE_QUESTLINE_QUEST',
  SET_SINGLE_QUESTLINE_PROGRESS: 'SET_SINGLE_QUESTLINE_PROGRESS',
  
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
    
    case ACTIONS.SET_EVENT_CHALLENGES:
      return {
        ...state,
        eventChallenges: action.payload || state.eventChallenges,
      };
    
    case ACTIONS.SET_USER_EVENT_CHALLENGES:
      return {
        ...state,
        userEventChallenges: action.payload || state.userEventChallenges,
      };
    
    case ACTIONS.UPDATE_USER_EVENT_CHALLENGE:
      return {
        ...state,
        userEventChallenges: state.userEventChallenges.map(uc =>
          uc.challenge_id === action.payload.challenge_id 
            ? { ...uc, ...action.payload } 
            : uc
        ),
      };
    
    case ACTIONS.SET_COLLECTED_CARDS:
      return {
        ...state,
        collectedCardIds: action.payload || [],
      };
    
    case ACTIONS.ADD_COLLECTED_CARD:
      return {
        ...state,
        collectedCardIds: [...new Set([...state.collectedCardIds, action.payload])],
      };
    
    case ACTIONS.REMOVE_COLLECTED_CARD:
      return {
        ...state,
        collectedCardIds: state.collectedCardIds.filter(id => id !== action.payload),
      };
    
    case ACTIONS.REMOVE_USER_EVENT_CHALLENGE:
      return {
        ...state,
        userEventChallenges: state.userEventChallenges.filter(
          uc => !(uc.challenge_id === action.payload.challengeId && uc.user_id === action.payload.userId)
        ),
      };
    
    // ─────────────────────────────────────────────────────────────────────────
    // QUESTLINE CHALLENGES
    // ─────────────────────────────────────────────────────────────────────────
    case ACTIONS.SET_QUESTLINE_PROGRESS:
      return {
        ...state,
        questlineProgress: action.payload || {},
      };
    
    case ACTIONS.SET_SINGLE_QUESTLINE_PROGRESS:
      return {
        ...state,
        questlineProgress: {
          ...state.questlineProgress,
          [action.payload.challengeId]: action.payload.progress,
        },
      };
    
    case ACTIONS.UPDATE_QUESTLINE_QUEST: {
      const { challengeId, questId, status, completedAt } = action.payload;
      const currentProgress = state.questlineProgress[challengeId] || { completed: 0, total: 0, quests: [] };
      
      const updatedQuests = currentProgress.quests.map(q => 
        q.quest_id === questId ? { ...q, status, completed_at: completedAt } : q
      );
      
      const completedCount = updatedQuests.filter(q => q.status === 'completed').length;
      
      return {
        ...state,
        questlineProgress: {
          ...state.questlineProgress,
          [challengeId]: {
            ...currentProgress,
            quests: updatedQuests,
            completed: completedCount,
            isComplete: completedCount >= currentProgress.total,
          },
        },
      };
    }
      
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
      
      // console.log('Game data loaded:', normalizedQuests.length, 'quests', Object.keys(locationsMap).length, 'locations');
      return { quests: normalizedQuests, locations: locationsMap };
    } catch (error) {
      console.error('Failed to fetch game data:', error);
      return { quests: [], locations: {} };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH FRIENDS FROM SUPABASE
  // ─────────────────────────────────────────────────────────────────────────
  const fetchFriends = useCallback(async (userId) => {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      // console.log('[GameProvider] Fetching friends for user:', userId);

      // Get all friendships where user is either user_id or friend_id
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('[GameProvider] Error fetching friendships:', error);
        return;
      }

      // Also get pending requests where current user initiated (auto-accept for now)
      const { data: pendingFriendships } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      // Combine all friendships
      const allFriendships = [...(friendships || []), ...(pendingFriendships || [])];

      if (!allFriendships || allFriendships.length === 0) {
        // console.log('[GameProvider] No friends found');
        dispatch({ type: ACTIONS.SET_FRIENDS, payload: { friends: [], requests: [] } });
        return;
      }

      // Get friend IDs (the other person in each friendship)
      const friendIds = allFriendships.map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      // Fetch friend profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profileError) {
        console.error('[GameProvider] Error fetching friend profiles:', profileError);
        return;
      }

      // Map profiles to friend objects with all social info
      const friends = (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        score: profile.score || 0,
        team: profile.team,
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
      }));

      // console.log('[GameProvider] Friends loaded:', friends.length);
      dispatch({ type: ACTIONS.SET_FRIENDS, payload: { friends, requests: [] } });
    } catch (error) {
      console.error('[GameProvider] Failed to fetch friends:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH EVENT CHALLENGES FROM DATABASE
  // ─────────────────────────────────────────────────────────────────────────
  const fetchEventChallenges = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const { data, error } = await supabase
        .from('event_challenges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching event challenges:', error);
        return;
      }
      
      dispatch({ 
        type: ACTIONS.SET_EVENT_CHALLENGES, 
        payload: data || [] 
      });
    } catch (error) {
      console.error('Failed to fetch event challenges:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH USER EVENT CHALLENGE PROGRESS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchUserEventChallenges = useCallback(async () => {
    if (!isSupabaseConfigured() || !state.user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_event_challenges')
        .select('*')
        .eq('user_id', state.user.id);
      
      if (error) {
        console.error('Error fetching user event challenges:', error);
        return;
      }
      
      dispatch({ 
        type: ACTIONS.SET_USER_EVENT_CHALLENGES, 
        payload: data || [] 
      });
      
      // Derive collected card IDs from claimed challenges
      if (data && state.eventChallenges.length > 0) {
        const claimedCardIds = data
          .filter(uc => uc.status === 'claimed')
          .map(uc => {
            const challenge = state.eventChallenges.find(ec => ec.id === uc.challenge_id);
            return challenge?.reward?.cardId;
          })
          .filter(Boolean);
        
        dispatch({ 
          type: ACTIONS.SET_COLLECTED_CARDS, 
          payload: claimedCardIds 
        });
      }
    } catch (error) {
      console.error('Failed to fetch user event challenges:', error);
    }
  }, [state.user, state.eventChallenges]);

  // ─────────────────────────────────────────────────────────────────────────
  // SCORE SYSTEM (ersetzt XP und Gems)
  // ─────────────────────────────────────────────────────────────────────────
  
  // Add score points
  const addScore = useCallback(async (amount, reason = '') => {
    const newScore = (state.player.score || 0) + amount;
    dispatch({ type: ACTIONS.UPDATE_PLAYER, payload: { score: newScore } });
    
    // Sync to Supabase if online
    if (isSupabaseConfigured() && state.user) {
      const { error } = await supabase
        .from('profiles')
        .update({ score: newScore })
        .eq('id', state.user.id);
      
      if (error) {
        console.error('[addScore] Failed to sync score to database:', error);
      }
    }
    
    return amount;
  }, [state.player.score, state.user]);

  // ─────────────────────────────────────────────────────────────────────────
  // CLAIM EVENT CHALLENGE
  // ─────────────────────────────────────────────────────────────────────────
  const claimEventChallenge = useCallback(async (challengeId, xpReward = 0, challenge = null) => {
    if (!isSupabaseConfigured() || !state.user) {
      return { error: 'Not connected' };
    }
    
    try {
      // Find the challenge if not provided
      if (!challenge) {
        challenge = state.eventChallenges.find(c => c.id === challengeId);
      }
      
      // Check if challenge progress exists
      const { data: existing } = await supabase
        .from('user_event_challenges')
        .select('*')
        .eq('user_id', state.user.id)
        .eq('challenge_id', challengeId)
        .single();
      
      const now = new Date().toISOString();
      
      if (existing) {
        // Update existing record to claimed
        const { data, error } = await supabase
          .from('user_event_challenges')
          .update({
            status: 'claimed',
            claimed_at: now,
            completed_at: existing.completed_at || now,
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error claiming challenge:', error);
          return { error };
        }
        
        dispatch({ 
          type: ACTIONS.UPDATE_USER_EVENT_CHALLENGE, 
          payload: data 
        });
      } else {
        // Insert new record as claimed
        const { data, error } = await supabase
          .from('user_event_challenges')
          .insert({
            user_id: state.user.id,
            challenge_id: challengeId,
            status: 'claimed',
            completed_at: now,
            claimed_at: now,
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error claiming challenge:', error);
          return { error };
        }
        
        dispatch({ 
          type: ACTIONS.SET_USER_EVENT_CHALLENGES, 
          payload: [...state.userEventChallenges, data] 
        });
      }
      
      // Award XP if provided
      if (xpReward > 0) {
        await addScore(xpReward);
      }
      
      // Add card to collection if challenge has a card reward
      if (challenge?.reward?.cardId) {
        dispatch({ 
          type: ACTIONS.ADD_COLLECTED_CARD, 
          payload: challenge.reward.cardId 
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to claim challenge:', error);
      return { error };
    }
  }, [state.user, state.userEventChallenges, state.eventChallenges, addScore]);

  // ─────────────────────────────────────────────────────────────────────────
  // QUESTLINE CHALLENGE FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  // Fetch all questline progress for the current user
  const fetchQuestlineProgress = useCallback(async () => {
    if (!isSupabaseConfigured() || !state.user) return;
    
    try {
      const result = await fetchAllQuestlineProgress(state.user.id);
      
      if (result.success) {
        dispatch({
          type: ACTIONS.SET_QUESTLINE_PROGRESS,
          payload: result.progress,
        });
      } else {
        console.error('Error fetching questline progress:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch questline progress:', error);
    }
  }, [state.user]);
  
  // Start a questline challenge (initialize progress)
  const startQuestlineChallenge = useCallback(async (challengeId) => {
    if (!isSupabaseConfigured() || !state.user) {
      return { error: 'Not connected' };
    }
    
    try {
      const result = await initializeQuestlineProgress(state.user.id, challengeId);
      
      if (result.success) {
        // Refresh questline progress
        await fetchQuestlineProgress();
        
        // Also update user event challenge status
        const { data: existing } = await supabase
          .from('user_event_challenges')
          .select('*')
          .eq('user_id', state.user.id)
          .eq('challenge_id', challengeId)
          .single();
        
        if (!existing) {
          // Create user event challenge record
          await supabase
            .from('user_event_challenges')
            .insert({
              user_id: state.user.id,
              challenge_id: challengeId,
              status: 'in_progress',
            });
        }
        
        return { success: true, progress: result.progress };
      } else {
        return { error: result.error };
      }
    } catch (error) {
      console.error('Failed to start questline challenge:', error);
      return { error: error.message };
    }
  }, [state.user, fetchQuestlineProgress]);
  
  // Complete a quest within a questline challenge
  const completeQuestlineQuestAction = useCallback(async (challengeId, questId) => {
    if (!isSupabaseConfigured() || !state.user) {
      return { error: 'Not connected' };
    }
    
    try {
      const result = await completeQuestlineQuestDB(state.user.id, challengeId, questId);
      
      if (result.success) {
        // Update local state
        dispatch({
          type: ACTIONS.UPDATE_QUESTLINE_QUEST,
          payload: {
            challengeId,
            questId,
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        });
        
        // If challenge is complete, update the event challenge status
        if (result.isChallengeComplete) {
          const now = new Date().toISOString();
          
          // Update user event challenge to completed
          await supabase
            .from('user_event_challenges')
            .upsert({
              user_id: state.user.id,
              challenge_id: challengeId,
              status: 'completed',
              progress: result.completedQuests,
              completed_at: now,
            }, {
              onConflict: 'user_id,challenge_id',
            });
          
          // Refresh user event challenges
          await fetchUserEventChallenges();
        }
        
        // Refresh questline progress
        await fetchQuestlineProgress();
        
        return {
          success: true,
          nextQuestId: result.nextQuestId,
          isChallengeComplete: result.isChallengeComplete,
          totalQuests: result.totalQuests,
          completedQuests: result.completedQuests,
        };
      } else {
        return { error: result.error };
      }
    } catch (error) {
      console.error('Failed to complete questline quest:', error);
      return { error: error.message };
    }
  }, [state.user, fetchQuestlineProgress, fetchUserEventChallenges]);
  
  // Check if a quest belongs to a questline and handle completion
  const handleQuestCompletionForQuestline = useCallback(async (questId) => {
    console.log('[handleQuestCompletionForQuestline] Checking quest:', questId);
    if (!isSupabaseConfigured() || !state.user) {
      console.log('[handleQuestCompletionForQuestline] Not configured or no user');
      return null;
    }
    
    try {
      const info = await getQuestChallengeInfo(questId);
      console.log('[handleQuestCompletionForQuestline] Quest challenge info:', info);
      
      if (info.success && info.isInQuestline) {
        // Find questline challenges this quest belongs to
        const questlineChallenges = info.challenges.filter(
          c => c.event_challenges?.challenge_mode === 'questline'
        );
        console.log('[handleQuestCompletionForQuestline] Found questline challenges:', questlineChallenges.length);
        
        // Complete the quest in each questline it belongs to
        const results = [];
        for (const challenge of questlineChallenges) {
          console.log('[handleQuestCompletionForQuestline] Completing quest in challenge:', challenge.challenge_id);
          const result = await completeQuestlineQuestAction(challenge.challenge_id, questId);
          console.log('[handleQuestCompletionForQuestline] Result:', result);
          results.push({ challengeId: challenge.challenge_id, ...result });
        }
        
        return results;
      } else {
        console.log('[handleQuestCompletionForQuestline] Quest not in questline');
      }
      
      return null;
    } catch (error) {
      console.error('Error checking quest for questline:', error);
      return null;
    }
  }, [state.user, completeQuestlineQuestAction]);

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: COMPLETE CHALLENGE FOR ANY USER
  // ─────────────────────────────────────────────────────────────────────────
  const adminCompleteChallenge = useCallback(async (targetUserId, challengeId) => {
    if (!isSupabaseConfigured() || !state.player?.admin) {
      return { error: 'Not authorized' };
    }
    
    try {
      // Find the challenge
      const challenge = state.eventChallenges.find(c => c.id === challengeId);
      if (!challenge) {
        return { error: 'Challenge not found' };
      }
      
      const now = new Date().toISOString();
      // Check all possible XP field names (database uses xp_reward, config uses scoreReward/xpReward)
      const xpReward = challenge.xp_reward || challenge.scoreReward || challenge.xpReward || 0;
      
      // Check if record already exists
      const { data: existing } = await supabase
        .from('user_event_challenges')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('challenge_id', challengeId)
        .single();
      
      if (existing && existing.status === 'claimed') {
        return { error: 'Already claimed' };
      }
      
      if (existing) {
        // Update existing record to claimed
        const { error } = await supabase
          .from('user_event_challenges')
          .update({
            status: 'claimed',
            claimed_at: now,
            completed_at: existing.completed_at || now,
          })
          .eq('id', existing.id);
        
        if (error) {
          console.error('Error admin completing challenge:', error);
          return { error };
        }
      } else {
        // Insert new record as claimed
        const { error } = await supabase
          .from('user_event_challenges')
          .insert({
            user_id: targetUserId,
            challenge_id: challengeId,
            status: 'claimed',
            completed_at: now,
            claimed_at: now,
          });
        
        if (error) {
          console.error('Error admin completing challenge:', error);
          return { error };
        }
      }
      
      // Award XP to the target user (update their profile score directly)
      if (xpReward > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('score')
          .eq('id', targetUserId)
          .single();
        
        const newScore = (profile?.score || 0) + xpReward;
        
        await supabase
          .from('profiles')
          .update({ score: newScore })
          .eq('id', targetUserId);
      }
      
      // If this is for the current user, update local state
      if (targetUserId === state.user?.id) {
        // Refresh user event challenges
        await fetchUserEventChallenges();
        
        // Add card to collection if challenge has a card reward
        if (challenge?.reward?.cardId) {
          dispatch({ 
            type: ACTIONS.ADD_COLLECTED_CARD, 
            payload: challenge.reward.cardId 
          });
        }
        
        // Update local score
        if (xpReward > 0) {
          dispatch({
            type: ACTIONS.SET_PLAYER,
            payload: { ...state.player, score: (state.player.score || 0) + xpReward }
          });
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to admin complete challenge:', error);
      return { error };
    }
  }, [state.player, state.user, state.eventChallenges, fetchUserEventChallenges]);

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: UNCOMPLETE CHALLENGE FOR ANY USER
  // ─────────────────────────────────────────────────────────────────────────
  const adminUncompleteChallenge = useCallback(async (targetUserId, challengeId) => {
    console.log('[adminUncompleteChallenge] Called with:', { targetUserId, challengeId });
    console.log('[adminUncompleteChallenge] Admin status:', state.player?.admin);
    console.log('[adminUncompleteChallenge] Supabase configured:', isSupabaseConfigured());
    
    if (!isSupabaseConfigured() || !state.player?.admin) {
      console.log('[adminUncompleteChallenge] Not authorized');
      return { error: 'Not authorized' };
    }
    
    try {
      // Find the challenge
      console.log('[adminUncompleteChallenge] Looking for challenge in:', state.eventChallenges.length, 'challenges');
      const challenge = state.eventChallenges.find(c => c.id === challengeId);
      console.log('[adminUncompleteChallenge] Found challenge:', challenge ? challenge.title : 'NOT FOUND');
      if (!challenge) {
        return { error: 'Challenge not found' };
      }
      
      // Check all possible XP field names (database uses xp_reward, config uses scoreReward/xpReward)
      const xpReward = challenge.xp_reward || challenge.scoreReward || challenge.xpReward || 0;
      console.log('[adminUncompleteChallenge] XP to deduct:', xpReward, '(from xp_reward:', challenge.xp_reward, 'scoreReward:', challenge.scoreReward, 'xpReward:', challenge.xpReward, ')');
      
      // Check if record exists
      console.log('[adminUncompleteChallenge] Checking for existing record...');
      const { data: existing, error: fetchError } = await supabase
        .from('user_event_challenges')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('challenge_id', challengeId)
        .single();
      
      console.log('[adminUncompleteChallenge] Existing record:', existing, 'Error:', fetchError);
      
      if (!existing) {
        return { error: 'No record to uncomplete' };
      }
      
      // Delete the user_event_challenges record
      console.log('[adminUncompleteChallenge] Deleting record with id:', existing.id);
      const { data: deleteData, error: deleteError, count } = await supabase
        .from('user_event_challenges')
        .delete()
        .eq('user_id', targetUserId)
        .eq('challenge_id', challengeId)
        .select();
      
      console.log('[adminUncompleteChallenge] Delete result - data:', deleteData, 'error:', deleteError, 'count:', count);
      
      // Verify deletion by checking if record still exists
      const { data: verifyData } = await supabase
        .from('user_event_challenges')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('challenge_id', challengeId)
        .single();
      
      console.log('[adminUncompleteChallenge] Verification - record still exists:', verifyData ? 'YES' : 'NO', verifyData);
      
      if (deleteError) {
        console.error('Error admin uncompleting challenge:', deleteError);
        return { error: deleteError };
      }
      
      if (verifyData) {
        console.error('[adminUncompleteChallenge] DELETE FAILED - record still exists!');
        return { error: 'Delete appeared to succeed but record still exists. Check RLS policies.' };
      }
      
      // If this was claimed, also delete questline progress if applicable
      if (challenge.challenge_mode === 'questline') {
        await supabase
          .from('user_challenge_quest_progress')
          .delete()
          .eq('user_id', targetUserId)
          .eq('challenge_id', challengeId);
      }
      
      // Remove XP from the target user (update their profile score directly)
      if (xpReward > 0 && existing.status === 'claimed') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('score')
          .eq('id', targetUserId)
          .single();
        
        const newScore = Math.max(0, (profile?.score || 0) - xpReward);
        console.log('[adminUncompleteChallenge] Updating score from', profile?.score, 'to', newScore);
        
        const { error: scoreError } = await supabase
          .from('profiles')
          .update({ score: newScore })
          .eq('id', targetUserId);
        
        if (scoreError) {
          console.error('[adminUncompleteChallenge] Failed to update score:', scoreError);
        }
      }
      
      // If this is for the current user, update local state
      if (targetUserId === state.user?.id) {
        // Remove from local state
        dispatch({
          type: ACTIONS.REMOVE_USER_EVENT_CHALLENGE,
          payload: { userId: targetUserId, challengeId }
        });
        
        // Remove card from collection if challenge has a card reward and was claimed
        if (challenge?.reward?.cardId && existing.status === 'claimed') {
          dispatch({ 
            type: ACTIONS.REMOVE_COLLECTED_CARD, 
            payload: challenge.reward.cardId 
          });
        }
        
        // Update local score
        if (xpReward > 0 && existing.status === 'claimed') {
          dispatch({
            type: ACTIONS.SET_PLAYER,
            payload: { ...state.player, score: Math.max(0, (state.player.score || 0) - xpReward) }
          });
        }
        
        // Refresh questline progress if applicable
        if (challenge.challenge_mode === 'questline') {
          await fetchQuestlineProgress();
        }
      }
      
      console.log('[adminUncompleteChallenge] Completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to admin uncomplete challenge:', error);
      return { error };
    }
  }, [state.player, state.user, state.eventChallenges, fetchQuestlineProgress]);

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: COMPLETE QUEST FOR ANY USER
  // ─────────────────────────────────────────────────────────────────────────
  const adminCompleteQuest = useCallback(async (targetUserId, userQuestId) => {
    console.log('[adminCompleteQuest] Called with:', { targetUserId, userQuestId });
    console.log('[adminCompleteQuest] Admin status:', state.player?.admin);
    console.log('[adminCompleteQuest] Active quests:', state.activeQuests.map(q => ({ id: q.id, title: q.title })));
    
    if (!isSupabaseConfigured() || !state.player?.admin) {
      console.log('[adminCompleteQuest] Not authorized');
      return { error: 'Not authorized' };
    }
    
    try {
      // Find the quest in active quests
      const userQuest = state.activeQuests.find(q => q.id === userQuestId);
      console.log('[adminCompleteQuest] Found quest:', userQuest ? userQuest.title : 'NOT FOUND');
      
      if (!userQuest) {
        console.log('[adminCompleteQuest] Quest IDs in state:', state.activeQuests.map(q => q.id));
        console.log('[adminCompleteQuest] Looking for ID:', userQuestId, 'type:', typeof userQuestId);
        return { error: 'Quest not found in active quests' };
      }
      
      const xpReward = userQuest.xpReward || userQuest.xp_reward || 0;
      const now = new Date().toISOString();
      
      // Get the actual quest_id (the reference to quests table)
      const actualQuestId = userQuest.questId || userQuest.quest_id || userQuestId;
      
      console.log('[adminCompleteQuest] Updating database with:', {
        user_id: targetUserId,
        quest_id: actualQuestId,
        status: 'completed',
        progress: userQuest.target || 1
      });
      
      // Update user_quests to completed status
      // Use user_id + quest_id for reliable matching (handles ID mismatch bug)
      const { data: updateData, error: updateError } = await supabase
        .from('user_quests')
        .update({
          status: 'completed',
          progress: userQuest.target || 1,
          completed_at: now,
        })
        .eq('user_id', targetUserId)
        .eq('quest_id', actualQuestId)
        .select();
      
      console.log('[adminCompleteQuest] Update result:', { updateData, updateError });
      
      if (updateError) {
        console.error('[adminCompleteQuest] Error updating quest:', updateError);
        return { error: updateError };
      }
      
      // Award XP to the user
      if (xpReward > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('score')
          .eq('id', targetUserId)
          .single();
        
        const newScore = (profile?.score || 0) + xpReward;
        console.log('[adminCompleteQuest] Updating score from', profile?.score, 'to', newScore);
        
        await supabase
          .from('profiles')
          .update({ score: newScore })
          .eq('id', targetUserId);
      }
      
      // If this is for the current user, update local state
      if (targetUserId === state.user?.id) {
        console.log('[adminCompleteQuest] Updating local state');
        // Move quest from active to completed
        dispatch({
          type: ACTIONS.COMPLETE_QUEST,
          payload: userQuestId
        });
        
        // Update local score
        if (xpReward > 0) {
          dispatch({
            type: ACTIONS.SET_PLAYER,
            payload: { ...state.player, score: (state.player.score || 0) + xpReward }
          });
        }
      }
      
      console.log('[adminCompleteQuest] Success!');
      return { success: true, xpAwarded: xpReward };
    } catch (error) {
      console.error('[adminCompleteQuest] Failed:', error);
      return { error };
    }
  }, [state.player, state.user, state.activeQuests]);

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: UNCOMPLETE QUEST FOR ANY USER (revert to active)
  // ─────────────────────────────────────────────────────────────────────────
  const adminUncompleteQuest = useCallback(async (targetUserId, userQuestId) => {
    console.log('[adminUncompleteQuest] Called with:', { targetUserId, userQuestId });
    
    if (!isSupabaseConfigured() || !state.player?.admin) {
      return { error: 'Not authorized' };
    }
    
    try {
      // Find the quest in completed quests
      const completedQuest = state.completedQuests.find(q => q.id === userQuestId);
      console.log('[adminUncompleteQuest] Found quest:', completedQuest ? completedQuest.title : 'NOT FOUND');
      
      if (!completedQuest) {
        return { error: 'Quest not found in completed quests' };
      }
      
      const xpReward = completedQuest.xpReward || completedQuest.xp_reward || 0;
      const actualQuestId = completedQuest.questId || completedQuest.quest_id || userQuestId;
      
      console.log('[adminUncompleteQuest] Updating with user_id:', targetUserId, 'quest_id:', actualQuestId);
      
      // Update user_quests back to active status
      // Use user_id + quest_id for reliable matching
      const { data: updateData, error: updateError } = await supabase
        .from('user_quests')
        .update({
          status: 'active',
          progress: 0,
          completed_at: null,
        })
        .eq('user_id', targetUserId)
        .eq('quest_id', actualQuestId)
        .select();
      
      console.log('[adminUncompleteQuest] Update result:', { updateData, updateError });
      
      if (updateError) {
        console.error('Error admin uncompleting quest:', updateError);
        return { error: updateError };
      }
      
      // Deduct XP from the user
      if (xpReward > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('score')
          .eq('id', targetUserId)
          .single();
        
        const newScore = Math.max(0, (profile?.score || 0) - xpReward);
        
        await supabase
          .from('profiles')
          .update({ score: newScore })
          .eq('id', targetUserId);
      }
      
      // If this is for the current user, update local state
      if (targetUserId === state.user?.id) {
        // Move quest from completed back to active
        const reactivatedQuest = {
          ...completedQuest,
          status: 'active',
          progress: 0,
          completedAt: null,
        };
        
        dispatch({
          type: ACTIONS.SET_QUESTS,
          payload: {
            active: [...state.activeQuests, reactivatedQuest],
            completed: state.completedQuests.filter(q => q.id !== userQuestId)
          }
        });
        
        // Update local score
        if (xpReward > 0) {
          dispatch({
            type: ACTIONS.SET_PLAYER,
            payload: { ...state.player, score: Math.max(0, (state.player.score || 0) - xpReward) }
          });
        }
      }
      
      return { success: true, xpDeducted: xpReward };
    } catch (error) {
      console.error('Failed to admin uncomplete quest:', error);
      return { error };
    }
  }, [state.player, state.user, state.activeQuests, state.completedQuests]);

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: RESET QUEST (delete from user_quests, making it available again)
  // ─────────────────────────────────────────────────────────────────────────
  const adminResetQuest = useCallback(async (targetUserId, userQuestId, questStatus = 'active') => {
    console.log('[adminResetQuest] Called with:', { targetUserId, userQuestId, questStatus });
    
    if (!isSupabaseConfigured() || !state.player?.admin) {
      return { error: 'Not authorized' };
    }
    
    try {
      // Find the quest in either active or completed quests
      const quest = questStatus === 'completed' 
        ? state.completedQuests.find(q => q.id === userQuestId)
        : state.activeQuests.find(q => q.id === userQuestId);
      
      console.log('[adminResetQuest] Found quest:', quest ? quest.title : 'NOT FOUND');
      console.log('[adminResetQuest] Quest object:', quest);
      console.log('[adminResetQuest] Quest IDs - id:', quest?.id, 'questId:', quest?.questId);
      
      if (!quest) {
        return { error: 'Quest not found' };
      }
      
      const xpReward = quest.xpReward || quest.xp_reward || 0;
      const wasCompleted = questStatus === 'completed' || quest.status === 'completed';
      
      // quest.id from state should be the user_quests row id (primary key)
      console.log('[adminResetQuest] Attempting to delete user_quest row with id:', userQuestId);
      console.log('[adminResetQuest] Query: DELETE FROM user_quests WHERE id =', userQuestId);
      
      // Delete the user_quest entry by primary key (user_quests.id)
      const { data: deleteData, error: deleteError } = await supabase
        .from('user_quests')
        .delete()
        .eq('id', userQuestId)
        .select();
      
      console.log('[adminResetQuest] Delete result:', { deleteData, deleteError });
      
      if (deleteError) {
        console.error('Error admin resetting quest:', deleteError);
        return { error: deleteError };
      }
      
      // Check if any rows were actually deleted (RLS might silently block)
      if (!deleteData || deleteData.length === 0) {
        console.error('[adminResetQuest] DELETE returned 0 rows - RLS policy likely blocking. Apply admin delete policy to user_quests table!');
        return { error: 'Delete failed - no rows affected. Check RLS policies in Supabase.' };
      }
      
      // If quest was completed, deduct XP
      if (wasCompleted && xpReward > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('score')
          .eq('id', targetUserId)
          .single();
        
        const newScore = Math.max(0, (profile?.score || 0) - xpReward);
        console.log('[adminResetQuest] Deducting XP, new score:', newScore);
        
        await supabase
          .from('profiles')
          .update({ score: newScore })
          .eq('id', targetUserId);
      }
      
      // If this is for the current user, update local state
      if (targetUserId === state.user?.id) {
        // Remove from both active and completed lists
        dispatch({
          type: ACTIONS.SET_QUESTS,
          payload: {
            active: state.activeQuests.filter(q => q.id !== userQuestId),
            completed: state.completedQuests.filter(q => q.id !== userQuestId)
          }
        });
        
        // Update local score if was completed
        if (wasCompleted && xpReward > 0) {
          dispatch({
            type: ACTIONS.SET_PLAYER,
            payload: { ...state.player, score: Math.max(0, (state.player.score || 0) - xpReward) }
          });
        }
      }
      
      console.log('[adminResetQuest] Success!');
      return { success: true, xpDeducted: wasCompleted ? xpReward : 0 };
    } catch (error) {
      console.error('Failed to admin reset quest:', error);
      return { error };
    }
  }, [state.player, state.user, state.activeQuests, state.completedQuests]);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH USER QUESTS FROM SUPABASE
  // ─────────────────────────────────────────────────────────────────────────
  const fetchUserQuests = useCallback(async (userId) => {
    if (!isSupabaseConfigured() || !userId) return;
    
    try {
      // Fetch user's active quests (without join to avoid schema cache issues)
      const { data: userQuests, error: userQuestsError } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId);
      
      if (userQuestsError) {
        console.error('Error fetching user quests:', userQuestsError);
        return;
      }

      if (!userQuests || userQuests.length === 0) {
        dispatch({
          type: ACTIONS.SET_QUESTS,
          payload: { active: [], completed: [] }
        });
        return;
      }

      // Fetch all quest details separately
      const questIds = [...new Set(userQuests.map(uq => uq.quest_id))];
      const { data: quests, error: questsError } = await supabase
        .from('quests')
        .select('*')
        .in('id', questIds);

      if (questsError) {
        console.error('Error fetching quests:', questsError);
        return;
      }

      // Create a map of quest details
      const questMap = {};
      (quests || []).forEach(quest => {
        questMap[quest.id] = quest;
      });
      
      // Transform to internal format
      const activeQuests = [];
      const completedQuests = [];
      
      for (const uq of userQuests) {
        const quest = questMap[uq.quest_id];
        if (!quest) continue; // Skip if quest not found
        
        // Extract coordinates from quest metadata if available
        const metadata = quest?.metadata || {};
        
        // IMPORTANT: Spread quest FIRST, then override with user_quest specific fields
        const questData = {
          ...quest,
          // Override with user_quests specific data (MUST come after spread!)
          id: uq.id,                    // user_quests.id (row id), NOT quests.id!
          questId: uq.quest_id,         // quests.id (template id)
          xpReward: quest?.xp_reward,
          gemReward: quest?.gem_reward || Math.floor((quest?.xp_reward || 0) / 2),
          timeLimit: quest?.time_limit,
          expiresIn: quest?.expires_in,
          requiresScan: quest?.requires_scan,
          target: quest?.target_value || 1,
          location: quest?.location_id,
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
      
      // console.log('User quests loaded:', activeQuests.length, 'active,', completedQuests.length, 'completed');
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

    // Load static game data (quests, locations, event challenges)
    fetchGameData();
    fetchEventChallenges();

    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          const { profile, error } = await loadUserProfile(session.user.id, session.user);
          
          // If profile doesn't exist (user was deleted), sign out
          if (error || !profile) {
            // console.log('User profile not found, signing out stale session');
            await supabase.auth.signOut();
            dispatch({ type: ACTIONS.SET_USER, payload: null });
          } else {
            dispatch({ type: ACTIONS.SET_USER, payload: session.user });
            // Fetch user's quests, friends, and challenge progress from Supabase
            await fetchUserQuests(session.user.id);
            await fetchFriends(session.user.id);
            await fetchUserEventChallenges();
            await fetchQuestlineProgress();
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
          // console.log('User profile not found after sign in');
          await supabase.auth.signOut();
          dispatch({ type: ACTIONS.SET_USER, payload: null });
        } else {
          dispatch({ type: ACTIONS.SET_USER, payload: session.user });
          // Fetch user's quests, friends, and challenge progress from Supabase
          await fetchUserQuests(session.user.id);
          await fetchFriends(session.user.id);
          await fetchUserEventChallenges();
          await fetchQuestlineProgress();
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
        // Clear questline progress
        dispatch({ type: ACTIONS.SET_QUESTLINE_PROGRESS, payload: {} });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        dispatch({ type: ACTIONS.SET_USER, payload: session.user });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserProfile, fetchUserQuests, fetchFriends, fetchGameData, fetchEventChallenges, fetchQuestlineProgress]);

  // ─────────────────────────────────────────────────────────────────────────
  // SYNC COLLECTED CARDS FROM CLAIMED CHALLENGES
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.eventChallenges.length === 0 || state.userEventChallenges.length === 0) return;
    
    // Derive collected card IDs from claimed challenges
    const claimedCardIds = state.userEventChallenges
      .filter(uc => uc.status === 'claimed')
      .map(uc => {
        const challenge = state.eventChallenges.find(ec => ec.id === uc.challenge_id);
        return challenge?.reward?.cardId;
      })
      .filter(Boolean);
    
    // Only update if different
    const currentIds = state.collectedCardIds.join(',');
    const newIds = claimedCardIds.join(',');
    if (currentIds !== newIds) {
      dispatch({ 
        type: ACTIONS.SET_COLLECTED_CARDS, 
        payload: claimedCardIds 
      });
    }
  }, [state.eventChallenges, state.userEventChallenges, state.collectedCardIds]);

  // ─────────────────────────────────────────────────────────────────────────
  // SUPABASE REALTIME SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !state.user) return;

    // Subscribe to profile changes (for leaderboard updates when scores change)
    const leaderboardChannel = supabase
      .channel('profiles_score_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        // Only refresh if score changed
        if (payload.old?.score !== payload.new?.score) {
          fetchLeaderboard();
        }
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
        // Fetch user's quests and challenge progress from Supabase
        await fetchUserQuests(data.user.id);
        await fetchUserEventChallenges();
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
  const completeQuest = useCallback(async (questId, questUuid = null) => {
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
        
        // Check if this quest belongs to a questline challenge
        // Use the actual quest UUID if provided, otherwise try to get it from the quest object
        const actualQuestId = questUuid || quest?.questId || questId;
        console.log('[completeQuest] Checking questline for quest:', { 
          questUuid, 
          questQuestId: quest?.questId, 
          questId, 
          actualQuestId 
        });
        if (actualQuestId) {
          const questlineResults = await handleQuestCompletionForQuestline(actualQuestId);
          console.log('[completeQuest] Questline update results:', questlineResults);
        }
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
  }, [addScore, awardRandomCard, state.player.totalQuestsCompleted, state.player.score, state.activeQuests, state.user, handleQuestCompletionForQuestline]);

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

    console.log('[GameProvider] Adding friend with ID:', friendId);

    // Check if already friends (in local state)
    const existingFriend = state.friends.find(f => f.id === friendId);
    if (existingFriend) {
      console.log('[GameProvider] Already friends (local state)');
      return { error: 'already_friends', friend: existingFriend };
    }

    // Can't add yourself
    if (friendId === state.user.id) {
      return { error: 'Cannot add yourself', friend: null };
    }

    // Get friend profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .single();
    
    if (profileError || !profile) {
      console.log('[GameProvider] User not found:', friendId, profileError);
      return { error: 'User not found', friend: null };
    }

    console.log('[GameProvider] Found profile:', profile.display_name);

    // Check if friendship already exists in database (either direction)
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${state.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${state.user.id})`)
      .single();

    if (existingFriendship) {
      console.log('[GameProvider] Friendship already exists in DB');
      // Map profile to friend object
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
      // Add to local state if not already there
      dispatch({ type: ACTIONS.ADD_FRIEND, payload: friendData });
      return { error: 'already_friends', friend: friendData };
    }

    // Create friendship with status 'accepted' (direct add via QR scan)
    const { error } = await supabase
      .from('friendships')
      .insert({ 
        user_id: state.user.id, 
        friend_id: friendId,
        status: 'accepted'  // Direct add, no pending state
      });
    
    if (error) {
      console.log('[GameProvider] Error creating friendship:', error);
      // Might be duplicate - check if already friends in DB
      if (error.code === '23505') {
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
        return { error: 'already_friends', friend: friendData };
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

    console.log('[GameProvider] Friend added successfully:', friendData.display_name);
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

  // Fetch leaderboard - uses profiles table directly since leaderboard table may not exist
  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      // Use profiles table with score - show ALL users ranked by points
      // Order by score DESC, then by id for stable ordering
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, score, team')
        .order('score', { ascending: false })
        .order('id', { ascending: true });
      
      if (error) {
        // Silently handle - table might not exist or have issues
        return;
      }
      
      if (data) {
        // Ensure stable sorting: by score DESC, then by id ASC for equal scores
        const sortedData = [...data].sort((a, b) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return (a.id || '').localeCompare(b.id || '');
        });
        
        const leaderboardData = sortedData.map((item, index) => ({
          rank: index + 1,
          id: item.id,
          username: item.username,
          display_name: item.display_name,
          avatar_url: item.avatar_url,
          score: item.score || 0,
          weeklyXP: item.score || 0, // Backwards compatibility
          team: item.team,
        }));
        
        const myRank = state.user 
          ? leaderboardData.findIndex(p => p.id === state.user.id) + 1 
          : null;
        
        dispatch({ 
          type: ACTIONS.SET_LEADERBOARD, 
          payload: { data: leaderboardData, myRank: myRank || null }
        });
      }
    } catch (err) {
      // Silently fail - leaderboard is optional feature
    }
  }, [state.user]);

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    if (!isSupabaseConfigured() || !state.user) return;
    
    const { data } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:profiles!challenger_id (username, display_name, avatar_url),
        opponent:profiles!opponent_id (username, display_name, avatar_url)
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
    fetchFriends,
    fetchGameData,
    fetchEventChallenges,
    fetchUserEventChallenges,
    claimEventChallenge,
    updateLocation,
    updateProfile,
    clearNewAchievement,
    removeToast,
    acknowledgeCard,
    
    // Questline Challenge Actions
    fetchQuestlineProgress,
    startQuestlineChallenge,
    completeQuestlineQuest: completeQuestlineQuestAction,
    handleQuestCompletionForQuestline,
    
    // Admin Challenge Actions
    adminCompleteChallenge,
    adminUncompleteChallenge,
    
    // Admin Quest Actions
    adminCompleteQuest,
    adminUncompleteQuest,
    adminResetQuest,
    
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
    fetchFriends,
    fetchGameData,
    fetchEventChallenges,
    fetchUserEventChallenges,
    claimEventChallenge,
    updateLocation,
    updateProfile,
    clearNewAchievement,
    removeToast,
    acknowledgeCard,
    fetchQuestlineProgress,
    startQuestlineChallenge,
    completeQuestlineQuestAction,
    handleQuestCompletionForQuestline,
    adminCompleteChallenge,
    adminUncompleteChallenge,
    adminCompleteQuest,
    adminUncompleteQuest,
    adminResetQuest,
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
