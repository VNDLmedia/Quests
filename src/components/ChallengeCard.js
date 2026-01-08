// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Challenge Card Component
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
import { QUEST_TEMPLATES } from '../game/config/quests';

const ChallengeCard = ({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onViewDetails,
}) => {
  if (!challenge) return null;

  const quest = QUEST_TEMPLATES[challenge.quest_key];
  const isChallenger = challenge.challenger_id === currentUserId;
  const opponent = isChallenger ? challenge.opponent : challenge.challenger;
  const myProgress = isChallenger ? challenge.challenger_progress : challenge.opponent_progress;
  const theirProgress = isChallenger ? challenge.opponent_progress : challenge.challenger_progress;

  const getStatusConfig = () => {
    switch (challenge.status) {
      case 'pending':
        return {
          label: isChallenger ? 'Waiting...' : 'New Challenge!',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        };
      case 'active':
        return {
          label: 'In Progress',
          color: '#10B981',
          bgColor: '#ECFDF5',
        };
      case 'completed':
        const isWinner = challenge.winner_id === currentUserId;
        return {
          label: isWinner ? 'You Won!' : 'You Lost',
          color: isWinner ? '#10B981' : '#EF4444',
          bgColor: isWinner ? '#ECFDF5' : '#FEE2E2',
        };
      default:
        return {
          label: challenge.status,
          color: COLORS.text.muted,
          bgColor: '#F1F5F9',
        };
    }
  };

  const status = getStatusConfig();

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.9}
      onPress={onViewDetails}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.vsContainer}>
            {/* Your avatar */}
            <View style={styles.avatarMe}>
              <Text style={styles.avatarText}>You</Text>
            </View>
            <View style={styles.vsIcon}>
              <Ionicons name="flash" size={14} color="#FFF" />
            </View>
            {/* Opponent avatar */}
            <View style={styles.avatarOpponent}>
              <Text style={styles.avatarText}>
                {opponent?.display_name?.charAt(0) || opponent?.username?.charAt(0) || '?'}
              </Text>
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.opponentName}>
              vs {opponent?.display_name || opponent?.username || 'Unknown'}
            </Text>
            <Text style={styles.questName}>{quest?.title || 'Challenge'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Progress (if active) */}
      {challenge.status === 'active' && (
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>You</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    styles.progressFillMe,
                    { width: `${(myProgress / quest?.target || 1) * 100}%` }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.progressValue}>{myProgress || 0}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {opponent?.display_name?.split(' ')[0] || 'Them'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    styles.progressFillThem,
                    { width: `${(theirProgress / quest?.target || 1) * 100}%` }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.progressValue}>{theirProgress || 0}</Text>
          </View>
        </View>
      )}

      {/* Actions (if pending and not challenger) */}
      {challenge.status === 'pending' && !isChallenger && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.declineBtn}
            onPress={onDecline}
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAccept}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.acceptBtn}
            >
              <Text style={styles.acceptText}>Accept</Text>
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Reward */}
      <View style={styles.rewardRow}>
        <Ionicons name="trophy" size={14} color={COLORS.gold} />
        <Text style={styles.rewardText}>
          Winner gets +{challenge.xp_reward} XP
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarMe: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarOpponent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    zIndex: 1,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  vsIcon: {
    position: 'absolute',
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  headerInfo: {
    flex: 1,
  },
  opponentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  questName: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Progress
  progressSection: {
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFillMe: {
    backgroundColor: COLORS.primary,
  },
  progressFillThem: {
    backgroundColor: '#EF4444',
  },
  progressValue: {
    width: 30,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'right',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  // Reward
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceAlt,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gold,
  },
});

export default ChallengeCard;

