import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  RefreshControl, 
  Modal, 
  TouchableOpacity, 
  Alert, 
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuests, usePlayer } from '../game/hooks';
import { QuestCard, Skeleton, StreakBanner, ScreenHeader } from '../components';
import { COLORS, SHADOWS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../game/services/LocationService';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');

const QuestLogScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { 
    activeQuests, 
    daily, 
    story, 
    challenges, 
    social, 
    updateProgress, 
    completeQuest,
    stats
  } = useQuests();
  
  const { xp, level, levelProgress, xpForNextLevel } = usePlayer();
  
  const [isLoading, setIsLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(null);
  const [scanningQuest, setScanningQuest] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const handleLocationCheck = async (quest) => {
    if (!quest.location) return;
    setCheckingLocation(quest.id);

    try {
      const location = await LocationService.getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Could not fetch your location. Please try again.');
        setCheckingLocation(null);
        return;
      }

      const isAtLocation = LocationService.isAtLocation(quest.location);
      
      if (isAtLocation) {
        updateProgress(quest.id, quest.progress + 1);
        Alert.alert('Success!', `You are at ${quest.location}!`);
      } else {
        const distance = LocationService.getDistanceTo(quest.location);
        Alert.alert(
          'Not here yet', 
          `You are ${Math.round(distance)}m away from the target.`
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while checking location.');
    } finally {
      setCheckingLocation(null);
    }
  };

  const handleScanAction = async (quest) => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Scanning is not fully supported on web in this demo.');
      return;
    }

    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to scan.');
        return;
      }
    }
    setScanningQuest(quest);
  };

  const handleBarCodeScanned = ({ data }) => {
    if (!scanningQuest) return;
    setScanningQuest(null);
    updateProgress(scanningQuest.id, scanningQuest.target);
    Alert.alert('Quest Updated', `Scanned: ${data}`);
  };

  const renderSection = (title, data, color) => {
    if (!data || data.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          <View style={[styles.countBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.countText, { color }]}>{data.length}</Text>
          </View>
        </View>
        {data.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onAction={() => {
              if (quest.type === 'location') handleLocationCheck(quest);
              if (quest.type === 'social' || quest.requiresScan) handleScanAction(quest);
            }}
            actionLabel={quest.type === 'location' ? 'Check Location' : 'Scan'}
            isActionLoading={checkingLocation === quest.id}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {/* Hero Stats Card */}
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroLabel}>Current Status</Text>
              <Text style={styles.heroTitle}>Level {level}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{xpForNextLevel - xp} XP to go</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.dailyCompleted || 0}/3</Text>
              <Text style={styles.statLabel}>Daily Goals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeQuests.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{xp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ height: 24 }} />

        {activeQuests.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="map" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyText}>No active quests</Text>
            <Text style={styles.emptySub}>Explore the map to find new adventures or wait for daily reset!</Text>
            <TouchableOpacity 
              style={[styles.refreshBtn, isLoading && styles.refreshBtnDisabled]} 
              onPress={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.refreshBtnText}>Check for New Quests</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderSection('Daily Missions', daily, '#F59E0B')}
            {renderSection('Story Progression', story, '#8B5CF6')}
            {renderSection('Challenges', challenges, '#EC4899')}
            {renderSection('Social', social, '#3B82F6')}
          </>
        )}
      </ScrollView>

      {/* Simple Camera Modal for Quests */}
      <Modal visible={!!scanningQuest} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>Scan Quest Code</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setScanningQuest(null)}>
                <Ionicons name="close" size={32} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.scanFrame} />
            </View>
          </CameraView>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.md,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  levelText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: COLORS.text.primary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySub: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  refreshBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    ...SHADOWS.md,
  },
  refreshBtnDisabled: {
    opacity: 0.8,
  },
  refreshBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 60,
    position: 'absolute',
    top: 0,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});

export default QuestLogScreen;
