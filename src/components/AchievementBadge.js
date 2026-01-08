// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Achievement Badge Component
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RARITY } from '../game/config/achievements';
import { COLORS, SHADOWS } from '../theme';

const AchievementBadge = ({ 
  achievement, 
  unlocked = false, 
  progress = 0, 
  size = 'medium',
  showProgress = true,
  onPress,
}) => {
  if (!achievement) return null;

  const rarity = RARITY[achievement.rarity] || RARITY.common;
  
  const sizes = {
    small: { badge: 48, icon: 20, font: 10 },
    medium: { badge: 64, icon: 28, font: 12 },
    large: { badge: 80, icon: 36, font: 14 },
  };
  
  const s = sizes[size] || sizes.medium;
  const progressPercent = Math.min(100, (progress / achievement.condition.value) * 100);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {/* Badge */}
      <View style={[
        styles.badge,
        { 
          width: s.badge, 
          height: s.badge,
          backgroundColor: unlocked ? rarity.bgColor : '#F1F5F9',
          borderColor: unlocked ? rarity.color : '#E2E8F0',
        }
      ]}>
        {/* Progress Ring (if not unlocked) */}
        {!unlocked && showProgress && progressPercent > 0 && (
          <View style={[styles.progressRing, { borderColor: rarity.color + '40' }]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  backgroundColor: rarity.color,
                  width: `${progressPercent}%`,
                }
              ]} 
            />
          </View>
        )}
        
        {/* Icon */}
        <Ionicons 
          name={achievement.icon || 'trophy'} 
          size={s.icon} 
          color={unlocked ? rarity.color : '#CBD5E1'}
        />
        
        {/* Lock overlay */}
        {!unlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={12} color="#94A3B8" />
          </View>
        )}
      </View>
      
      {/* Name */}
      <Text 
        style={[
          styles.name, 
          { fontSize: s.font },
          !unlocked && styles.nameGrey
        ]}
        numberOfLines={2}
      >
        {achievement.name}
      </Text>
      
      {/* Progress text */}
      {!unlocked && showProgress && (
        <Text style={styles.progressText}>
          {progress}/{achievement.condition.value}
        </Text>
      )}
      
      {/* XP Badge */}
      {unlocked && (
        <View style={[styles.xpBadge, { backgroundColor: rarity.bgColor }]}>
          <Text style={[styles.xpText, { color: rarity.color }]}>
            +{achievement.xp}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
  },
  badge: {
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    ...SHADOWS.sm,
  },
  progressRing: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 3,
    ...SHADOWS.sm,
  },
  name: {
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 16,
  },
  nameGrey: {
    color: COLORS.text.muted,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  xpBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default AchievementBadge;

