// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Event Challenge Card Component
// Für übergreifende Event-Challenges mit echten Belohnungen
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, PALETTE } from '../theme';
import { CHALLENGE_TIERS, REWARD_TYPES } from '../game/config/challenges';

const EventChallengeCard = ({
  challenge,
  currentProgress = 0,
  onPress,
  onClaim,
  isClaimed = false,
  compact = false,
}) => {
  if (!challenge) return null;

  const progress = Math.min(currentProgress, challenge.target);
  const progressPercent = (progress / challenge.target) * 100;
  const isCompleted = progress >= challenge.target;
  const tier = CHALLENGE_TIERS[challenge.tier] || CHALLENGE_TIERS.bronze;
  const rewardType = REWARD_TYPES[challenge.reward?.type];

  // Checklist für Rainbow-Challenge etc.
  const renderChecklist = () => {
    if (!challenge.checklistItems) return null;

    return (
      <View style={styles.checklist}>
        {challenge.checklistItems.map((item, index) => {
          // Hier würde man prüfen ob der Spieler einen Freund in diesem Team hat
          const isChecked = false; // Placeholder - wird vom Parent übergeben
          return (
            <View key={item.key} style={styles.checklistItem}>
              <View style={[styles.checklistIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons 
                  name={isChecked ? 'checkmark-circle' : item.icon} 
                  size={16} 
                  color={isChecked ? '#10B981' : item.color} 
                />
              </View>
              <Text style={[styles.checklistLabel, isChecked && styles.checklistLabelChecked]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Belohnungs-Badge
  const renderRewardBadge = () => {
    const rewardConfig = {
      physical_card: { icon: 'card', label: 'Echte Karte', color: '#FFD700' },
      digital_card: { icon: 'sparkles', label: 'Digital', color: '#8B5CF6' },
      badge: { icon: 'medal', label: 'Abzeichen', color: '#EC4899' },
      xp_boost: { icon: 'flash', label: 'XP Boost', color: '#F59E0B' },
      pack: { icon: 'gift', label: 'Pack', color: '#10B981' },
    };

    const config = rewardConfig[challenge.reward?.type] || rewardConfig.digital_card;

    return (
      <View style={[styles.rewardBadge, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.rewardBadgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactCard}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <LinearGradient
          colors={challenge.gradient || tier.gradient || [tier.color, tier.color]}
          style={styles.compactIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={challenge.icon} size={20} color="#FFF" />
        </LinearGradient>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{challenge.title}</Text>
          <View style={styles.compactProgressBar}>
            <View style={[styles.compactProgressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
        <Text style={styles.compactProgress}>{progress}/{challenge.target}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, isCompleted && !isClaimed && styles.cardCompleted]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={challenge.gradient || [tier.color, tier.color]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name={challenge.icon} size={28} color="#FFF" />
          </View>
          <View style={styles.headerText}>
            <View style={styles.tierRow}>
              <View style={styles.tierBadge}>
                <Ionicons name={tier.icon} size={10} color="#FFF" />
                <Text style={styles.tierText}>{tier.name}</Text>
              </View>
              {renderRewardBadge()}
            </View>
            <Text style={styles.title}>{challenge.title}</Text>
          </View>
        </View>
        
        {/* Completion Badge */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name={isClaimed ? 'checkmark-done' : 'checkmark-circle'} size={18} color="#FFF" />
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>{challenge.description}</Text>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={challenge.gradient || [tier.color, tier.color]}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={styles.progressNumbers}>
            <Text style={styles.progressText}>
              {progress} / {challenge.target}
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
          </View>
        </View>

        {/* Checklist (für Rainbow Friends etc.) */}
        {renderChecklist()}

        {/* Reward Section */}
        <View style={styles.rewardSection}>
          <View style={styles.rewardInfo}>
            <Ionicons name="gift" size={16} color={COLORS.gold} />
            <Text style={styles.rewardLabel}>Belohnung:</Text>
            <Text style={styles.rewardValue}>
              {rewardType?.name || challenge.reward?.type}
              {challenge.reward?.rarity && ` (${challenge.reward.rarity})`}
            </Text>
          </View>
          <View style={styles.xpReward}>
            <Ionicons name="flash" size={14} color={COLORS.primary} />
            <Text style={styles.xpText}>+{challenge.xpReward} XP</Text>
          </View>
        </View>

        {/* Claim Location (für physische Karten) */}
        {challenge.reward?.claimLocation && isCompleted && !isClaimed && (
          <View style={styles.claimLocation}>
            <Ionicons name="location" size={14} color="#10B981" />
            <Text style={styles.claimLocationText}>
              Abholen: {challenge.reward.claimLocation}
            </Text>
          </View>
        )}

        {/* Action Button */}
        {isCompleted && !isClaimed && (
          <TouchableOpacity onPress={onClaim}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.claimButton}
            >
              <Text style={styles.claimButtonText}>Belohnung abholen</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isClaimed && (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
            <Text style={styles.claimedText}>Abgeholt!</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  cardCompleted: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  completedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  content: {
    padding: 16,
  },
  description: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    color: COLORS.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  checklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  checklistIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  checklistLabelChecked: {
    color: '#10B981',
  },
  rewardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardLabel: {
    color: COLORS.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardValue: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rewardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  claimLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  claimLocationText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
  },
  claimedText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  compactProgressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  compactProgress: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default EventChallengeCard;
