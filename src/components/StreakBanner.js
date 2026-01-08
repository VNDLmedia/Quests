// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Streak Banner Component
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
import { DAILY_REWARDS, getStreakMultiplier } from '../game/config/rewards';

const { width } = Dimensions.get('window');

const StreakBanner = ({ 
  streak = 0, 
  hasClaimedToday = false, 
  onClaim,
  dailyReward = null,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(hasClaimedToday);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for unclaimed reward
  useEffect(() => {
    if (!claimed) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [claimed]);

  const streakDay = ((streak) % 7) || 7;
  const todayReward = DAILY_REWARDS[streakDay - 1];
  const multiplier = getStreakMultiplier(streak);

  const handleClaim = async () => {
    if (claimed || claiming) return;
    
    setClaiming(true);
    
    // Confetti animation
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Call the claim function
    const result = await onClaim?.();
    
    setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
      setShowModal(false);
    }, 1500);
  };

  return (
    <>
      {/* Banner Button */}
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setShowModal(true)}
      >
        <Animated.View style={{ transform: [{ scale: claimed ? 1 : pulseAnim }] }}>
          <LinearGradient
            colors={claimed ? ['#F1F5F9', '#E2E8F0'] : ['#FEF3C7', '#FDE68A']}
            style={styles.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.bannerLeft}>
              <View style={[styles.flameContainer, claimed && styles.flameClaimed]}>
                <Ionicons 
                  name="flame" 
                  size={24} 
                  color={claimed ? '#94A3B8' : '#EF4444'} 
                />
              </View>
              <View>
                <Text style={[styles.streakCount, claimed && styles.textClaimed]}>
                  {streak} Day Streak
                </Text>
                <Text style={[styles.streakSub, claimed && styles.textSubClaimed]}>
                  {claimed ? 'Claimed today!' : `Tap to claim ${todayReward?.xp} XP`}
                </Text>
              </View>
            </View>
            
            {!claimed && (
              <View style={styles.claimBadge}>
                <Text style={styles.claimText}>CLAIM</Text>
              </View>
            )}
            
            {claimed && (
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.bigFlame}>
                <Ionicons name="flame" size={48} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>{streak} Day Streak!</Text>
              {multiplier > 1 && (
                <View style={styles.multiplierBadge}>
                  <Text style={styles.multiplierText}>{multiplier}x XP Bonus Active</Text>
                </View>
              )}
            </View>

            {/* Weekly Progress */}
            <View style={styles.weekGrid}>
              {DAILY_REWARDS.map((reward, index) => {
                const dayNum = index + 1;
                const isPast = dayNum < streakDay;
                const isToday = dayNum === streakDay;
                const isFuture = dayNum > streakDay;
                
                return (
                  <View 
                    key={dayNum}
                    style={[
                      styles.dayItem,
                      isPast && styles.dayPast,
                      isToday && styles.dayToday,
                      isFuture && styles.dayFuture,
                    ]}
                  >
                    <Text style={[
                      styles.dayLabel,
                      (isPast || isToday) && styles.dayLabelActive,
                    ]}>
                      Day {dayNum}
                    </Text>
                    <View style={[
                      styles.dayReward,
                      isPast && styles.dayRewardPast,
                      isToday && styles.dayRewardToday,
                    ]}>
                      {isPast ? (
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      ) : (
                        <Text style={[
                          styles.dayXP,
                          isToday && styles.dayXPToday,
                        ]}>
                          {reward.xp}
                        </Text>
                      )}
                    </View>
                    {dayNum === 7 && (
                      <View style={styles.bonusBadge}>
                        <Ionicons name="gift" size={12} color="#8B5CF6" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Claim Button */}
            {!claimed ? (
              <TouchableOpacity 
                style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
                onPress={handleClaim}
                disabled={claiming}
              >
                <LinearGradient
                  colors={claiming ? ['#94A3B8', '#64748B'] : ['#F59E0B', '#D97706']}
                  style={styles.claimButtonGradient}
                >
                  {claiming ? (
                    <Text style={styles.claimButtonText}>Claiming...</Text>
                  ) : (
                    <>
                      <Text style={styles.claimButtonText}>
                        Claim +{todayReward?.xp} XP
                      </Text>
                      <Ionicons name="star" size={20} color="#FFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.claimedContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.claimedText}>Claimed Today!</Text>
                <Text style={styles.claimedSub}>Come back tomorrow for more rewards</Text>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flameClaimed: {
    backgroundColor: '#F1F5F9',
  },
  streakCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  textClaimed: {
    color: COLORS.text.primary,
  },
  streakSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  textSubClaimed: {
    color: COLORS.text.secondary,
  },
  claimBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    ...SHADOWS.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bigFlame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  multiplierBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  multiplierText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Week Grid
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  dayItem: {
    width: (width - 100) / 4,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  dayPast: {
    backgroundColor: '#F0FDF4',
  },
  dayToday: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  dayFuture: {
    opacity: 0.5,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  dayLabelActive: {
    color: COLORS.text.primary,
  },
  dayReward: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRewardPast: {
    backgroundColor: '#10B981',
  },
  dayRewardToday: {
    backgroundColor: '#F59E0B',
  },
  dayXP: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  dayXPToday: {
    color: '#FFF',
  },
  bonusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 4,
  },

  // Claim Button
  claimButton: {
    marginBottom: 16,
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  claimedContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  claimedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 8,
  },
  claimedSub: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
});

export default StreakBanner;

