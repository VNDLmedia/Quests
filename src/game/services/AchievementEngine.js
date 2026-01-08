// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Achievement Engine Service
// ═══════════════════════════════════════════════════════════════════════════
// Handles achievement checking, unlocking, and progress tracking

import { ACHIEVEMENTS, getAllAchievements, RARITY } from '../config/achievements';
import { Platform } from 'react-native';

// Dynamic import for haptics (not available on web)
let Haptics = null;
if (Platform.OS !== 'web') {
  import('expo-haptics').then(module => {
    Haptics = module;
  }).catch(() => {});
}

class AchievementEngineClass {
  constructor() {
    this.listeners = new Set();
    this.pendingUnlocks = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTENER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACHIEVEMENT CHECKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check all achievements against current player stats
   * @param {Object} stats - Current player statistics
   * @param {Array} unlockedKeys - Already unlocked achievement keys
   * @returns {Array} Newly unlocked achievements
   */
  checkAll(stats, unlockedKeys = []) {
    const newUnlocks = [];
    const progressUpdates = {};
    
    const allAchievements = getAllAchievements();
    
    for (const achievement of allAchievements) {
      // Skip already unlocked
      if (unlockedKeys.includes(achievement.key)) continue;
      
      const { unlocked, progress } = this.checkSingle(achievement, stats);
      
      // Track progress
      progressUpdates[achievement.key] = progress;
      
      // Check for unlock
      if (unlocked) {
        newUnlocks.push(achievement);
      }
    }
    
    // Queue unlocks for sequential notification
    if (newUnlocks.length > 0) {
      this.queueUnlocks(newUnlocks);
    }
    
    return { newUnlocks, progressUpdates };
  }

  /**
   * Check a single achievement
   * @param {Object} achievement - Achievement definition
   * @param {Object} stats - Player stats
   * @returns {Object} { unlocked, progress }
   */
  checkSingle(achievement, stats) {
    const { type, value } = achievement.condition;
    let currentValue = this.getStatValue(type, stats);
    
    return {
      unlocked: currentValue >= value,
      progress: currentValue,
    };
  }

  /**
   * Get the relevant stat value for a condition type
   */
  getStatValue(type, stats) {
    const mapping = {
      'quests_completed': stats.totalQuestsCompleted || 0,
      'friends_count': stats.friendsCount || 0,
      'login_streak': stats.loginStreak || 0,
      'level': stats.level || 1,
      'total_xp': stats.xp || stats.totalXP || 0,
      'challenges_won': stats.challengesWon || 0,
      'challenge_win_streak': stats.challengeWinStreak || 0,
      'distance_walked': stats.totalDistanceWalked || 0,
      'rewards_redeemed': stats.rewardsRedeemed || 0,
      'quest_time_under': stats.lastQuestTime || Infinity,
      'quests_per_hour': stats.questsLastHour || 0,
    };
    
    return mapping[type] || 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UNLOCK QUEUE (for sequential notifications)
  // ─────────────────────────────────────────────────────────────────────────

  queueUnlocks(achievements) {
    this.pendingUnlocks.push(...achievements);
    
    if (this.pendingUnlocks.length === achievements.length) {
      this.processUnlockQueue();
    }
  }

  async processUnlockQueue() {
    while (this.pendingUnlocks.length > 0) {
      const achievement = this.pendingUnlocks.shift();
      
      // Haptic feedback
      this.triggerHaptics(achievement.rarity);
      
      // Notify listeners
      this.notify('unlock', achievement);
      
      // Delay between multiple unlocks
      if (this.pendingUnlocks.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HAPTIC FEEDBACK
  // ─────────────────────────────────────────────────────────────────────────

  triggerHaptics(rarity) {
    if (Platform.OS === 'web' || !Haptics) return;
    
    try {
      switch (rarity) {
        case 'legendary':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
          break;
        case 'epic':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'rare':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // Haptics not available
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get achievement progress as percentage
   */
  getProgress(achievementKey, stats) {
    const achievement = ACHIEVEMENTS[achievementKey];
    if (!achievement) return 0;
    
    const currentValue = this.getStatValue(achievement.condition.type, stats);
    const targetValue = achievement.condition.value;
    
    return Math.min(100, (currentValue / targetValue) * 100);
  }

  /**
   * Get achievements close to unlocking
   */
  getNearlyUnlocked(stats, unlockedKeys = [], threshold = 75) {
    return getAllAchievements()
      .filter(a => !unlockedKeys.includes(a.key))
      .map(a => ({
        ...a,
        progress: this.getProgress(a.key, stats),
      }))
      .filter(a => a.progress >= threshold)
      .sort((a, b) => b.progress - a.progress);
  }

  /**
   * Calculate total XP from achievements
   */
  calculateTotalXP(unlockedKeys) {
    return unlockedKeys.reduce((total, key) => {
      const achievement = ACHIEVEMENTS[key];
      return total + (achievement?.xp || 0);
    }, 0);
  }

  /**
   * Get next achievement to unlock for a category
   */
  getNextInCategory(category, unlockedKeys = []) {
    const categoryAchievements = getAllAchievements()
      .filter(a => a.category === category && !unlockedKeys.includes(a.key))
      .sort((a, b) => a.condition.value - b.condition.value);
    
    return categoryAchievements[0] || null;
  }

  /**
   * Get rarity distribution of unlocked achievements
   */
  getRarityDistribution(unlockedKeys) {
    const distribution = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    
    for (const key of unlockedKeys) {
      const achievement = ACHIEVEMENTS[key];
      if (achievement) {
        distribution[achievement.rarity]++;
      }
    }
    
    return distribution;
  }

  /**
   * Check if a specific event should unlock achievements
   * Called after specific actions (quest complete, friend added, etc.)
   */
  checkEvent(eventType, eventData, currentStats, unlockedKeys) {
    const relevantTypes = {
      'quest_complete': ['quests_completed', 'quest_time_under', 'quests_per_hour'],
      'friend_added': ['friends_count'],
      'challenge_won': ['challenges_won', 'challenge_win_streak'],
      'reward_redeemed': ['rewards_redeemed'],
      'login': ['login_streak'],
      'level_up': ['level'],
      'xp_gained': ['total_xp'],
      'distance_walked': ['distance_walked'],
    };
    
    const typesToCheck = relevantTypes[eventType] || [];
    
    return this.checkAll(
      { ...currentStats, ...eventData },
      unlockedKeys
    );
  }
}

// Singleton instance
export const AchievementEngine = new AchievementEngineClass();
export default AchievementEngine;

