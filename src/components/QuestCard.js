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
  isActionLoading = false,
  // Admin props
  isAdmin = false,
  onAdminComplete,
  onAdminUncomplete,
  onAdminReset,
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
    <GlassCard style={[styles.card, isCompleted && styles.cardCompleted]}>
      <TouchableOpacity 
        style={[styles.contentContainer, isCompleted && styles.contentCompleted]} 
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
            <Text style={styles.completedText}>Completed!</Text>
          </View>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <View style={styles.adminControls}>
            {!isCompleted && onAdminComplete && (
              <TouchableOpacity 
                style={styles.adminCompleteButton}
                onPress={onAdminComplete}
              >
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.adminCompleteText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
            {isCompleted && onAdminUncomplete && (
              <TouchableOpacity 
                style={styles.adminUncompleteButton}
                onPress={onAdminUncomplete}
              >
                <Ionicons name="arrow-undo" size={16} color="#F59E0B" />
                <Text style={styles.adminUncompleteText}>Undo</Text>
              </TouchableOpacity>
            )}
            {onAdminReset && (
              <TouchableOpacity 
                style={styles.adminResetButton}
                onPress={onAdminReset}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.adminResetText}>Reset</Text>
              </TouchableOpacity>
            )}
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
  cardCompleted: {
    opacity: 0.6,
    borderColor: '#10B981',
  },
  contentContainer: {
    gap: 12,
  },
  contentCompleted: {
    opacity: 0.8,
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
  // Admin Styles
  adminControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  adminCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  adminCompleteText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  adminUncompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  adminUncompleteText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  adminResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  adminResetText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default QuestCard;
