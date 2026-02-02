// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Live Leaderboard Component
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
import Skeleton from './Skeleton';

const LiveLeaderboard = ({
  data = [],
  myRank = null,
  friendsOnly = false,
  onRefresh,
  isLoading = false,
  title = 'This Week',
}) => {
  const [activeTab, setActiveTab] = useState(friendsOnly ? 'friends' : 'global');
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animate rank changes
  const animateChange = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const topThree = data.slice(0, 3);
  const rest = data.slice(3);

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return { bg: '#FEF3C7', icon: '#F59E0B', border: '#F59E0B' };
      case 2: return { bg: '#F1F5F9', icon: '#94A3B8', border: '#CBD5E1' };
      case 3: return { bg: '#FED7AA', icon: '#EA580C', border: '#EA580C' };
      default: return { bg: '#F8FAFC', icon: COLORS.text.muted, border: 'transparent' };
    }
  };

  const formatScore = (score) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score?.toString() || '0';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={20} color={COLORS.text.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'global' && styles.tabActive]}
            onPress={() => setActiveTab('global')}
          >
            <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>
              Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 3 Podium */}
      {isLoading ? (
        <View style={{flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20}}>
           <View style={{alignItems: 'center', marginTop: 30}}>
             <Skeleton width={48} height={48} borderRadius={24} style={{marginBottom: 8}} />
             <Skeleton width={60} height={12} borderRadius={4} />
           </View>
           <View style={{alignItems: 'center'}}>
             <Skeleton width={60} height={60} borderRadius={30} style={{marginBottom: 8}} />
             <Skeleton width={80} height={16} borderRadius={4} />
           </View>
           <View style={{alignItems: 'center', marginTop: 30}}>
             <Skeleton width={48} height={48} borderRadius={24} style={{marginBottom: 8}} />
             <Skeleton width={60} height={12} borderRadius={4} />
           </View>
        </View>
      ) : (
      topThree.length >= 3 && (
        <View style={styles.podium}>
          {/* 2nd Place */}
          <View style={[styles.podiumItem, styles.podiumSecond]}>
            <View style={[styles.podiumAvatar, { borderColor: getMedalColor(2).border }]}>
              <Text style={styles.podiumInitial}>
                {topThree[1]?.displayName?.charAt(0) || topThree[1]?.username?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={[styles.podiumMedal, { backgroundColor: getMedalColor(2).bg }]}>
              <Text style={[styles.podiumRank, { color: getMedalColor(2).icon }]}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[1]?.displayName || topThree[1]?.username}
            </Text>
            <Text style={styles.podiumXP}>{formatScore(topThree[1]?.score || topThree[1]?.weeklyXP)}</Text>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <View style={styles.crownContainer}>
              <Ionicons name="crown" size={24} color="#F59E0B" />
            </View>
            <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { borderColor: getMedalColor(1).border }]}>
              <Text style={[styles.podiumInitial, styles.podiumInitialFirst]}>
                {topThree[0]?.displayName?.charAt(0) || topThree[0]?.username?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={[styles.podiumMedal, styles.podiumMedalFirst, { backgroundColor: getMedalColor(1).bg }]}>
              <Text style={[styles.podiumRank, { color: getMedalColor(1).icon }]}>1</Text>
            </View>
            <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
              {topThree[0]?.displayName || topThree[0]?.username}
            </Text>
            <Text style={[styles.podiumXP, styles.podiumXPFirst]}>{formatScore(topThree[0]?.score || topThree[0]?.weeklyXP)}</Text>
          </View>

          {/* 3rd Place */}
          <View style={[styles.podiumItem, styles.podiumThird]}>
            <View style={[styles.podiumAvatar, { borderColor: getMedalColor(3).border }]}>
              <Text style={styles.podiumInitial}>
                {topThree[2]?.displayName?.charAt(0) || topThree[2]?.username?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={[styles.podiumMedal, { backgroundColor: getMedalColor(3).bg }]}>
              <Text style={[styles.podiumRank, { color: getMedalColor(3).icon }]}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topThree[2]?.displayName || topThree[2]?.username}
            </Text>
            <Text style={styles.podiumXP}>{formatScore(topThree[2]?.score || topThree[2]?.weeklyXP)}</Text>
          </View>
        </View>
      ))}

      {/* Rest of Leaderboard */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
             Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={styles.listItem}>
                    <Skeleton width={20} height={20} borderRadius={4} />
                    <Skeleton width={36} height={36} borderRadius={18} style={{marginHorizontal: 10}} />
                    <View style={{flex: 1}}>
                        <Skeleton width={120} height={16} borderRadius={4} style={{marginBottom: 4}} />
                        <Skeleton width={60} height={12} borderRadius={4} />
                    </View>
                    <Skeleton width={40} height={16} borderRadius={4} />
                </View>
             ))
        ) : (
        rest.map((player, index) => {
          const rank = index + 4;
          const isMe = player.isMe;
          
          return (
            <View 
              key={player.id || rank}
              style={[styles.listItem, isMe && styles.listItemMe]}
            >
              <Text style={[styles.listRank, isMe && styles.listRankMe]}>
                {rank}
              </Text>
              <View style={[styles.listAvatar, isMe && styles.listAvatarMe]}>
                <Text style={[styles.listInitial, isMe && styles.listInitialMe]}>
                  {player.displayName?.charAt(0) || player.username?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={[styles.listName, isMe && styles.listNameMe]}>
                  {player.displayName || player.username}
                  {isMe && ' (You)'}
                </Text>
                <Text style={styles.listLevel}>{formatScore(player.score || player.weeklyXP)} Points</Text>
              </View>
              <Text style={[styles.listXP, isMe && styles.listXPMe]}>
                {formatScore(player.score || player.weeklyXP)}
              </Text>
            </View>
          );
        })
        )}

        {/* My Rank (if not in visible list) */}
        {!isLoading && myRank && myRank > data.length && (
          <View style={styles.myRankContainer}>
            <Text style={styles.myRankDots}>• • •</Text>
            <View style={[styles.listItem, styles.listItemMe]}>
              <Text style={[styles.listRank, styles.listRankMe]}>{myRank}</Text>
              <View style={[styles.listAvatar, styles.listAvatarMe]}>
                <Text style={[styles.listInitial, styles.listInitialMe]}>Y</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={[styles.listName, styles.listNameMe]}>You</Text>
              </View>
              <Text style={[styles.listXP, styles.listXPMe]}>-</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  tabTextActive: {
    color: COLORS.text.primary,
  },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumFirst: {
    marginBottom: 20,
  },
  podiumSecond: {
    marginBottom: 0,
  },
  podiumThird: {
    marginBottom: 0,
  },
  crownContainer: {
    marginBottom: -8,
    zIndex: 10,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232, 184, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 8,
  },
  podiumAvatarFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
  },
  podiumInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  podiumInitialFirst: {
    fontSize: 22,
  },
  podiumMedal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    marginBottom: 8,
    zIndex: 10,
  },
  podiumMedalFirst: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: -18,
  },
  podiumRank: {
    fontSize: 12,
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumNameFirst: {
    fontSize: 14,
  },
  podiumXP: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  podiumXPFirst: {
    fontSize: 13,
    color: COLORS.gold,
  },

  // List
  list: {
    maxHeight: 250,
  },
  listContent: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  listItemMe: {
    backgroundColor: 'rgba(232, 184, 74, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  listRank: {
    width: 28,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  listRankMe: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(93, 173, 226, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  listAvatarMe: {
    backgroundColor: COLORS.primary,
  },
  listInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  listInitialMe: {
    color: '#FFF',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  listNameMe: {
    color: COLORS.primary,
  },
  listLevel: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  listXP: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  listXPMe: {
    color: COLORS.primary,
  },
  myRankContainer: {
    marginTop: 8,
  },
  myRankDots: {
    textAlign: 'center',
    color: COLORS.text.muted,
    marginBottom: 8,
  },
});

export default LiveLeaderboard;

