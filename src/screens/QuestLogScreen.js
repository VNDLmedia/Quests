import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { QuestCard, Skeleton, StreakBanner, ScreenHeader, EventChallengeCard } from '../components';
import { COLORS, SHADOWS, PALETTE } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../game/services/LocationService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { EVENT_CHALLENGES, getChallengesWithProgress, CHALLENGE_TIERS } from '../game/config/challenges';

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
    stats,
    completedQuests
  } = useQuests();
  
  const { xp, level, levelProgress, xpForNextLevel, playerStats } = usePlayer();
  
  const [isLoading, setIsLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(null);
  const [scanningQuest, setScanningQuest] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('quests'); // 'quests' oder 'challenges'
  const [claimedChallenges, setClaimedChallenges] = useState([]);
  const [expandedChallenge, setExpandedChallenge] = useState(null);

  // Event Challenges mit Fortschritt berechnen
  const eventChallenges = useMemo(() => {
    const playerData = {
      totalCompleted: (stats?.totalCompleted || 0) + (completedQuests?.length || 0),
      friendCount: playerStats?.friendCount || 0,
      friendTeams: playerStats?.friendTeams || [],
      workshopVisited: playerStats?.workshopVisited || false,
      currentStreak: playerStats?.currentStreak || 0,
      uniqueCards: playerStats?.uniqueCards || 0,
    };
    return getChallengesWithProgress(playerData);
  }, [stats, completedQuests, playerStats]);

  // Fortschritts-Statistiken für Challenges
  const challengeStats = useMemo(() => {
    const completed = eventChallenges.filter(c => c.isCompleted).length;
    const inProgress = eventChallenges.filter(c => c.currentProgress > 0 && !c.isCompleted).length;
    return { completed, inProgress, total: eventChallenges.length };
  }, [eventChallenges]);

  const handleClaimChallenge = (challenge) => {
    if (claimedChallenges.includes(challenge.id)) return;
    
    setClaimedChallenges(prev => [...prev, challenge.id]);
    
    // XP hinzufügen
    // dispatch({ type: 'ADD_XP', payload: challenge.xpReward });
    
    // Belohnungsanzeige
    if (challenge.reward?.claimLocation) {
      Alert.alert(
        '🎉 Challenge abgeschlossen!',
        `Du hast +${challenge.xpReward} XP erhalten!\n\nHole deine ${challenge.reward?.type === 'physical_card' ? 'echte Sammelkarte' : 'Belohnung'} ab:\n📍 ${challenge.reward.claimLocation}`,
        [{ text: 'Verstanden!' }]
      );
    } else {
      Alert.alert(
        '🎉 Challenge abgeschlossen!',
        `Du hast +${challenge.xpReward} XP erhalten!`,
        [{ text: 'Super!' }]
      );
    }
  };

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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {/* Hero Stats Card */}
        <LinearGradient
          colors={COLORS.gradients.gold}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroLabel}>Aktueller Status</Text>
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
              <Text style={styles.statLabel}>Aktiv</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{challengeStats.completed}/{challengeStats.total}</Text>
              <Text style={styles.statLabel}>Challenges</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'quests' && styles.tabActive]}
            onPress={() => setActiveTab('quests')}
          >
            <Ionicons 
              name="map" 
              size={18} 
              color={activeTab === 'quests' ? COLORS.primary : COLORS.text.muted} 
            />
            <Text style={[styles.tabText, activeTab === 'quests' && styles.tabTextActive]}>
              Quests
            </Text>
            {activeQuests.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'quests' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'quests' && styles.tabBadgeTextActive]}>
                  {activeQuests.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'challenges' && styles.tabActive]}
            onPress={() => setActiveTab('challenges')}
          >
            <Ionicons 
              name="trophy" 
              size={18} 
              color={activeTab === 'challenges' ? COLORS.primary : COLORS.text.muted} 
            />
            <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
              Challenges
            </Text>
            {challengeStats.completed > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: '#10B981' + '30' }]}>
                <Text style={[styles.tabBadgeText, { color: '#10B981' }]}>
                  {challengeStats.completed}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeTab === 'quests' ? (
          // === QUESTS TAB ===
          activeQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="map" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>Keine aktiven Quests</Text>
              <Text style={styles.emptySub}>Erkunde die Karte um neue Abenteuer zu finden oder warte auf den täglichen Reset!</Text>
              <TouchableOpacity 
                style={[styles.refreshBtn, isLoading && styles.refreshBtnDisabled]} 
                onPress={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.text.primary} />
                ) : (
                  <Text style={styles.refreshBtnText}>Nach Quests suchen</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {renderSection('Tägliche Missionen', daily, COLORS.primary)}
              {renderSection('Story', story, '#9B59B6')}
              {renderSection('Challenges', challenges, '#EC4899')}
              {renderSection('Social', social, COLORS.secondary)}
            </>
          )
        ) : (
          // === CHALLENGES TAB ===
          <View style={styles.challengesContainer}>
            {/* Challenge Info Banner */}
            <LinearGradient
              colors={['#EC4899', '#8B5CF6']}
              style={styles.challengeInfoBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.challengeInfoContent}>
                <Ionicons name="trophy" size={24} color="#FFF" />
                <View style={styles.challengeInfoText}>
                  <Text style={styles.challengeInfoTitle}>Event Challenges</Text>
                  <Text style={styles.challengeInfoSub}>
                    Schließe Challenges ab für echte Belohnungen!
                  </Text>
                </View>
              </View>
              <View style={styles.challengeInfoStats}>
                <View style={styles.challengeInfoStat}>
                  <Text style={styles.challengeInfoStatValue}>{challengeStats.completed}</Text>
                  <Text style={styles.challengeInfoStatLabel}>Fertig</Text>
                </View>
                <View style={styles.challengeInfoDivider} />
                <View style={styles.challengeInfoStat}>
                  <Text style={styles.challengeInfoStatValue}>{challengeStats.inProgress}</Text>
                  <Text style={styles.challengeInfoStatLabel}>Aktiv</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Featured Challenge (nächste fast fertig) */}
            {(() => {
              const nearComplete = eventChallenges
                .filter(c => !c.isCompleted && c.currentProgress > 0)
                .sort((a, b) => (b.currentProgress / b.target) - (a.currentProgress / a.target))[0];
              
              if (nearComplete) {
                return (
                  <View style={styles.featuredSection}>
                    <View style={styles.featuredHeader}>
                      <Ionicons name="flame" size={18} color="#F59E0B" />
                      <Text style={styles.featuredTitle}>Fast geschafft!</Text>
                    </View>
                    <EventChallengeCard
                      challenge={nearComplete}
                      currentProgress={nearComplete.currentProgress}
                      onPress={() => setExpandedChallenge(nearComplete)}
                      onClaim={() => handleClaimChallenge(nearComplete)}
                      isClaimed={claimedChallenges.includes(nearComplete.id)}
                    />
                  </View>
                );
              }
              return null;
            })()}

            {/* Alle Challenges */}
            <View style={styles.allChallengesSection}>
              <Text style={styles.allChallengesTitle}>Alle Challenges</Text>
              
              {/* Abholbare Challenges (completed, not claimed) */}
              {eventChallenges.filter(c => c.isCompleted && !claimedChallenges.includes(c.id)).length > 0 && (
                <View style={styles.challengeGroup}>
                  <View style={styles.challengeGroupHeader}>
                    <Ionicons name="gift" size={16} color="#10B981" />
                    <Text style={[styles.challengeGroupTitle, { color: '#10B981' }]}>
                      Belohnung abholen
                    </Text>
                  </View>
                  {eventChallenges
                    .filter(c => c.isCompleted && !claimedChallenges.includes(c.id))
                    .map(challenge => (
                      <EventChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        currentProgress={challenge.currentProgress}
                        onPress={() => setExpandedChallenge(challenge)}
                        onClaim={() => handleClaimChallenge(challenge)}
                        isClaimed={false}
                      />
                    ))
                  }
                </View>
              )}

              {/* Aktive Challenges */}
              <View style={styles.challengeGroup}>
                <View style={styles.challengeGroupHeader}>
                  <Ionicons name="flash" size={16} color={COLORS.primary} />
                  <Text style={styles.challengeGroupTitle}>In Bearbeitung</Text>
                </View>
                {eventChallenges
                  .filter(c => !c.isCompleted)
                  .map(challenge => (
                    <EventChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentProgress={challenge.currentProgress}
                      onPress={() => setExpandedChallenge(challenge)}
                      onClaim={() => handleClaimChallenge(challenge)}
                      isClaimed={claimedChallenges.includes(challenge.id)}
                      style={{ marginBottom: 12 }}
                    />
                  ))
                }
              </View>

              {/* Abgeschlossene Challenges */}
              {eventChallenges.filter(c => c.isCompleted && claimedChallenges.includes(c.id)).length > 0 && (
                <View style={styles.challengeGroup}>
                  <View style={styles.challengeGroupHeader}>
                    <Ionicons name="checkmark-done-circle" size={16} color={COLORS.text.muted} />
                    <Text style={[styles.challengeGroupTitle, { color: COLORS.text.muted }]}>
                      Abgeschlossen
                    </Text>
                  </View>
                  {eventChallenges
                    .filter(c => c.isCompleted && claimedChallenges.includes(c.id))
                    .map(challenge => (
                      <EventChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        currentProgress={challenge.currentProgress}
                        compact
                        isClaimed={true}
                      />
                    ))
                  }
                </View>
              )}
            </View>
          </View>
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  levelBadge: {
    backgroundColor: 'rgba(13,27,42,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(13,27,42,0.2)',
  },
  levelText: {
    color: COLORS.text.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13,27,42,0.1)',
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
    color: COLORS.text.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(13,27,42,0.15)',
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
    fontWeight: '700',
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
    backgroundColor: PALETTE.gold.glow,
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
    ...SHADOWS.glow,
  },
  refreshBtnDisabled: {
    opacity: 0.8,
  },
  refreshBtnText: {
    color: COLORS.text.primary,
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

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 4,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
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
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary + '30',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.muted,
  },
  tabBadgeTextActive: {
    color: COLORS.primary,
  },

  // Challenges Container
  challengesContainer: {
    gap: 16,
  },
  challengeInfoBanner: {
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.md,
  },
  challengeInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  challengeInfoText: {
    flex: 1,
  },
  challengeInfoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  challengeInfoSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  challengeInfoStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  challengeInfoStat: {
    alignItems: 'center',
  },
  challengeInfoStatValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  challengeInfoStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Featured Challenge
  featuredSection: {
    gap: 10,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },

  // All Challenges Section
  allChallengesSection: {
    gap: 16,
  },
  allChallengesTitle: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  challengeGroup: {
    gap: 10,
  },
  challengeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  challengeGroupTitle: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default QuestLogScreen;
