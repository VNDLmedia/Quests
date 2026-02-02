// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Live Leaderboard Component
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';
import { TEAMS } from '../config/teams';
import Skeleton from './Skeleton';

const LiveLeaderboard = ({
  data = [],
  myRank = null,
  isLoading = false,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Memoize and ensure stable sorting of leaderboard data
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Filter out invalid entries and create a stable copy
    const validData = data.filter(p => p && p.id);
    
    // Sort by score (descending), then by id (for stability when scores are equal)
    return [...validData].sort((a, b) => {
      const scoreA = a.score || a.weeklyXP || 0;
      const scoreB = b.score || b.weeklyXP || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      // Stable sort by id when scores are equal
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [data]);

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return { 
        bg: 'rgba(245, 158, 11, 0.15)', 
        color: '#F59E0B', 
        border: '#F59E0B',
      };
      case 2: return { 
        bg: 'rgba(148, 163, 184, 0.15)', 
        color: '#94A3B8', 
        border: '#CBD5E1',
      };
      case 3: return { 
        bg: 'rgba(234, 88, 12, 0.15)', 
        color: '#EA580C', 
        border: '#EA580C',
      };
      default: return { 
        bg: 'rgba(255,255,255,0.03)', 
        color: COLORS.text.muted, 
        border: 'transparent',
      };
    }
  };

  const formatScore = (score) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score?.toString() || '0';
  };

  const getPlayerName = (player) => {
    return player.display_name || player.displayName || player.username || '?';
  };

  const getPlayerInitial = (player) => {
    return getPlayerName(player).charAt(0).toUpperCase();
  };

  const renderPlayer = (player, index) => {
    const rank = index + 1;
    const isMe = player.isMe;
    const rankStyle = getRankStyle(rank);
    const isTopThree = rank <= 3;
    
    return (
      <TouchableOpacity 
        key={player.id || rank}
        style={[
          styles.listItem, 
          isTopThree && { backgroundColor: rankStyle.bg, borderColor: rankStyle.border, borderWidth: 1 },
          isMe && styles.listItemMe
        ]}
        onPress={() => setSelectedPlayer({ ...player, rank })}
        activeOpacity={0.7}
      >
        {/* Rank */}
        <View style={[
          styles.rankContainer,
          isTopThree && { backgroundColor: rankStyle.color }
        ]}>
          <Text style={[
            styles.listRank, 
            isTopThree && styles.listRankTopThree,
            isMe && styles.listRankMe
          ]}>
            {rank}
          </Text>
        </View>

        {/* Avatar */}
        <View style={[
          styles.listAvatar, 
          isTopThree && { borderColor: rankStyle.color, borderWidth: 2 },
          isMe && styles.listAvatarMe
        ]}>
          <Text style={[
            styles.listInitial, 
            isTopThree && { color: rankStyle.color },
            isMe && styles.listInitialMe
          ]}>
            {getPlayerInitial(player)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.listInfo}>
          <Text style={[
            styles.listName, 
            isTopThree && { color: rankStyle.color },
            isMe && styles.listNameMe
          ]}>
            {getPlayerName(player)}
            {isMe && ' (You)'}
          </Text>
          <Text style={styles.listLevel}>{formatScore(player.score || player.weeklyXP)} Points</Text>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={18} color={COLORS.text.muted} />
      </TouchableOpacity>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={styles.listContent}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={styles.listItem}>
            <Skeleton width={28} height={28} borderRadius={14} />
            <Skeleton width={36} height={36} borderRadius={18} style={{marginHorizontal: 10}} />
            <View style={{flex: 1}}>
              <Skeleton width={120} height={16} borderRadius={4} style={{marginBottom: 4}} />
              <Skeleton width={60} height={12} borderRadius={4} />
            </View>
            <Skeleton width={40} height={16} borderRadius={4} />
          </View>
        ))}
      </View>
    );
  }

  // Empty state
  if (sortedData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={48} color={COLORS.text.muted} />
        <Text style={styles.emptyText}>No players yet</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.listContent}>
        {sortedData.map((player, index) => renderPlayer(player, index))}

        {/* My Rank (if not in visible list) */}
        {myRank && myRank > sortedData.length && (
          <View style={styles.myRankContainer}>
            <Text style={styles.myRankDots}>• • •</Text>
            <View style={[styles.listItem, styles.listItemMe]}>
              <View style={styles.rankContainer}>
                <Text style={[styles.listRank, styles.listRankMe]}>{myRank}</Text>
              </View>
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
      </View>

      {/* Player Profile Modal */}
      <Modal visible={!!selectedPlayer} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <TouchableOpacity 
              style={styles.profileClose}
              onPress={() => setSelectedPlayer(null)}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            
            {selectedPlayer && (
              <>
                {/* Header with Team Color */}
                <LinearGradient
                  colors={[
                    TEAMS[selectedPlayer.team]?.color || COLORS.primary,
                    TEAMS[selectedPlayer.team]?.darkColor || COLORS.primary,
                  ]}
                  style={styles.profileHeader}
                >
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {getPlayerInitial(selectedPlayer)}
                    </Text>
                  </View>
                  
                  <Text style={styles.profileName}>
                    {getPlayerName(selectedPlayer)}
                  </Text>
                  
                  {selectedPlayer.team && TEAMS[selectedPlayer.team] && (
                    <View style={styles.teamBadge}>
                      <Ionicons name={TEAMS[selectedPlayer.team].icon} size={14} color="#FFF" />
                      <Text style={styles.teamBadgeText}>{TEAMS[selectedPlayer.team].name}</Text>
                    </View>
                  )}
                </LinearGradient>
                
                {/* Profile Content */}
                <View style={styles.profileContent}>
                  {/* Stats */}
                  <View style={styles.profileStats}>
                    <View style={styles.profileStat}>
                      <Text style={styles.profileStatValue}>{selectedPlayer.score || 0}</Text>
                      <Text style={styles.profileStatLabel}>Points</Text>
                    </View>
                    <View style={styles.profileStatDivider} />
                    <View style={styles.profileStat}>
                      <Text style={styles.profileStatValue}>#{selectedPlayer.rank || '-'}</Text>
                      <Text style={styles.profileStatLabel}>Rank</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
  rankContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  listRank: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
    textAlign: 'center',
  },
  listRankTopThree: {
    color: '#FFF',
    fontWeight: '700',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },

  // Profile Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  profileModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  profileClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  profileHeader: {
    padding: 32,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 12,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  teamBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  profileContent: {
    padding: 24,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileStat: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  profileStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  profileStatLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.borderLight,
  },
});

export default LiveLeaderboard;
