// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Social Screen
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
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
  RefreshControl,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SHADOWS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../game/GameProvider';
import { useLeaderboard } from '../game/hooks';
import LiveLeaderboard from '../components/LiveLeaderboard';
import { TEAMS } from '../config/teams';

// Safe import for UniversalQRScanner (Web only)
let UniversalQRScanner = null;
try {
  if (Platform.OS === 'web') {
    UniversalQRScanner = require('../components/UniversalQRScanner').default;
  }
} catch (error) {
  console.warn('UniversalQRScanner not available:', error);
}

const SocialScreen = () => {
  const insets = useSafeAreaInsets();
  const { 
    player, 
    friends, 
    addFriend,
    updateProfile,
    fetchFriends,
    user,
  } = useGame();
  
  const { 
    friendsLeaderboard, 
    myFriendsRank, 
    refresh: refreshLeaderboard,
  } = useLeaderboard();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(!player.leaderboardVisible);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [newFriend, setNewFriend] = useState(null); // For friend added modal
  const [selectedFriend, setSelectedFriend] = useState(null); // For friend profile modal
  
  const [permission, requestPermission] = useCameraPermissions();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshLeaderboard(),
      user?.id ? fetchFriends(user.id) : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  };
  
  const handleAcceptConsent = async () => {
    await updateProfile({ leaderboardVisible: true });
    setShowConsentModal(false);
  };

  const handleBarCodeScanned = async ({ data }) => {
    setShowScanModal(false);
    // Data should be a user ID like "EP-XXXX" or just the UUID
    let userId = data;
    if (data.startsWith('EP-')) {
      userId = data.substring(3); // Remove EP- prefix
    }
    
    const result = await addFriend(userId);
    
    if (result.friend) {
      if (result.error === 'already_friends') {
        // Show existing friend's profile
        setSelectedFriend(result.friend);
      } else {
        // Show new friend added modal
        setNewFriend(result.friend);
      }
    } else if (result.error) {
      alert(result.error === 'User not found' ? 'User not found. Please check the code.' : result.error);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    
    // Auto-prefix if user just types the ID part
    let code = manualCode.trim();
    if (code.startsWith('EP-')) {
      code = code.substring(3);
    }

    setShowScanModal(false);
    setManualCode('');
    
    const result = await addFriend(code);
    
    if (result.friend) {
      if (result.error === 'already_friends') {
        setSelectedFriend(result.friend);
      } else {
        setNewFriend(result.friend);
      }
    } else if (result.error) {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <TouchableOpacity onPress={startScan} style={styles.addFriendBtn}>
          <Ionicons name="person-add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Consent Notice if not accepted */}
        {!player.leaderboardVisible && (
          <TouchableOpacity 
            style={styles.consentBanner}
            onPress={() => setShowConsentModal(true)}
          >
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <View style={styles.consentBannerText}>
              <Text style={styles.consentBannerTitle}>Join Leaderboard</Text>
              <Text style={styles.consentBannerSub}>Tap here to participate</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
        )}

        {/* My Score Card */}
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
            <Text style={styles.rankXP}>{player.score || 0} Points</Text>
            <Text style={styles.rankLevel}>{player.totalQuestsCompleted || 0} Quests</Text>
          </View>
        </LinearGradient>

        <div style={{height: 15}}></div>

        {/* Leaderboard - only show if consent given */}
        {player.leaderboardVisible ? (
          <LiveLeaderboard
            data={friendsLeaderboard}
            myRank={myFriendsRank}
            friendsOnly={true}
            onRefresh={refreshLeaderboard}
            isLoading={isRefreshing}
            title="Leaderboard"
          />
        ) : (
          <View style={styles.lockedLeaderboard}>
            <Ionicons name="lock-closed" size={48} color={COLORS.text.muted} />
            <Text style={styles.lockedText}>Leaderboard Locked</Text>
            <Text style={styles.lockedSubtext}>Accept the privacy policy to see other players</Text>
            <TouchableOpacity 
              style={styles.unlockBtn}
              onPress={() => setShowConsentModal(true)}
            >
              <Text style={styles.unlockBtnText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        )}

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
              <TouchableOpacity 
                key={friend.id} 
                style={styles.friendItem}
                onPress={() => setSelectedFriend(friend)}
                activeOpacity={0.7}
              >
                {/* Avatar with Team Color Border */}
                <View style={[
                  styles.friendAvatar,
                  friend.team && TEAMS[friend.team] && {
                    borderWidth: 2,
                    borderColor: TEAMS[friend.team].color,
                  }
                ]}>
                  <Text style={styles.friendInitial}>
                    {(friend.display_name || friend.username || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                {/* Friend Info */}
                <View style={styles.friendInfo}>
                  <View style={styles.friendNameRow}>
                    <Text style={styles.friendName}>
                      {friend.display_name || friend.username}
                    </Text>
                    {/* Team Icon */}
                    {friend.team && TEAMS[friend.team] && (
                      <Ionicons 
                        name={TEAMS[friend.team].icon} 
                        size={14} 
                        color={TEAMS[friend.team].color} 
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                  <Text style={styles.friendLevel}>{friend.score || 0} Points</Text>
                </View>
                
                {/* Arrow indicator */}
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Consent Modal */}
      <Modal visible={showConsentModal} animationType="fade" transparent>
        <View style={styles.consentModalOverlay}>
          <View style={styles.consentModal}>
            <View style={styles.consentIcon}>
              <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.consentTitle}>Join Leaderboard</Text>
            <Text style={styles.consentText}>
              To participate in the leaderboard and see other players, we need to share the following data:
            </Text>
            <View style={styles.consentList}>
              <View style={styles.consentListItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.consentListText}>Your display name</Text>
              </View>
              <View style={styles.consentListItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.consentListText}>Your score</Text>
              </View>
              <View style={styles.consentListItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.consentListText}>Your bio (if available)</Text>
              </View>
            </View>
            <View style={styles.consentButtons}>
              <TouchableOpacity 
                style={styles.consentCancelBtn}
                onPress={() => setShowConsentModal(false)}
              >
                <Text style={styles.consentCancelText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.consentAcceptBtn}
                onPress={handleAcceptConsent}
              >
                <Text style={styles.consentAcceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        {Platform.OS === 'web' && UniversalQRScanner ? (
          // Web: Use UniversalQRScanner with built-in fallback
          <UniversalQRScanner
            onScan={handleBarCodeScanned}
            onClose={() => setShowScanModal(false)}
          />
        ) : (
          // Native: Use CameraView
          <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.scanModal}
          >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}}>
            {permission?.granted ? (
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
                <Ionicons name="camera-off" size={48} color={COLORS.text.muted} style={{ marginBottom: 16 }} />
                <Text style={{color: '#FFF', marginBottom: 20, textAlign: 'center', paddingHorizontal: 40}}>
                  Camera permission denied. Please enable camera access in your settings.
                </Text>
              </View>
            )}

            {/* Manual Entry Section (Native only) */}
            <View style={styles.manualEntryContainer}>
              <Text style={styles.manualEntryTitle}>Or enter code manually</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="EP-XXXX..."
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
        )}
      </Modal>

      {/* Friend Added Success Modal */}
      <Modal visible={!!newFriend} animationType="fade" transparent>
        <View style={styles.friendModalOverlay}>
          <View style={styles.friendModal}>
            <View style={styles.friendModalHeader}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              <Text style={styles.friendModalTitle}>Friend Added!</Text>
            </View>
            
            {newFriend && (
              <>
                {/* Friend Avatar with Team Color */}
                <View style={[
                  styles.friendModalAvatar,
                  { borderColor: TEAMS[newFriend.team]?.color || COLORS.primary }
                ]}>
                  <Text style={styles.friendModalAvatarText}>
                    {(newFriend.display_name || newFriend.username || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                {/* Friend Name */}
                <Text style={styles.friendModalName}>
                  {newFriend.display_name || newFriend.username}
                </Text>
                
                {/* Team Badge */}
                {newFriend.team && TEAMS[newFriend.team] && (
                  <View style={[styles.teamBadge, { backgroundColor: TEAMS[newFriend.team].bgColor }]}>
                    <Ionicons name={TEAMS[newFriend.team].icon} size={16} color={TEAMS[newFriend.team].color} />
                    <Text style={[styles.teamBadgeText, { color: TEAMS[newFriend.team].color }]}>
                      {TEAMS[newFriend.team].name}
                    </Text>
                  </View>
                )}
                
                {/* Bio Preview */}
                {newFriend.bio && (
                  <Text style={styles.friendModalBio} numberOfLines={2}>
                    "{newFriend.bio}"
                  </Text>
                )}
                
                {/* LinkedIn Button */}
                {newFriend.linkedin_url && (
                  <TouchableOpacity 
                    style={styles.linkedinBtn}
                    onPress={() => Linking.openURL(newFriend.linkedin_url)}
                  >
                    <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                    <Text style={styles.linkedinBtnText}>View LinkedIn</Text>
                  </TouchableOpacity>
                )}
                
                {/* Score */}
                <Text style={styles.friendModalScore}>
                  {newFriend.score || 0} Points
                </Text>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.friendModalCloseBtn}
              onPress={() => setNewFriend(null)}
            >
              <Text style={styles.friendModalCloseBtnText}>Great!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Friend Profile Modal */}
      <Modal visible={!!selectedFriend} animationType="slide" transparent>
        <View style={styles.friendModalOverlay}>
          <View style={styles.friendProfileModal}>
            <TouchableOpacity 
              style={styles.friendProfileClose}
              onPress={() => setSelectedFriend(null)}
            >
              <Ionicons name="close" size={24} color={COLORS.text.muted} />
            </TouchableOpacity>
            
            {selectedFriend && (
              <>
                {/* Header with Team Color */}
                <LinearGradient
                  colors={[
                    TEAMS[selectedFriend.team]?.color || COLORS.primary,
                    TEAMS[selectedFriend.team]?.darkColor || COLORS.primary,
                  ]}
                  style={styles.friendProfileHeader}
                >
                  <View style={styles.friendProfileAvatarLarge}>
                    <Text style={styles.friendProfileAvatarText}>
                      {(selectedFriend.display_name || selectedFriend.username || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  
                  <Text style={styles.friendProfileName}>
                    {selectedFriend.display_name || selectedFriend.username}
                  </Text>
                  
                  {selectedFriend.team && TEAMS[selectedFriend.team] && (
                    <View style={styles.teamBadgeWhite}>
                      <Ionicons name={TEAMS[selectedFriend.team].icon} size={14} color="#FFF" />
                      <Text style={styles.teamBadgeWhiteText}>{TEAMS[selectedFriend.team].name}</Text>
                    </View>
                  )}
                </LinearGradient>
                
                {/* Profile Content */}
                <View style={styles.friendProfileContent}>
                  {/* Bio */}
                  {selectedFriend.bio ? (
                    <View style={styles.friendProfileSection}>
                      <Text style={styles.friendProfileSectionTitle}>About</Text>
                      <Text style={styles.friendProfileBio}>{selectedFriend.bio}</Text>
                    </View>
                  ) : null}
                  
                  {/* Stats */}
                  <View style={styles.friendProfileStats}>
                    <View style={styles.friendProfileStat}>
                      <Text style={styles.friendProfileStatValue}>{selectedFriend.score || 0}</Text>
                      <Text style={styles.friendProfileStatLabel}>Points</Text>
                    </View>
                  </View>
                  
                  {/* LinkedIn */}
                  {selectedFriend.linkedin_url && (
                    <TouchableOpacity 
                      style={styles.linkedinBtnLarge}
                      onPress={() => Linking.openURL(selectedFriend.linkedin_url)}
                    >
                      <Ionicons name="logo-linkedin" size={24} color="#FFF" />
                      <Text style={styles.linkedinBtnLargeText}>View LinkedIn Profile</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  addFriendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },

  // Consent Banner
  consentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 12,
  },
  consentBannerText: {
    flex: 1,
  },
  consentBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  consentBannerSub: {
    fontSize: 12,
    color: COLORS.text.muted,
  },

  // Locked Leaderboard
  lockedLeaderboard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  lockedText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 16,
  },
  lockedSubtext: {
    fontSize: 14,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  unlockBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  unlockBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    marginTop: 16,
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
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // Consent Modal
  consentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  consentModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  consentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(232, 184, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  consentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  consentText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  consentList: {
    width: '100%',
    marginBottom: 24,
  },
  consentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  consentListText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  consentButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  consentCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  consentCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  consentAcceptBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  consentAcceptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
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

  // Friend Added Modal
  friendModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  friendModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  friendModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  friendModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 12,
  },
  friendModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  friendModalAvatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  friendModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 12,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  teamBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  friendModalBio: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  friendModalScore: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginTop: 12,
  },
  linkedinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10, 102, 194, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  linkedinBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A66C2',
  },
  friendModalCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
  },
  friendModalCloseBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },

  // Friend Profile Modal
  friendProfileModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  friendProfileClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  friendProfileHeader: {
    padding: 32,
    alignItems: 'center',
  },
  friendProfileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  friendProfileAvatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
  },
  friendProfileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 12,
  },
  teamBadgeWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  teamBadgeWhiteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  friendProfileContent: {
    padding: 24,
  },
  friendProfileSection: {
    marginBottom: 20,
  },
  friendProfileSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  friendProfileBio: {
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  friendProfileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  friendProfileStat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  friendProfileStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  friendProfileStatLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  linkedinBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0A66C2',
    paddingVertical: 14,
    borderRadius: 14,
  },
  linkedinBtnLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default SocialScreen;

