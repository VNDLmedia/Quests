// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Activity Feed Component
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

const ActivityFeed = ({ activities = [], maxItems = 10, showHeader = true }) => {
  const getActivityConfig = (type) => {
    const configs = {
      quest_complete: {
        icon: 'checkmark-circle',
        color: '#10B981',
        bgColor: '#ECFDF5',
        verb: 'completed',
      },
      achievement: {
        icon: 'trophy',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        verb: 'unlocked',
      },
      level_up: {
        icon: 'arrow-up-circle',
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        verb: 'reached',
      },
      friend_added: {
        icon: 'people',
        color: '#EC4899',
        bgColor: '#FCE7F3',
        verb: 'became friends with',
      },
      challenge_won: {
        icon: 'flash',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        verb: 'won a challenge against',
      },
      challenge_started: {
        icon: 'flag',
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        verb: 'started a challenge with',
      },
      reward_claimed: {
        icon: 'gift',
        color: '#0D9488',
        bgColor: '#CCFBF1',
        verb: 'claimed',
      },
      streak: {
        icon: 'flame',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        verb: 'reached',
      },
    };
    return configs[type] || configs.quest_complete;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderActivity = ({ item, index }) => {
    const config = getActivityConfig(item.activity_type || item.type);
    
    return (
      <View style={[styles.activityItem, index === 0 && styles.activityItemFirst]}>
        {/* Timeline */}
        <View style={styles.timeline}>
          <View style={[styles.timelineDot, { backgroundColor: config.bgColor, borderColor: config.color }]}>
            <Ionicons name={config.icon} size={14} color={config.color} />
          </View>
          {index < (activities.slice(0, maxItems).length - 1) && (
            <View style={styles.timelineLine} />
          )}
        </View>

        {/* Content */}
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>
            <Text style={styles.activityUser}>
              {item.user?.display_name || item.user?.username || 'Someone'}
            </Text>
            {' '}{config.verb}{' '}
            <Text style={[styles.activityHighlight, { color: config.color }]}>
              {item.title}
            </Text>
          </Text>
          
          {item.xp && (
            <View style={styles.xpBadge}>
              <Ionicons name="star" size={10} color="#F59E0B" />
              <Text style={styles.xpText}>+{item.xp} XP</Text>
            </View>
          )}
          
          <Text style={styles.activityTime}>
            {formatTime(item.created_at || item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={styles.headerText}>Activity</Text>
        </View>
      )}
      
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={40} color={COLORS.text.muted} />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        <FlatList
          data={activities.slice(0, maxItems)}
          renderItem={renderActivity}
          keyExtractor={(item, index) => item.id || `activity-${index}`}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  list: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  activityItemFirst: {
    paddingTop: 0,
  },
  timeline: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 28,
    bottom: -8,
    width: 2,
    backgroundColor: COLORS.surfaceAlt,
  },
  activityContent: {
    flex: 1,
    paddingLeft: 8,
  },
  activityText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  activityUser: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  activityHighlight: {
    fontWeight: '600',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginTop: 8,
  },
});

export default ActivityFeed;

