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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuests, usePlayer, useGame, useChallenges, useLeaderboard } from '../game/hooks';
import { QuestCard, Skeleton, StreakBanner, ScreenHeader, EventChallengeCard, ChallengeCreationModal } from '../components';
import { COLORS, SHADOWS, PALETTE } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../game/services/LocationService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getChallengesWithProgress, CHALLENGE_TIERS, fetchChallengeQuests } from '../game/config/challenges';
import { COLLECTIBLE_CARDS } from '../game/config/cardsData';
import GlassCard from '../components/GlassCard';
import LiveLeaderboard from '../components/LiveLeaderboard';

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
  
  const { score, playerStats } = usePlayer();
  const { 
    eventChallenges: dbEventChallenges, 
    userEventChallenges,
    claimEventChallenge,
    player,
    user,
    fetchEventChallenges,
    fetchQuestlineProgress,
    startQuestlineChallenge,
  } = useGame();

  const {
    challenges: challengesWithProgress,
    questlineChallenges,
    getQuestlineDetails,
    startChallenge,
    claimChallenge,
    getChallengeStatus,
    refreshChallenges,
  } = useChallenges();

  const { 
    leaderboard,
    myRank, 
    refresh: refreshLeaderboard,
    isLoadingLeaderboard,
  } = useLeaderboard();
  
  const [isLoading, setIsLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(null);
  const [scanningQuest, setScanningQuest] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('quests'); // 'quests', 'challenges' oder 'leaderboard'
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  const [questlineDetails, setQuestlineDetails] = useState(null);
  const [loadingQuestline, setLoadingQuestline] = useState(false);
  const [showChallengeCreation, setShowChallengeCreation] = useState(false);

  // Event Challenges mit Fortschritt berechnen und mit DB-Status mergen
  const eventChallenges = useMemo(() => {
    // console.log('QuestLogScreen: Computing eventChallenges from', dbEventChallenges.length, 'db challenges');
    
    // Count claimed challenges from database
    const claimedCount = userEventChallenges.filter(uc => uc.status === 'claimed').length;
    
    const playerData = {
      totalCompleted: (stats?.totalCompleted || 0) + (completedQuests?.length || 0),
      friendCount: playerStats?.friendCount || 0,
      friendTeams: playerStats?.friendTeams || [],
      workshopVisited: playerStats?.workshopVisited || false,
      currentStreak: playerStats?.currentStreak || 0,
      uniqueCards: playerStats?.uniqueCards || 0,
      collectedCards: claimedCount, // Anzahl abgeholter Karten aus DB
    };
    
    const challengesWithProgress = getChallengesWithProgress(dbEventChallenges, playerData);
    
    // Merge database completion status
    const result = challengesWithProgress.map(challenge => {
      const userChallenge = userEventChallenges.find(uc => uc.challenge_id === challenge.id);
      return {
        ...challenge,
        isClaimed: userChallenge?.status === 'claimed',
        claimedAt: userChallenge?.claimed_at,
        completedAt: userChallenge?.completed_at,
      };
    });
    
    // console.log('QuestLogScreen: eventChallenges computed:', result.length, 'challenges');
    return result;
  }, [dbEventChallenges, userEventChallenges, stats, completedQuests, playerStats]);

  // Fortschritts-Statistiken für Challenges
  const challengeStats = useMemo(() => {
    const completed = eventChallenges.filter(c => c.isCompleted).length;
    const inProgress = eventChallenges.filter(c => c.currentProgress > 0 && !c.isCompleted).length;
    return { completed, inProgress, total: eventChallenges.length };
  }, [eventChallenges]);

  // Load questline details when a questline challenge is expanded
  const loadQuestlineDetails = useCallback(async (challenge) => {
    if (challenge.challenge_mode !== 'questline') return;
    
    setLoadingQuestline(true);
    try {
      const details = await getQuestlineDetails(challenge.id);
      setQuestlineDetails(details);
    } catch (error) {
      console.error('Error loading questline details:', error);
    } finally {
      setLoadingQuestline(false);
    }
  }, [getQuestlineDetails]);

  // Handle expanding a challenge (load questline details if needed)
  const handleExpandChallenge = useCallback(async (challenge) => {
    setExpandedChallenge(challenge);
    if (challenge.challenge_mode === 'questline') {
      await loadQuestlineDetails(challenge);
    }
  }, [loadQuestlineDetails]);

  // Handle starting a questline challenge
  const handleStartQuestline = useCallback(async (challenge) => {
    setLoadingQuestline(true);
    try {
      const result = await startChallenge(challenge.id);
      if (result.success) {
        Alert.alert(
          'Challenge Started!',
          `You've started "${challenge.title}". Complete the quests in order to finish the challenge!`,
          [{ text: 'Let\'s Go!' }]
        );
        // Reload questline details
        await loadQuestlineDetails(challenge);
        // Refresh challenges
        await refreshChallenges();
      } else {
        Alert.alert('Error', result.error || 'Could not start challenge');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoadingQuestline(false);
    }
  }, [startChallenge, loadQuestlineDetails, refreshChallenges]);

  const handleClaimChallenge = async (challenge) => {
    if (challenge.isClaimed) return;
    
    // Claim challenge in database (pass challenge object for card extraction)
    const result = await claimEventChallenge(
      challenge.id, 
      challenge.xp_reward || challenge.xpReward,
      challenge
    );
    
    if (result.error) {
      Alert.alert('Error', 'Could not claim challenge. Please try again.');
      return;
    }
    
    // Karte aus cardId auflösen
    const card = challenge.reward?.cardId 
      ? COLLECTIBLE_CARDS[challenge.reward.cardId] 
      : null;
    const cardName = card?.name || 'Collectible Card';
    
    // Belohnungsanzeige mit Kartenname
    Alert.alert(
      '🎉 Challenge completed!',
      `You earned ${challenge.xp_reward || challenge.xpReward || 0} points!\n\n🃏 Card unlocked:\n"${cardName}"\n\n📍 Pick up your physical card at:\n${challenge.reward?.claimLocation || 'Info Desk'}`,
      [{ text: 'Got it!' }]
    );
    
    // Close expanded view
    setExpandedChallenge(null);
    setQuestlineDetails(null);
  };

  // Handle challenge creation success
  const handleChallengeCreated = useCallback(async () => {
    await refreshChallenges();
    setShowChallengeCreation(false);
  }, [refreshChallenges]);

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
              <Text style={styles.heroLabel}>Your Progress</Text>
              <Text style={styles.heroTitle}>{score || 0} Points</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{playerStats?.totalCompleted || 0} Quests</Text>
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

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Ionicons 
              name="podium" 
              size={18} 
              color={activeTab === 'leaderboard' ? COLORS.primary : COLORS.text.muted} 
            />
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Ranking
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'leaderboard' ? (
          // === LEADERBOARD TAB ===
          <LiveLeaderboard
            data={leaderboard}
            myRank={myRank}
            isLoading={isLoadingLeaderboard}
          />
        ) : activeTab === 'quests' ? (
          // === QUESTS TAB ===
          activeQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="map" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>No active quests</Text>
              <Text style={styles.emptySub}>Explore the map to find new adventures or wait for the daily reset!</Text>
              <TouchableOpacity 
                style={[styles.refreshBtn, isLoading && styles.refreshBtnDisabled]} 
                onPress={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.text.primary} />
                ) : (
                  <Text style={styles.refreshBtnText}>Search for quests</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {renderSection('Daily Missions', daily, COLORS.primary)}
              {renderSection('Story', story, '#9B59B6')}
              {renderSection('Challenges', challenges, '#EC4899')}
              {renderSection('Social', social, COLORS.secondary)}
            </>
          )
        ) : (
          // === CHALLENGES TAB ===
          <View style={styles.challengesContainer}>
            {/* Admin: Create Challenge Button */}
            {player?.admin && (
              <TouchableOpacity
                style={styles.adminCreateButton}
                onPress={() => setShowChallengeCreation(true)}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                <Text style={styles.adminCreateButtonText}>Create Challenge</Text>
              </TouchableOpacity>
            )}

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
                    Complete challenges for real collectible cards!
                  </Text>
                </View>
              </View>
              <View style={styles.challengeInfoStats}>
                <View style={styles.challengeInfoStat}>
                  <Text style={styles.challengeInfoStatValue}>{challengeStats.completed}</Text>
                  <Text style={styles.challengeInfoStatLabel}>Done</Text>
                </View>
                <View style={styles.challengeInfoDivider} />
                <View style={styles.challengeInfoStat}>
                  <Text style={styles.challengeInfoStatValue}>{challengeStats.inProgress}</Text>
                  <Text style={styles.challengeInfoStatLabel}>Active</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Questline Challenges Section */}
            {questlineChallenges.length > 0 && (
              <View style={styles.challengeGroup}>
                <View style={styles.challengeGroupHeader}>
                  <Ionicons name="git-branch" size={16} color="#8B5CF6" />
                  <Text style={[styles.challengeGroupTitle, { color: '#8B5CF6' }]}>
                    Quest Lines ({questlineChallenges.length})
                  </Text>
                </View>
                {questlineChallenges.map(challenge => (
                  <TouchableOpacity
                    key={challenge.id}
                    style={styles.questlineCard}
                    onPress={() => handleExpandChallenge(challenge)}
                  >
                    <LinearGradient
                      colors={challenge.gradient || ['#8B5CF6', '#7C3AED']}
                      style={styles.questlineGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.questlineIconContainer}>
                        <Ionicons name={challenge.icon || 'git-branch'} size={24} color="#FFF" />
                      </View>
                    </LinearGradient>
                    <View style={styles.questlineContent}>
                      <Text style={styles.questlineTitle}>{challenge.title}</Text>
                      <Text style={styles.questlineDescription}>{challenge.description}</Text>
                      <View style={styles.questlineProgress}>
                        <View style={styles.questlineProgressBar}>
                          <View 
                            style={[
                              styles.questlineProgressFill, 
                              { width: `${(challenge.currentProgress / challenge.target) * 100}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.questlineProgressText}>
                          {challenge.currentProgress}/{challenge.target} Quests
                        </Text>
                      </View>
                    </View>
                    <View style={styles.questlineArrow}>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.text.muted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Featured Challenge (nächste fast fertig) */}
            {(() => {
              const nearComplete = eventChallenges
                .filter(c => !c.isCompleted && c.currentProgress > 0 && c.challenge_mode !== 'questline')
                .sort((a, b) => (b.currentProgress / b.target) - (a.currentProgress / a.target))[0];
              
              if (nearComplete) {
                return (
                  <View style={styles.featuredSection}>
                    <View style={styles.featuredHeader}>
                      <Ionicons name="flame" size={18} color="#F59E0B" />
                      <Text style={styles.featuredTitle}>Almost there!</Text>
                    </View>
                    <EventChallengeCard
                      challenge={nearComplete}
                      currentProgress={nearComplete.currentProgress}
                      onPress={() => handleExpandChallenge(nearComplete)}
                      onClaim={() => handleClaimChallenge(nearComplete)}
                      isClaimed={nearComplete.isClaimed}
                    />
                  </View>
                );
              }
              return null;
            })()}

            {/* Alle Challenges (excluding questlines) */}
            <View style={styles.allChallengesSection}>
              <Text style={styles.allChallengesTitle}>Progress Challenges</Text>
              
              {/* Abholbare Challenges (completed, not claimed) */}
              {eventChallenges.filter(c => c.isCompleted && !c.isClaimed && c.challenge_mode !== 'questline').length > 0 && (
                <View style={styles.challengeGroup}>
                  <View style={styles.challengeGroupHeader}>
                    <Ionicons name="gift" size={16} color="#10B981" />
                    <Text style={[styles.challengeGroupTitle, { color: '#10B981' }]}>
                      Claim reward
                    </Text>
                  </View>
                  {eventChallenges
                    .filter(c => c.isCompleted && !c.isClaimed && c.challenge_mode !== 'questline')
                    .map(challenge => (
                      <EventChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        currentProgress={challenge.currentProgress}
                        onPress={() => handleExpandChallenge(challenge)}
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
                  <Text style={styles.challengeGroupTitle}>In Progress</Text>
                </View>
                {eventChallenges
                  .filter(c => !c.isCompleted && c.challenge_mode !== 'questline')
                  .map(challenge => (
                    <EventChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentProgress={challenge.currentProgress}
                      onPress={() => handleExpandChallenge(challenge)}
                      onClaim={() => handleClaimChallenge(challenge)}
                      isClaimed={challenge.isClaimed}
                      style={{ marginBottom: 12 }}
                    />
                  ))
                }
              </View>

              {/* Completed Challenges */}
              {eventChallenges.filter(c => c.isCompleted && c.isClaimed && c.challenge_mode !== 'questline').length > 0 && (
                <View style={styles.challengeGroup}>
                  <View style={styles.challengeGroupHeader}>
                    <Ionicons name="checkmark-done-circle" size={16} color={COLORS.text.muted} />
                    <Text style={[styles.challengeGroupTitle, { color: COLORS.text.muted }]}>
                      Completed
                    </Text>
                  </View>
                  {eventChallenges
                    .filter(c => c.isCompleted && c.isClaimed && c.challenge_mode !== 'questline')
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

      {/* Expanded Challenge Modal (for Questlines) */}
      <Modal
        visible={!!expandedChallenge}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setExpandedChallenge(null);
          setQuestlineDetails(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            {expandedChallenge && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setExpandedChallenge(null);
                      setQuestlineDetails(null);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={COLORS.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Challenge Details</Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  {/* Challenge Header */}
                  <LinearGradient
                    colors={expandedChallenge.gradient || ['#8B5CF6', '#7C3AED']}
                    style={styles.modalChallengeHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.modalChallengeIcon}>
                      <Ionicons name={expandedChallenge.icon || 'trophy'} size={40} color="#FFF" />
                    </View>
                    <Text style={styles.modalChallengeTitle}>{expandedChallenge.title}</Text>
                    <Text style={styles.modalChallengeDescription}>
                      {expandedChallenge.long_description || expandedChallenge.longDescription || expandedChallenge.description}
                    </Text>
                    <View style={styles.modalChallengeStats}>
                      <View style={styles.modalChallengeStat}>
                        <Text style={styles.modalChallengeStatValue}>
                          {expandedChallenge.xp_reward || expandedChallenge.xpReward || 0}
                        </Text>
                        <Text style={styles.modalChallengeStatLabel}>XP</Text>
                      </View>
                      <View style={styles.modalChallengeStatDivider} />
                      <View style={styles.modalChallengeStat}>
                        <Text style={styles.modalChallengeStatValue}>
                          {expandedChallenge.currentProgress}/{expandedChallenge.target}
                        </Text>
                        <Text style={styles.modalChallengeStatLabel}>Progress</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Quest Line Details */}
                  {expandedChallenge.challenge_mode === 'questline' && (
                    <View style={styles.questlineSection}>
                      <Text style={styles.questlineSectionTitle}>Quest Sequence</Text>
                      
                      {loadingQuestline ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={COLORS.primary} />
                          <Text style={styles.loadingText}>Loading quests...</Text>
                        </View>
                      ) : questlineDetails?.quests?.length > 0 ? (
                        <View style={styles.questSequence}>
                          {questlineDetails.quests.map((quest, index) => (
                            <View key={quest.quest_id || index} style={styles.questSequenceItem}>
                              <View style={[
                                styles.questSequenceConnector,
                                index === 0 && styles.questSequenceConnectorFirst,
                                index === questlineDetails.quests.length - 1 && styles.questSequenceConnectorLast,
                              ]}>
                                <View style={[
                                  styles.questSequenceDot,
                                  quest.userStatus === 'completed' && styles.questSequenceDotCompleted,
                                  quest.userStatus === 'available' && styles.questSequenceDotAvailable,
                                  quest.userStatus === 'in_progress' && styles.questSequenceDotInProgress,
                                ]} />
                                {index < questlineDetails.quests.length - 1 && (
                                  <View style={[
                                    styles.questSequenceLine,
                                    quest.userStatus === 'completed' && styles.questSequenceLineCompleted,
                                  ]} />
                                )}
                              </View>
                              <View style={[
                                styles.questSequenceCard,
                                quest.userStatus === 'completed' && styles.questSequenceCardCompleted,
                                quest.userStatus === 'locked' && styles.questSequenceCardLocked,
                              ]}>
                                <View style={styles.questSequenceCardHeader}>
                                  <Ionicons 
                                    name={quest.quest_icon || 'compass'} 
                                    size={20} 
                                    color={quest.userStatus === 'locked' ? COLORS.text.muted : COLORS.primary} 
                                  />
                                  <Text style={[
                                    styles.questSequenceCardTitle,
                                    quest.userStatus === 'locked' && styles.questSequenceCardTitleLocked,
                                  ]}>
                                    {quest.quest_title}
                                  </Text>
                                  {quest.userStatus === 'completed' && (
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                  )}
                                  {quest.userStatus === 'locked' && (
                                    <Ionicons name="lock-closed" size={18} color={COLORS.text.muted} />
                                  )}
                                </View>
                                {quest.quest_description && (
                                  <Text style={styles.questSequenceCardDescription}>
                                    {quest.quest_description}
                                  </Text>
                                )}
                                <View style={styles.questSequenceCardMeta}>
                                  <Text style={styles.questSequenceCardXP}>
                                    +{quest.quest_xp_reward || 0} XP
                                  </Text>
                                  {quest.bonus_xp > 0 && (
                                    <Text style={styles.questSequenceCardBonus}>
                                      +{quest.bonus_xp} Bonus
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.noQuestsContainer}>
                          <Text style={styles.noQuestsText}>
                            {getChallengeStatus(expandedChallenge.id) === 'not_started' 
                              ? 'Start this challenge to see the quest sequence!'
                              : 'No quests available'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Reward Section */}
                  <View style={styles.rewardSection}>
                    <Text style={styles.rewardSectionTitle}>Reward</Text>
                    <GlassCard style={styles.rewardCard}>
                      <View style={styles.rewardCardContent}>
                        <Ionicons name="card" size={40} color={COLORS.primary} />
                        <View style={styles.rewardCardText}>
                          <Text style={styles.rewardCardTitle}>Physical Card</Text>
                          <Text style={styles.rewardCardDescription}>
                            {COLLECTIBLE_CARDS[expandedChallenge.reward?.cardId]?.name || 'Collectible Card'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.rewardClaimLocation}>
                        <Ionicons name="location" size={16} color={COLORS.text.muted} />
                        <Text style={styles.rewardClaimLocationText}>
                          {expandedChallenge.reward?.claimLocation || 'Info Desk'}
                        </Text>
                      </View>
                    </GlassCard>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {expandedChallenge.isCompleted && !expandedChallenge.isClaimed ? (
                    <TouchableOpacity
                      style={styles.claimButton}
                      onPress={() => handleClaimChallenge(expandedChallenge)}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.claimButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="gift" size={20} color="#FFF" />
                        <Text style={styles.claimButtonText}>Claim Reward</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : expandedChallenge.challenge_mode === 'questline' && 
                       getChallengeStatus(expandedChallenge.id) === 'not_started' ? (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => handleStartQuestline(expandedChallenge)}
                      disabled={loadingQuestline}
                    >
                      <LinearGradient
                        colors={expandedChallenge.gradient || ['#8B5CF6', '#7C3AED']}
                        style={styles.startButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {loadingQuestline ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="play" size={20} color="#FFF" />
                            <Text style={styles.startButtonText}>Start Challenge</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : expandedChallenge.isClaimed ? (
                    <View style={styles.claimedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      <Text style={styles.claimedBadgeText}>Challenge Completed!</Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Challenge Creation Modal (Admin) */}
      <ChallengeCreationModal
        visible={showChallengeCreation}
        onClose={() => setShowChallengeCreation(false)}
        userId={user?.id}
        onChallengeCreated={handleChallengeCreated}
      />
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

  // Admin Create Button
  adminCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  adminCreateButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Questline Card Styles
  questlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  questlineGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questlineIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  questlineContent: {
    flex: 1,
    marginLeft: 12,
  },
  questlineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  questlineDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  questlineProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questlineProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  questlineProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  questlineProgressText: {
    fontSize: 11,
    color: COLORS.text.muted,
    fontWeight: '600',
  },
  questlineArrow: {
    marginLeft: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  modalScrollView: {
    flex: 1,
  },
  modalChallengeHeader: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  modalChallengeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalChallengeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalChallengeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalChallengeStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 12,
    gap: 24,
  },
  modalChallengeStat: {
    alignItems: 'center',
  },
  modalChallengeStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  modalChallengeStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalChallengeStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Quest Sequence Styles
  questlineSection: {
    marginTop: 24,
  },
  questlineSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  questSequence: {
    gap: 0,
  },
  questSequenceItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  questSequenceConnector: {
    width: 32,
    alignItems: 'center',
  },
  questSequenceConnectorFirst: {
    paddingTop: 10,
  },
  questSequenceConnectorLast: {
    paddingBottom: 10,
  },
  questSequenceDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 3,
    borderColor: COLORS.borderLight,
    zIndex: 1,
  },
  questSequenceDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  questSequenceDotAvailable: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  questSequenceDotInProgress: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  questSequenceLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.borderLight,
    marginTop: -2,
  },
  questSequenceLineCompleted: {
    backgroundColor: '#10B981',
  },
  questSequenceCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  questSequenceCardCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  questSequenceCardLocked: {
    opacity: 0.6,
  },
  questSequenceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  questSequenceCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  questSequenceCardTitleLocked: {
    color: COLORS.text.muted,
  },
  questSequenceCardDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  questSequenceCardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  questSequenceCardXP: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  questSequenceCardBonus: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  noQuestsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noQuestsText: {
    color: COLORS.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },

  // Reward Section
  rewardSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  rewardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  rewardCard: {
    padding: 16,
  },
  rewardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  rewardCardText: {
    flex: 1,
  },
  rewardCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  rewardCardDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  rewardClaimLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    padding: 10,
  },
  rewardClaimLocationText: {
    fontSize: 13,
    color: COLORS.text.muted,
  },

  // Action Buttons
  modalActions: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  claimButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
  },
  claimedBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
});

export default QuestLogScreen;
