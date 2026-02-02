// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Realtime Service
// ═══════════════════════════════════════════════════════════════════════════
// Handles Supabase realtime subscriptions for live updates

import { supabase, isSupabaseConfigured } from '../../config/supabase';

class RealtimeServiceClass {
  constructor() {
    this.channels = new Map();
    this.listeners = new Map();
    this.isConnected = false;
    this.userId = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize realtime service for a user
   */
  async initialize(userId) {
    if (!isSupabaseConfigured()) {
      // console.log('Supabase not configured - realtime disabled');
      return false;
    }

    this.userId = userId;
    this.isConnected = true;

    // Setup default subscriptions
    await this.subscribeToLeaderboard();
    await this.subscribeToActivityFeed();
    await this.subscribeToChallenges();
    await this.subscribeToFriendships();

    return true;
  }

  /**
   * Disconnect all realtime channels
   */
  disconnect() {
    for (const [name, channel] of this.channels) {
      supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.isConnected = false;
    this.userId = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to leaderboard changes
   */
  async subscribeToLeaderboard() {
    const channelName = 'leaderboard_updates';
    
    if (this.channels.has(channelName)) return;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leaderboard',
      }, (payload) => {
        this.emit('leaderboard:change', payload);
      })
      .subscribe((status) => {
        // if (status === 'SUBSCRIBED') {
        //   console.log('Subscribed to leaderboard updates');
        // }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * Subscribe to activity feed
   */
  async subscribeToActivityFeed() {
    const channelName = 'activity_feed_updates';
    
    if (this.channels.has(channelName)) return;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
      }, (payload) => {
        this.emit('activity:new', payload.new);
      })
      .subscribe();

    this.channels.set(channelName, channel);
  }

  /**
   * Subscribe to challenges for current user
   */
  async subscribeToChallenges() {
    if (!this.userId) return;

    const channelName = 'challenge_updates';
    
    if (this.channels.has(channelName)) return;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'challenges',
        filter: `opponent_id=eq.${this.userId}`,
      }, (payload) => {
        this.emit('challenge:received', payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
        filter: `challenger_id=eq.${this.userId}`,
      }, (payload) => {
        this.emit('challenge:update', payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
        filter: `opponent_id=eq.${this.userId}`,
      }, (payload) => {
        this.emit('challenge:update', payload.new);
      })
      .subscribe();

    this.channels.set(channelName, channel);
  }

  /**
   * Subscribe to friendship changes
   */
  async subscribeToFriendships() {
    if (!this.userId) return;

    const channelName = 'friendship_updates';
    
    if (this.channels.has(channelName)) return;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `friend_id=eq.${this.userId}`,
      }, (payload) => {
        this.emit('friend:request', payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friendships',
        filter: `user_id=eq.${this.userId}`,
      }, (payload) => {
        if (payload.new.status === 'accepted') {
          this.emit('friend:accepted', payload.new);
        }
      })
      .subscribe();

    this.channels.set(channelName, channel);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRESENCE (Online Status)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Join presence channel to show online status
   */
  async joinPresence(userData = {}) {
    if (!this.userId) return;

    const channelName = 'online_users';
    
    if (this.channels.has(channelName)) {
      // Update presence instead
      const channel = this.channels.get(channelName);
      channel.track({
        ...userData,
        online_at: new Date().toISOString(),
      });
      return;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: this.userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.emit('presence:sync', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.emit('presence:join', { userId: key, data: newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.emit('presence:leave', { userId: key, data: leftPresences });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            ...userData,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * Update user's current activity (for friends to see)
   */
  async updateActivity(activity) {
    const channelName = 'online_users';
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.track({
        current_activity: activity,
        updated_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Get online friends
   */
  getOnlineUsers() {
    const channelName = 'online_users';
    const channel = this.channels.get(channelName);
    
    if (!channel) return {};
    return channel.presenceState();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BROADCAST (For challenges/duels)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send a direct message to a user (for challenges)
   */
  async sendToUser(targetUserId, eventType, payload) {
    const channelName = `user:${targetUserId}`;
    
    // Create or get channel
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = supabase.channel(channelName);
      await channel.subscribe();
      this.channels.set(channelName, channel);
    }

    // Broadcast message
    await channel.send({
      type: 'broadcast',
      event: eventType,
      payload: {
        from: this.userId,
        ...payload,
      },
    });
  }

  /**
   * Listen for direct messages
   */
  listenForDirectMessages(callback) {
    if (!this.userId) return () => {};

    const channelName = `user:${this.userId}`;
    
    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: '*' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT EMITTER
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if realtime is connected
   */
  isRealtimeConnected() {
    return this.isConnected && isSupabaseConfigured();
  }

  /**
   * Get active channels
   */
  getActiveChannels() {
    return Array.from(this.channels.keys());
  }
}

// Singleton instance
export const RealtimeService = new RealtimeServiceClass();
export default RealtimeService;

