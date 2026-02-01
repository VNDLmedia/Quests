// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Social Screen
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SHADOWS, PALETTE } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../game/GameProvider';
import { useLeaderboard } from '../game/hooks';
import LiveLeaderboard from '../components/LiveLeaderboard';
import ChallengeCard from '../components/ChallengeCard';
import ActivityFeed from '../components/ActivityFeed';
import { Skeleton } from '../components';

const SocialScreen = () => {
  const insets = useSafeAreaInsets();
  const { 
    player, 
    friends, 
    activeChallenges, 
    activityFeed,
    incomingFriendRequests,
    addFriend,
    createChallenge,
    fetchChallenges,
  } = useGame();
  
  const { 
    friendsLeaderboard, 
    myFriendsRank, 
    refresh: refreshLeaderboard,
    isOnline 
  } = useLeaderboard();

  const [activeTab, setActiveTab] = useState('leaderboard');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  const [permission, requestPermission] = useCameraPermissions();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshLeaderboard(),
      fetchChallenges(),
    ]);
    setIsRefreshing(false);
  };

  const handleBarCodeScanned = async ({ data }) => {
    setShowScanModal(false);
    // Data should be a user ID like "EP-XXXX"
    if (data.startsWith('EP-')) {
      const userId = data;
      const result = await addFriend(userId);
      if (!result.error) {
        alert('Friend request sent!');
      }
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    
    // Auto-prefix if user just types the ID part
    let code = manualCode.trim().toUpperCase();
    if (!code.startsWith('EP-') && !code.startsWith('QUEST-')) {
      code = `EP-${code}`;
    }

    setShowScanModal(false);
    setManualCode('');
    
    // Simulate add friend (or call real function if available for manual code)
    const result = await addFriend(code);
    if (!result?.error) {
      alert(`Friend request sent to ${code}!`);
    } else {
      alert('Could not add friend. Please check the code.');
    }
  };

  const startScan = async () => {
    if (Platform.OS === 'web') {
        setShowScanModal(true);
        return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setShowScanModal(true);
  };

  const handleCreateChallenge = (friendId) => {
    setSelectedFriend(friendId);
    setShowChallengeModal(true);
  };

  const pendingChallenges = activeChallenges.filter(c => 
    c.status === 'pending' && c.opponent_id === player.id
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <View style={[styles.tabs, { marginTop: insets.top + 10 }]}>
        {[
          { key: 'leaderboard', label: 'Ranking', icon: 'podium' },
          { key: 'challenges', label: 'Challenges', icon: 'flash', badge: pendingChallenges.length },
          { key: 'activity', label: 'Activity', icon: 'pulse' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.key ? COLORS.primary : COLORS.text.muted} 
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.badge > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <View style={styles.section}>
            {/* My Rank Card */}
            <LinearGradient
              colors={COLORS.gradients.primary}
              style={styles.rankCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.rankLeft}>
                <Text style={styles.rankLabel}>Your Rank</Text>
                <Text style={styles.rankNumber}>#{myFriendsRank || '-'}</Text>
              </View>
              <View style={styles.rankRight}>
                <Text style={styles.rankXP}>{player.xp} XP</Text>
                <Text style={styles.rankLevel}>Level {player.level}</Text>
              </View>
            </LinearGradient>

            {/* Friends Leaderboard */}
            <LiveLeaderboard
              data={friendsLeaderboard}
              myRank={myFriendsRank}
              friendsOnly={true}
              onRefresh={refreshLeaderboard}
              isLoading={isRefreshing}
              title="Friends Ranking"
            />

            {/* Friends List */}
            <View style={styles.friendsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
                <TouchableOpacity onPress={startScan}>
                  <Text style={styles.sectionAction}>+ Add</Text>
                </TouchableOpacity>
              </View>
              
              {friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={COLORS.text.muted} />
                  <Text style={styles.emptyText}>No friends yet</Text>
                  <Text style={styles.emptySubtext}>Scan a QR code to add friends</Text>
                </View>
              ) : (
                friends.map((friend) => (
                  <View key={friend.id} style={styles.friendItem}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendInitial}>
                        {friend.display_name?.charAt(0) || friend.username?.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {friend.display_name || friend.username}
                      </Text>
                      <Text style={styles.friendLevel}>Level {friend.level || 1}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.challengeBtn}
                      onPress={() => handleCreateChallenge(friend.id)}
                    >
                      <Ionicons name="flash" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <View style={styles.section}>
            {/* Pending Challenges */}
            {pendingChallenges.length > 0 && (
              <View style={styles.challengeSection}>
                <Text style={styles.sectionTitle}>New Challenges</Text>
                {pendingChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={player.id}
                    onAccept={() => {}}
                    onDecline={() => {}}
                  />
                ))}
              </View>
            )}

            {/* Active Challenges */}
            <View style={styles.challengeSection}>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              {activeChallenges.filter(c => c.status === 'active').length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="flash-outline" size={48} color={COLORS.text.muted} />
                  <Text style={styles.emptyText}>No active challenges</Text>
                  <Text style={styles.emptySubtext}>Challenge a friend to compete!</Text>
                </View>
              ) : (
                activeChallenges
                  .filter(c => c.status === 'active')
                  .map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentUserId={player.id}
                    />
                  ))
              )}
            </View>

            {/* Challenge Button */}
            {friends.length > 0 && (
              <TouchableOpacity style={styles.newChallengeBtn}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.newChallengeBtnGrad}
                >
                  <Ionicons name="flash" size={20} color="#FFF" />
                  <Text style={styles.newChallengeBtnText}>Create Challenge</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <View style={styles.section}>
            <ActivityFeed
              activities={activityFeed}
              maxItems={20}
              showHeader={false}
            />
          </View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} animationType="slide">
        <View style={styles.qrModal}>
          <TouchableOpacity 
            style={styles.modalClose} 
            onPress={() => setShowQRModal(false)}
          >
            <Ionicons name="close" size={28} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <Text style={styles.qrTitle}>Your Code</Text>
          <Text style={styles.qrSubtitle}>Let friends scan this to add you</Text>
          
          <View style={styles.qrContainer}>
            <QRCode 
              value={`EP-${player.id || 'GUEST'}`} 
              size={200}
              color="#000"
              backgroundColor="#FFF"
            />
          </View>
          
          <Text style={styles.qrId}>EP-{player.id?.slice(0, 8) || 'GUEST'}</Text>
        </View>
      </Modal>

      {/* Scan Modal */}
      <Modal visible={showScanModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.scanModal}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1}}>
          {Platform.OS !== 'web' && permission?.granted ? (
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.scanOverlay}>
              <TouchableOpacity 
                style={styles.scanClose}
                onPress={() => setShowScanModal(false)}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
              
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              
              <Text style={styles.scanText}>Scan friend's QR code</Text>
            </View>
          </CameraView>
          ) : (
            <View style={[styles.camera, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                 <TouchableOpacity 
                style={styles.scanClose}
                onPress={() => setShowScanModal(false)}
              >
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={{color: '#FFF', marginBottom: 20}}>Camera not available on Web or Permission Denied</Text>
            </View>
          )}

          {/* Manual Entry Section */}
          <View style={styles.manualEntryContainer}>
            <Text style={styles.manualEntryTitle}>Or enter code manually</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="EP-XXXX"
                placeholderTextColor="#666"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.manualSubmitBtn}
                onPress={handleManualSubmit}
              >
                <Text style={styles.manualSubmitText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },

  // Tabs - unified pill-container style
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  section: {
    gap: 20,
  },

  // Rank Card
  rankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    ...SHADOWS.md,
  },
  rankLeft: {},
  rankLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  rankNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
  },
  rankRight: {
    alignItems: 'flex-end',
  },
  rankXP: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  rankLevel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  // Friends Section
  friendsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 184, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  friendLevel: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  challengeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 184, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 184, 74, 0.2)',
  },

  // Challenge Section
  challengeSection: {
    gap: 12,
  },

  // New Challenge Button
  newChallengeBtn: {
    marginTop: 8,
  },
  newChallengeBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  newChallengeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: 4,
  },

  // QR Modal
  qrModal: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
  },
  qrTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 32,
  },
  qrContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    ...SHADOWS.lg,
  },
  qrId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.muted,
    marginTop: 24,
    letterSpacing: 1,
  },

  // Scan Modal
  scanModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 32,
  },
  manualEntryContainer: {
    padding: 24,
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  manualEntryTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  manualInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  manualSubmitBtn: {
    width: 80,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualSubmitText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SocialScreen;

