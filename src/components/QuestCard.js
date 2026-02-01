import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { COLORS, SHADOWS } from '../theme';

const QuestCard = ({ 
  quest, 
  onPress, 
  onAction,
  actionLabel = "Check In",
  isActionLoading = false
}) => {
  const { 
    title, 
    description, 
    xpReward, 
    gemReward,
    progress = 0, 
    target = 1, 
    icon = 'flag', 
    color = COLORS.primary,
    difficulty = 'easy',
    type
  } = quest;

  // Calculate gem reward if not provided (based on XP)
  const displayGemReward = gemReward || Math.floor(xpReward / 2);

  const progressPercent = Math.min(100, Math.max(0, (progress / target) * 100));
  const isCompleted = progress >= target;

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#10B981';
    }
  };

  return (
    <GlassCard style={styles.card}>
      <TouchableOpacity 
        style={styles.contentContainer} 
        activeOpacity={0.9} 
        onPress={onPress}
      >
        {/* Header: Icon & Text */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: getDifficultyColor(difficulty) + '20' }]}>
                <Text style={[styles.badgeText, { color: getDifficultyColor(difficulty) }]}>
                  {difficulty.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#3B82F620' }]}>
                <Text style={[styles.badgeText, { color: '#3B82F6' }]}>
                  {xpReward} XP
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: COLORS.primaryLight }]}>
                <View style={styles.gemBadgeContent}>
                  <Ionicons name="diamond" size={10} color={COLORS.primary} />
                  <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                    {displayGemReward}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>{description}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercent}%`, backgroundColor: color }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress} / {target}
          </Text>
        </View>

        {/* Action Button (if applicable and not completed) */}
        {!isCompleted && onAction && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: color }]}
            onPress={onAction}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
               <Text style={styles.actionButtonText}>Checking...</Text>
            ) : (
               <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                 <Ionicons name={type === 'location' ? 'location' : 'scan'} size={16} color="#FFF" />
                 <Text style={styles.actionButtonText}>{actionLabel}</Text>
               </View>
            )}
          </TouchableOpacity>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.completedText}>Abgeschlossen!</Text>
          </View>
        )}
      </TouchableOpacity>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 16,
  },
  contentContainer: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gemBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.muted,
    width: 40,
    textAlign: 'right',
  },
  actionButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
  },
  completedText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default QuestCard;
