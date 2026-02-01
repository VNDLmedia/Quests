import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Platform,
  Dimensions,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components';
import QuestCreationModal from '../components/QuestCreationModal';
import { useGame } from '../game/GameProvider';

// Safe imports - verhindert Crashes
let UniversalQRScanner = null;
try {
  if (Platform.OS === 'web') {
    UniversalQRScanner = require('../components/UniversalQRScanner').default;
  }
} catch (error) {
  console.error('Error loading UniversalQRScanner:', error);
}
import { LEVEL_CONFIG } from '../game/config/rewards';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme';
import PackShopScreen from './PackShopScreen';

const { width } = Dimensions.get('window');

const UserScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, player, signOut } = useGame();
  const [showQR, setShowQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showQuestCreation, setShowQuestCreation] = useState(false);
  
  // Dynamischer Import für Native Camera
  const [CameraView, setCameraView] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const loadCamera = async () => {
        try {
          const camera = await import('expo-camera');
          setCameraView(() => camera.CameraView);
          const { status } = await camera.Camera.requestCameraPermissionsAsync();
          setCameraPermission(status === 'granted');
        } catch (e) {
          console.log('Camera not available');
        }
      };
      loadCamera();
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const startScan = async () => {
    if (Platform.OS === 'web') {
      setIsScanning(true);
    } else {
      if (!cameraPermission) {
        Alert.alert('Permission required', 'Camera permission is required for scanning.');
        return;
      }
      setIsScanning(true);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setIsScanning(false);
    Alert.alert('Gescannt!', `Daten: ${data}`);
  };

  // Calculate XP progress using LEVEL_CONFIG
  const currentXP = player.xp || 0;
  const currentLevel = player.level || 1;
  const xpForCurrentLevel = LEVEL_CONFIG.getXPForLevel(currentLevel - 1);
  const xpForNextLevel = LEVEL_CONFIG.getXPForLevel(currentLevel);
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = LEVEL_CONFIG.getLevelProgress(currentXP);

  const memberId = `EP-${player.username?.slice(0, 4)?.toUpperCase() || 'USER'}-${player.id?.slice(0, 4) || '0000'}`;
  const cardWidth = Math.min(width - 40, 380);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <div style={{height: 30}}></div>
        {/* MEMBER CARD */}
        <TouchableOpacity 
          style={styles.cardContainer} 
          activeOpacity={0.95} 
          onPress={() => setShowQR(true)}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#9333EA']}
            style={[styles.memberCard, { width: cardWidth }]}
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
          >
            {/* Card Pattern */}
            <View style={styles.cardPattern}>
              <View style={[styles.patternCircle, { top: -40, right: -40 }]} />
              <View style={[styles.patternCircle, { bottom: -60, left: -30, width: 150, height: 150 }]} />
            </View>
            
            {/* Card Top */}
            <View style={styles.cardTop}>
              <View style={styles.cardLogo}>
                <Ionicons name="compass" size={20} color="#FFF" />
                <Text style={styles.cardBrand}>Ethernal Paths</Text>
              </View>
              <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.5)" />
            </View>
            
            {/* Mini QR */}
            <View style={styles.miniQR}>
              <QRCode value={memberId} size={44} color="#000" backgroundColor="#FFF" />
            </View>
            
            {/* Card Bottom */}
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardLabel}>MEMBER</Text>
                <Text style={styles.cardValue}>{(player.displayName || player.username || 'User').toUpperCase()}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardLabel}>ID</Text>
                <Text style={styles.cardValue}>{memberId}</Text>
              </View>
            </View>
            
            {/* Level Badge */}
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>Level {currentLevel}</Text>
            </View>
          </LinearGradient>
          <View style={[styles.cardShadow, { width: cardWidth - 30 }]} />
        </TouchableOpacity>

        <div style={{height: 30}}></div>

        {/* ADMIN: Quest Creation Button */}
        {player.admin && (
          <View style={styles.adminSection}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setShowQuestCreation(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={COLORS.gradients.gold}
                style={styles.adminButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle" size={24} color={COLORS.text.primary} />
                <Text style={styles.adminButtonText}>Add Quest at Current Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpTitle}>Experience</Text>
            <Text style={styles.xpValue}>{Math.floor(xpInCurrentLevel)} / {xpNeededForNext} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpBarFill, { width: `${xpProgress}%` }]}
            />
          </View>
          <Text style={styles.totalXP}>Total: {player.xp} XP</Text>
        </View>

        <div style={{height: 10}}></div>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => setShowShop(true)}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
              <Ionicons name="gift" size={24} color="#EC4899" />
            </View>
            <Text style={styles.actionLabel}>Shop</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => setShowQR(true)}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(232, 184, 74, 0.1)' }]}>
              <Ionicons name="qr-code" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>My Code</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={startScan}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="scan" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionLabel}>Scan</Text>
          </TouchableOpacity>
        </View>

        <div style={{height: 20}}></div>

        {/* Stats Card */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="trophy" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{player.totalQuestsCompleted || 0}</Text>
              <Text style={styles.statLabel}>Quests</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="flame" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{player.loginStreak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="people" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{player.friendsCount || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="footsteps" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.statValue}>{Math.round(player.totalDistanceWalked || 0)}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
          </View>
        </GlassCard>

        {/* Account Settings */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.accountItem}>
            <Ionicons name="mail-outline" size={20} color={COLORS.text.secondary} />
            <Text style={styles.accountEmail}>{user?.email || 'Not logged in'}</Text>
          </View>
        </GlassCard>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Abmelden</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQR} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowQR(false)}>
              <Ionicons name="close-circle" size={32} color={COLORS.text.muted} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Member Card</Text>
            <Text style={styles.modalSubtitle}>Show this code for scanning</Text>
            
            <View style={styles.qrBox}>
              <QRCode value={memberId} size={200} />
            </View>
            
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{player.displayName || player.username || 'User'}</Text>
              <Text style={styles.memberIdText}>{memberId}</Text>
              <View style={styles.memberLevel}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.memberLevelText}>Level {currentLevel}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shop Modal */}
      <Modal visible={showShop} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.shopModalContainer}>
          <View style={styles.shopModalHeader}>
            <Text style={styles.shopModalTitle}>Card Shop</Text>
            <TouchableOpacity onPress={() => setShowShop(false)} style={styles.shopCloseBtn}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          <PackShopScreen />
        </View>
      </Modal>

      {/* Scanner Modal */}
      <Modal visible={isScanning} animationType="slide">
        {Platform.OS === 'web' && UniversalQRScanner ? (
          <UniversalQRScanner onScan={handleBarCodeScanned} onClose={() => setIsScanning(false)} />
        ) : CameraView ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            >
              <View style={styles.cameraOverlay}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsScanning(false)}>
                  <Ionicons name="close-circle" size={48} color="white" />
                </TouchableOpacity>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, {top:0, left:0, borderTopWidth:4, borderLeftWidth:4}]} />
                  <View style={[styles.corner, {top:0, right:0, borderTopWidth:4, borderRightWidth:4}]} />
                  <View style={[styles.corner, {bottom:0, left:0, borderBottomWidth:4, borderLeftWidth:4}]} />
                  <View style={[styles.corner, {bottom:0, right:0, borderBottomWidth:4, borderRightWidth:4}]} />
                </View>
                <Text style={styles.scanText}>Scanning QR code...</Text>
              </View>
            </CameraView>
          </View>
        ) : (
          <View style={styles.noCameraContainer}>
            <Ionicons name="camera-off" size={48} color="#94A3B8" />
            <Text style={styles.noCameraText}>Kamera nicht verfügbar</Text>
            <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsScanning(false)}>
              <Text style={styles.closeCameraBtnText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* Quest Creation Modal (Admin Only) */}
      {player.admin && (
        <QuestCreationModal
          visible={showQuestCreation}
          onClose={() => setShowQuestCreation(false)}
          userId={user?.id}
        />
      )}
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
    paddingBottom: 120,
  },
  
  // Member Card
  cardContainer: { alignItems: 'center', marginBottom: 24 },
  memberCard: {
    height: 200,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    zIndex: 10,
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBrand: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  miniQR: { 
    alignSelf: 'flex-end', 
    padding: 6, 
    backgroundColor: '#FFF', 
    borderRadius: 10,
    ...SHADOWS.sm,
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardRight: { alignItems: 'flex-end' },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', marginBottom: 2, letterSpacing: 1 },
  cardValue: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  levelChip: {
    position: 'absolute',
    top: 20,
    right: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelChipText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardShadow: {
    position: 'absolute',
    top: 15,
    height: 200,
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    opacity: 0.3,
    zIndex: 1,
    transform: [{ translateY: 8 }],
  },

  // XP Section
  xpSection: { marginBottom: 24 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text.primary },
  xpValue: { ...TYPOGRAPHY.small, color: COLORS.text.secondary },
  xpBar: { height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden', marginBottom: 4, borderWidth: 1, borderColor: COLORS.borderLight },
  xpBarFill: { height: '100%', borderRadius: 4 },
  totalXP: { ...TYPOGRAPHY.caption, color: COLORS.text.muted, textAlign: 'right' },

  // Actions Row
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  actionCard: { alignItems: 'center', gap: 8 },
  actionIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text.primary },

  // Cards
  card: {
    marginBottom: 16,
    padding: 20,
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
    marginBottom: 16,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
  },

  // Account
  accountItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountEmail: { ...TYPOGRAPHY.body, color: COLORS.text.primary },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 8,
  },
  logoutText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.error,
    marginLeft: 8,
  },

  // QR Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrModal: { backgroundColor: COLORS.surface, borderRadius: 28, padding: 28, alignItems: 'center', width: '100%', maxWidth: 340, borderWidth: 1, borderColor: COLORS.borderLight },
  modalClose: { position: 'absolute', top: 16, right: 16 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: COLORS.text.secondary, marginBottom: 24 },
  qrBox: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 24 },
  memberInfo: { alignItems: 'center' },
  memberName: { fontSize: 18, fontWeight: '700', color: COLORS.text.primary },
  memberIdText: { fontSize: 14, color: COLORS.text.secondary, marginTop: 4, letterSpacing: 1 },
  memberLevel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  memberLevelText: { fontSize: 13, fontWeight: '600', color: '#F59E0B' },

  // Shop Modal
  // Admin Section
  adminSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  adminButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  adminButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  shopModalContainer: { flex: 1, backgroundColor: COLORS.background },
  shopModalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  shopModalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary },
  shopCloseBtn: { padding: 8 },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  closeButton: { position: 'absolute', top: 60, right: 20 },
  scanFrame: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#4F46E5' },
  scanText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginTop: 30 },
  noCameraContainer: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  noCameraText: { color: '#FFF', fontSize: 18, marginTop: 20 },
  closeCameraBtn: { marginTop: 30, backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  closeCameraBtnText: { color: '#FFF', fontWeight: '600' },
});

export default UserScreen;
