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
  TouchableWithoutFeedback
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

const SocialScreen = () => {
  const insets = useSafeAreaInsets();
  const { 
    player, 
    friends, 
    addFriend,
    updateProfile,
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
  
  const [permission, requestPermission] = useCameraPermissions();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshLeaderboard();
    setIsRefreshing(false);
  };
  
  const handleAcceptConsent = async () => {
    await updateProfile({ leaderboardVisible: true });
    setShowConsentModal(false);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Rangliste</Text>
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
              <Text style={styles.consentBannerTitle}>Rangliste beitreten</Text>
              <Text style={styles.consentBannerSub}>Tippe hier um teilzunehmen</Text>
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
            <Text style={styles.rankLabel}>Dein Rang</Text>
            <Text style={styles.rankNumber}>#{myFriendsRank || '-'}</Text>
          </View>
          <View style={styles.rankRight}>
            <Text style={styles.rankXP}>{player.score || 0} Punkte</Text>
            <Text style={styles.rankLevel}>{player.totalQuestsCompleted || 0} Quests</Text>
          </View>
        </LinearGradient>

        {/* Leaderboard - only show if consent given */}
        {player.leaderboardVisible ? (
          <LiveLeaderboard
            data={friendsLeaderboard}
            myRank={myFriendsRank}
            friendsOnly={true}
            onRefresh={refreshLeaderboard}
            isLoading={isRefreshing}
            title="Rangliste"
          />
        ) : (
          <View style={styles.lockedLeaderboard}>
            <Ionicons name="lock-closed" size={48} color={COLORS.text.muted} />
            <Text style={styles.lockedText}>Rangliste gesperrt</Text>
            <Text style={styles.lockedSubtext}>Akzeptiere die Datenschutzrichtlinie um andere Spieler zu sehen</Text>
            <TouchableOpacity 
              style={styles.unlockBtn}
              onPress={() => setShowConsentModal(true)}
            >
              <Text style={styles.unlockBtnText}>Freischalten</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Friends List */}
        <View style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Freunde ({friends.length})</Text>
            <TouchableOpacity onPress={startScan}>
              <Text style={styles.sectionAction}>+ Hinzufügen</Text>
            </TouchableOpacity>
          </View>
          
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.text.muted} />
              <Text style={styles.emptyText}>Noch keine Freunde</Text>
              <Text style={styles.emptySubtext}>Scanne einen QR-Code um Freunde hinzuzufügen</Text>
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
                  <Text style={styles.friendLevel}>{friend.score || 0} Punkte</Text>
                </View>
              </View>
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
            <Text style={styles.consentTitle}>Rangliste beitreten</Text>
            <Text style={styles.consentText}>
              Um an der Rangliste teilzunehmen und andere Spieler zu sehen, müssen wir folgende Daten mit anderen teilen:
            </Text>
            <View style={styles.consentList}>
              <View style={styles.consentListItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.consentListText}>Dein Anzeigename</Text>
              </View>
              <View style={styles.consentListItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.consentListText}>Dein Score</Text>
              </View>
              <View style={styles.consentListItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.consentListText}>Deine Bio (wenn vorhanden)</Text>
              </View>
            </View>
            <View style={styles.consentButtons}>
              <TouchableOpacity 
                style={styles.consentCancelBtn}
                onPress={() => setShowConsentModal(false)}
              >
                <Text style={styles.consentCancelText}>Später</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.consentAcceptBtn}
                onPress={handleAcceptConsent}
              >
                <Text style={styles.consentAcceptText}>Akzeptieren</Text>
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
    padding: 40,
    alignItems: 'center',
    marginVertical: 16,
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

