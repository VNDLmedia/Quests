import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, ScreenHeader } from '../components';
import { useGame } from '../game/GameProvider';
import { LEVEL_CONFIG } from '../game/config/rewards';
import { COLORS, TYPOGRAPHY } from '../theme';

const UserScreen = () => {
  const { user, player, signOut } = useGame();

  const handleSignOut = async () => {
    await signOut();
  };

  // Calculate XP progress using LEVEL_CONFIG
  const currentXP = player.xp || 0;
  const currentLevel = player.level || 1;
  const xpForCurrentLevel = LEVEL_CONFIG.getXPForLevel(currentLevel - 1);
  const xpForNextLevel = LEVEL_CONFIG.getXPForLevel(currentLevel);
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = LEVEL_CONFIG.getLevelProgress(currentXP);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <GlassCard style={styles.card}>
          <View style={styles.userHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>{player.displayName || 'User'}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>

          {/* Level Badge */}
          <View style={styles.levelContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {player.level}</Text>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpContainer}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>Experience</Text>
              <Text style={styles.xpValue}>{Math.floor(xpInCurrentLevel)} / {xpNeededForNext} XP</Text>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
            </View>
            <Text style={styles.totalXP}>Total: {player.xp} XP</Text>
          </View>
        </GlassCard>

        {/* Stats Card */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="trophy" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{player.totalQuestsCompleted}</Text>
              <Text style={styles.statLabel}>Quests</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Ionicons name="flame" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{player.loginStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="people" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{player.friendsCount || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="footsteps" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.statValue}>{Math.round(player.totalDistanceWalked || 0)}</Text>
              <Text style={styles.statLabel}>km Walked</Text>
            </View>
          </View>
        </GlassCard>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 20,
    padding: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  email: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text.inverse,
    fontSize: 16,
  },
  xpContainer: {
    marginTop: 8,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text.primary,
  },
  xpValue: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
  },
  xpBar: {
    height: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  totalXP: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.muted,
    textAlign: 'right',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 20,
  },
  logoutText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.error,
    marginLeft: 8,
  },
});

export default UserScreen;
