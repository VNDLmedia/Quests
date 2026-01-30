import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS } from '../theme';

// Basic Skeleton block
const Skeleton = ({ width, height, style, borderRadius = 8 }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton Card - for quest cards, user cards etc.
export const SkeletonCard = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardRow}>
      <Skeleton width={48} height={48} borderRadius={12} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  </View>
);

// Skeleton for Quest List
export const SkeletonQuestList = ({ count = 3 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} style={{ marginBottom: 12 }} />
    ))}
  </View>
);

// Skeleton for User Stats
export const SkeletonStats = () => (
  <View style={styles.statsGrid}>
    {Array.from({ length: 4 }).map((_, i) => (
      <View key={i} style={styles.statItem}>
        <Skeleton width={52} height={52} borderRadius={16} />
        <Skeleton width={40} height={20} style={{ marginTop: 8 }} />
        <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
      </View>
    ))}
  </View>
);

// Skeleton for Leaderboard
export const SkeletonLeaderboard = ({ count = 5 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.leaderboardRow}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={12} />
        </View>
        <Skeleton width={50} height={24} borderRadius={8} />
      </View>
    ))}
  </View>
);

// Skeleton for Pack Cards
export const SkeletonPackCard = () => (
  <View style={styles.packCard}>
    <Skeleton width={80} height={80} borderRadius={40} style={{ alignSelf: 'center', marginBottom: 12 }} />
    <Skeleton width="80%" height={18} style={{ alignSelf: 'center', marginBottom: 8 }} />
    <Skeleton width="60%" height={14} style={{ alignSelf: 'center', marginBottom: 16 }} />
    <Skeleton width={100} height={40} borderRadius={16} style={{ alignSelf: 'center' }} />
  </View>
);

// Skeleton Text Line
export const SkeletonText = ({ width = '100%', height = 14, style }) => (
  <Skeleton width={width} height={height} style={style} />
);

// Skeleton Avatar
export const SkeletonAvatar = ({ size = 44 }) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} />
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.border,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  list: {
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  packCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
  },
});

export default Skeleton;
