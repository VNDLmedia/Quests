// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Achievement Toast Component
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RARITY } from '../game/config/achievements';
import { COLORS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

const AchievementToast = ({ achievement, onDismiss, duration = 4000 }) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const rarity = RARITY[achievement?.rarity] || RARITY.common;

  useEffect(() => {
    if (!achievement) return;

    // Entrance animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation for rare+ achievements
    if (['rare', 'epic', 'legendary'].includes(achievement.rarity)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [achievement]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!achievement) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.95} onPress={dismiss}>
        {/* Glow effect for rare achievements */}
        {['rare', 'epic', 'legendary'].includes(achievement.rarity) && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                backgroundColor: rarity.color,
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        <LinearGradient
          colors={
            achievement.rarity === 'legendary'
              ? ['#FEF3C7', '#FDE68A', '#F59E0B']
              : achievement.rarity === 'epic'
              ? ['#F5F3FF', '#EDE9FE', '#DDD6FE']
              : ['#FFFFFF', '#F8FAFC']
          }
          style={styles.toast}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>ACHIEVEMENT UNLOCKED</Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarity.bgColor }]}>
              <Text style={[styles.rarityText, { color: rarity.color }]}>
                {rarity.name}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: achievement.color + '20' }]}>
              <Ionicons name={achievement.icon} size={32} color={achievement.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{achievement.name}</Text>
              <Text style={styles.description}>{achievement.description}</Text>
            </View>
          </View>

          {/* XP Reward */}
          <View style={styles.xpContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.xpText}>+{achievement.xp} XP</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    ...SHADOWS.xl,
  },
  toast: {
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.text.muted,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 6,
  },
});

export default AchievementToast;

