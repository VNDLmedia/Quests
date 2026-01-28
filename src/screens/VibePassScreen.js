import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  StatusBar,
  useWindowDimensions,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, COLORS, SHADOWS } from '../theme';
import { usePlayer, useAchievements } from '../game/hooks';
import { StreakBanner, AchievementBadge } from '../components';
import { LEVEL_CONFIG } from '../game/config/rewards';

const ClubPassScreen = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('wallet');
  const [showQR, setShowQR] = useState(false);
  
  // Game Hooks
  const { 
    xp, level, loginStreak, displayName, username,
    levelProgress, levelTitle, xpForNextLevel, xpInCurrentLevel,
    hasClaimedDailyReward, claimDailyReward
  } = usePlayer();
  
  const { 
    unlockedAchievements, 
    nearlyUnlocked, 
    stats: achievementStats,
    byCategory 
  } = useAchievements();
  
  // Interactive States
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemState, setRedeemState] = useState('idle'); // idle, redeeming, done

  // Responsive Card Width
  const cardWidth = Math.min(width - 40, 400);
  const shadowWidth = cardWidth - 30;

  const member = {
    name: displayName || username || 'Ethernal Paths Member',
    id: `EP-${username?.slice(0, 4)?.toUpperCase() || '8821'}`,
    points: xp,
    level: levelTitle?.title || 'Newcomer',
    nextLevel: 'Next Level',
    nextPoints: xpForNextLevel,
  };

  const progress = levelProgress;

  const myRewards = [
    { id: 1, title: 'Free Coffee', place: 'Starbucks', expires: '2d left', color: '#166534', icon: 'cafe', code: 'STAR-FREE-99' },
    { id: 2, title: '-20% Off', place: 'Nike Store', expires: '5d left', color: '#1F2937', icon: 'shirt', code: 'NIKE-20-OFF' },
  ];

  const myTickets = [
    { id: 1, event: 'Summer Vibes Open Air', date: '15. Aug, 18:00', loc: 'Rooftop', code: 'T-9921', color: '#8B5CF6' },
  ];

  const friends = [
    { id: 1, name: 'Anna', points: 2450, rank: 1 },
    { id: 2, name: 'Tom', points: 1890, rank: 2 },
    { id: 3, name: 'You', points: 1250, rank: 3, isMe: true },
    { id: 4, name: 'Lisa', points: 980, rank: 4 },
  ];

  const handleRedeem = () => {
    setRedeemState('redeeming');
    setTimeout(() => {
      setRedeemState('done');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        {/* HERO CARD */}
        <TouchableOpacity style={styles.cardContainer} activeOpacity={0.95} onPress={() => setShowQR(true)}>
          <LinearGradient
            colors={COLORS.gradients.premium}
            style={[styles.walletCard, { width: cardWidth }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardLogo}>
                <Ionicons name="compass" size={24} color="#FFF" />
                <Text style={styles.cardBrand}>Ethernal Paths</Text>
              </View>
              <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.6)" />
            </View>
            <View style={styles.cardCode}>
              <QRCode value={member.id} size={50} color="#000" backgroundColor="#FFF" />
            </View>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardLabel}>MEMBER</Text>
                <Text style={styles.cardValue}>{member.name.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>ID</Text>
                <Text style={styles.cardValue}>{member.id}</Text>
              </View>
            </View>
          </LinearGradient>
          <View style={[styles.cardShadow, { width: shadowWidth }]} />
        </TouchableOpacity>

        {/* Compact XP */}
        <View style={styles.levelCompact}>
          <View style={styles.levelRow}>
            <Text style={styles.levelCurrent}>{member.level}</Text>
            <Text style={styles.xpText}>{member.points} / {member.nextPoints} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Streak Banner */}
        <View style={styles.streakSection}>
          <StreakBanner
            streak={loginStreak}
            hasClaimedToday={hasClaimedDailyReward}
            onClaim={claimDailyReward}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['wallet', 'rewards', 'achievements', 'friends'].map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'wallet' && (
          <View style={styles.tabContent}>
            <View style={styles.actionGrid}>
              {[
                { icon: 'scan', label: 'Scan', color: COLORS.primary, bg: '#EEF2FF', action: () => setShowQR(true) },
                { icon: 'ticket-outline', label: 'Tickets', color: COLORS.success, bg: '#ECFDF5', action: () => {} },
                { icon: 'gift-outline', label: 'Perks', color: COLORS.gold, bg: '#FFFBEB', action: () => setActiveTab('rewards') },
                { icon: 'share-outline', label: 'Share', color: '#9333EA', bg: '#F3E8FF', action: () => {} },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={styles.actionItem} onPress={item.action}>
                  <View style={[styles.actionIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={styles.actionLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {myTickets.map((t) => (
                <TouchableOpacity key={t.id} style={styles.ticketItem} onPress={() => setSelectedTicket(t)}>
                  <View style={styles.ticketLeft}>
                    <Text style={styles.dateDay}>15</Text>
                    <Text style={styles.dateMonth}>AUG</Text>
                  </View>
                  <View style={styles.ticketMid}>
                    <Text style={styles.ticketTitle}>{t.event}</Text>
                    <Text style={styles.ticketSub}>{t.loc} • {t.date}</Text>
                  </View>
                  <TouchableOpacity style={styles.ticketBtn}>
                    <Ionicons name="qr-code" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'rewards' && (
          <View style={styles.tabContent}>
            <View style={styles.promoBanner}>
              <LinearGradient colors={COLORS.gradients.gold} style={styles.promoGrad}>
                <View>
                  <Text style={styles.promoTitle}>Gold Status</Text>
                  <Text style={styles.promoSub}>Reach 1,500 XP to unlock VIP.</Text>
                </View>
                <Ionicons name="star" size={40} color="rgba(255,255,255,0.3)" />
              </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>Your Perks</Text>
            {myRewards.map((r) => (
              <TouchableOpacity key={r.id} style={styles.rewardCard} activeOpacity={0.9} onPress={() => { setSelectedReward(r); setRedeemState('idle'); }}>
                <View style={[styles.rewardIcon, { backgroundColor: r.color + '15' }]}>
                  <Ionicons name={r.icon} size={22} color={r.color} />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardTitle}>{r.title}</Text>
                  <Text style={styles.rewardPlace}>{r.place}</Text>
                </View>
                <View style={styles.expireBadge}>
                  <Text style={styles.expireText}>{r.expires}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'achievements' && (
          <View style={styles.tabContent}>
            {/* Achievement Stats */}
            <View style={styles.achievementStats}>
              <View style={styles.achievementStatItem}>
                <Text style={styles.achievementStatValue}>{achievementStats.totalUnlocked}</Text>
                <Text style={styles.achievementStatLabel}>Unlocked</Text>
              </View>
              <View style={styles.achievementStatDivider} />
              <View style={styles.achievementStatItem}>
                <Text style={styles.achievementStatValue}>{achievementStats.completionPercent}%</Text>
                <Text style={styles.achievementStatLabel}>Complete</Text>
              </View>
              <View style={styles.achievementStatDivider} />
              <View style={styles.achievementStatItem}>
                <Text style={styles.achievementStatValue}>{achievementStats.totalXPEarned}</Text>
                <Text style={styles.achievementStatLabel}>XP Earned</Text>
              </View>
            </View>

            {/* Nearly Unlocked */}
            {nearlyUnlocked.length > 0 && (
              <View style={styles.achievementSection}>
                <Text style={styles.sectionTitle}>Almost There!</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.badgeRow}>
                    {nearlyUnlocked.map((a) => (
                      <AchievementBadge
                        key={a.key}
                        achievement={a}
                        unlocked={false}
                        progress={a.currentProgress}
                        size="medium"
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Unlocked Achievements */}
            <View style={styles.achievementSection}>
              <Text style={styles.sectionTitle}>Unlocked ({unlockedAchievements.length})</Text>
              {unlockedAchievements.length === 0 ? (
                <View style={styles.emptyAchievements}>
                  <Ionicons name="trophy-outline" size={48} color={COLORS.text.muted} />
                  <Text style={styles.emptyText}>No achievements yet</Text>
                  <Text style={styles.emptySubtext}>Complete quests to earn badges!</Text>
                </View>
              ) : (
                <View style={styles.badgeGrid}>
                  {unlockedAchievements.map((a) => (
                    <AchievementBadge
                      key={a.key}
                      achievement={a}
                      unlocked={true}
                      size="medium"
                    />
                  ))}
                </View>
              )}
            </View>

            {/* By Category */}
            {Object.values(byCategory).map((category) => (
              <View key={category.id} style={styles.achievementSection}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon} size={16} color={category.color} />
                  </View>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <Text style={styles.categoryCount}>
                    {category.unlockedCount}/{category.totalCount}
                  </Text>
                </View>
                <View style={styles.categoryProgress}>
                  <View 
                    style={[
                      styles.categoryProgressFill, 
                      { 
                        width: `${(category.unlockedCount / category.totalCount) * 100}%`,
                        backgroundColor: category.color 
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'friends' && (
          <View style={styles.tabContent}>
            <View style={styles.leaderboardCard}>
              <Text style={styles.lbTitle}>This Week</Text>
              {friends.map((f, i) => (
                <View key={f.id} style={[styles.lbItem, f.isMe && styles.lbItemMe]}>
                  <Text style={[styles.lbRank, i < 3 && styles.lbRankTop]}>{f.rank}</Text>
                  <View style={styles.lbAvatar}>
                    <Text style={styles.lbInitials}>{f.name.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.lbName, f.isMe && styles.lbNameMe]}>{f.name}</Text>
                  <Text style={[styles.lbPoints, f.isMe && styles.lbPointsMe]}>{f.points}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.inviteBtn}>
              <Text style={styles.inviteText}>Invite Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* QR Modal (Member Card) */}
      <Modal visible={showQR} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowQR(false)}>
            <Ionicons name="close" size={32} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Member Card</Text>
          <View style={styles.qrBigBox}>
            <QRCode value={member.id} size={200} />
          </View>
          <Text style={styles.modalId}>{member.id}</Text>
        </View>
      </Modal>

      {/* Ticket Modal */}
      <Modal visible={!!selectedTicket} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.ticketModal}>
            <View style={[styles.ticketHeader, { backgroundColor: selectedTicket?.color || COLORS.primary }]}>
              <Text style={styles.ticketEvent}>{selectedTicket?.event}</Text>
              <Text style={styles.ticketDate}>{selectedTicket?.date}</Text>
            </View>
            <View style={styles.ticketBody}>
              <Text style={styles.ticketLabel}>SCAN TO ENTER</Text>
              <View style={{marginVertical: 20}}>
                {selectedTicket && <QRCode value={selectedTicket.code} size={150} />}
              </View>
              <Text style={styles.ticketCode}>{selectedTicket?.code}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtnTextOnly} onPress={() => setSelectedTicket(null)}>
              <Text style={{color: COLORS.text.muted, fontWeight:'600'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reward Modal */}
      <Modal visible={!!selectedReward} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedReward && (
              <>
                <View style={[styles.modalIcon, { backgroundColor: selectedReward.color + '20' }]}>
                  <Ionicons name={selectedReward.icon} size={32} color={selectedReward.color} />
                </View>
                <Text style={styles.modalTitle}>{selectedReward.title}</Text>
                <Text style={styles.modalBrief}>Valid at {selectedReward.place} • {selectedReward.expires}</Text>
                
                {redeemState === 'idle' && (
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: selectedReward.color }]} onPress={handleRedeem}>
                    <Text style={styles.modalBtnText}>Redeem Now</Text>
                  </TouchableOpacity>
                )}
                
                {redeemState === 'redeeming' && (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="hourglass-outline" size={32} color={selectedReward.color} />
                    <Text style={{marginTop: 8, color: COLORS.text.secondary}}>Processing...</Text>
                  </View>
                )}

                {redeemState === 'done' && (
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>SHOW TO CASHIER</Text>
                    <Text style={[styles.codeText, { color: selectedReward.color }]}>{selectedReward.code}</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedReward(null)}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 100 },
  
  cardContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  walletCard: { height: 200, borderRadius: 20, padding: 20, justifyContent: 'space-between', zIndex: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBrand: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  cardCode: { alignItems: 'center', justifyContent: 'center', padding: 6, backgroundColor: '#FFF', borderRadius: 10, alignSelf: 'flex-end' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  cardValue: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cardShadow: { position: 'absolute', top: 15, height: 200, backgroundColor: COLORS.primary, borderRadius: 20, opacity: 0.3, zIndex: 1, transform: [{ translateY: 8 }] },

  levelCompact: { paddingHorizontal: 20, marginBottom: 24, maxWidth: 600, alignSelf: 'center', width: '100%' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelCurrent: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  xpText: { fontSize: 13, color: COLORS.text.secondary, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 14, padding: 4, marginBottom: 20, maxWidth: 600, alignSelf: 'center', width: 'auto', ...SHADOWS.sm },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.text.muted },
  tabTextActive: { color: COLORS.primary },
  tabContent: { paddingHorizontal: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },

  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionItem: { alignItems: 'center', gap: 8, width: 70 },
  actionIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text.primary },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginBottom: 16 },
  ticketItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  ticketLeft: { alignItems: 'center', paddingRight: 12, borderRightWidth: 1, borderRightColor: COLORS.border, marginRight: 12 },
  dateDay: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  dateMonth: { fontSize: 11, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase' },
  ticketMid: { flex: 1 },
  ticketTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, marginBottom: 2 },
  ticketSub: { fontSize: 12, color: COLORS.text.secondary },
  ticketBtn: { padding: 4 },

  promoBanner: { height: 100, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  promoGrad: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  promoSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  rewardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rewardContent: { flex: 1 },
  rewardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  rewardPlace: { fontSize: 12, color: COLORS.text.secondary },
  expireBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  expireText: { fontSize: 10, fontWeight: '700', color: COLORS.gold },

  leaderboardCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  lbTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  lbItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceAlt },
  lbItemMe: { backgroundColor: COLORS.surfaceAlt, marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 10, borderBottomWidth: 0 },
  lbRank: { width: 24, fontSize: 14, fontWeight: '600', color: COLORS.text.muted },
  lbRankTop: { color: COLORS.gold, fontWeight: '800' },
  lbAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  lbInitials: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  lbName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  lbNameMe: { color: COLORS.primary },
  lbPoints: { fontWeight: '700', fontSize: 14, color: COLORS.text.primary },
  lbPointsMe: { color: COLORS.primary },
  inviteBtn: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: 16, alignItems: 'center' },
  inviteText: { color: '#FFF', fontWeight: '700' },

  modalContainer: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 60, right: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 40 },
  qrBigBox: { padding: 32, backgroundColor: '#FFF', borderRadius: 32, ...SHADOWS.lg, marginBottom: 32 },
  modalId: { fontSize: 18, letterSpacing: 2, fontWeight: '600', color: COLORS.text.secondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24, alignItems: 'center' },
  modalCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center', ...SHADOWS.lg, width: '100%', maxWidth: 320 },
  modalIcon: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalBrief: { fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  modalBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  closeBtn: { padding: 12 },
  closeText: { color: COLORS.text.muted, fontWeight: '600' },
  
  ticketModal: { backgroundColor: '#FFF', borderRadius: 24, width: '100%', maxWidth: 300, overflow: 'hidden' },
  ticketHeader: { padding: 24, alignItems: 'center' },
  ticketEvent: { fontSize: 20, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  ticketDate: { color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  ticketBody: { padding: 32, alignItems: 'center' },
  ticketLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text.muted, letterSpacing: 1 },
  ticketCode: { fontSize: 18, fontWeight: '700', color: COLORS.text.primary, letterSpacing: 2 },
  closeBtnTextOnly: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border },

  codeContainer: { alignItems: 'center', marginBottom: 20 },
  codeLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text.muted, letterSpacing: 1, marginBottom: 8 },
  codeText: { fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  loadingContainer: { alignItems: 'center', marginBottom: 20 },
  
  // Streak Section
  streakSection: { paddingHorizontal: 20, marginBottom: 24, maxWidth: 600, alignSelf: 'center', width: '100%' },
  
  // Achievement Styles
  achievementStats: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 20, ...SHADOWS.sm },
  achievementStatItem: { flex: 1, alignItems: 'center' },
  achievementStatValue: { fontSize: 24, fontWeight: '800', color: COLORS.text.primary },
  achievementStatLabel: { fontSize: 11, color: COLORS.text.muted, marginTop: 4 },
  achievementStatDivider: { width: 1, backgroundColor: COLORS.surfaceAlt, marginVertical: 4 },
  
  achievementSection: { marginBottom: 24 },
  badgeRow: { flexDirection: 'row', gap: 16, paddingVertical: 8 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  
  emptyAchievements: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFF', borderRadius: 16 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text.primary, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: COLORS.text.muted, marginTop: 4 },
  
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  categoryTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  categoryCount: { fontSize: 12, fontWeight: '600', color: COLORS.text.muted },
  categoryProgress: { height: 4, backgroundColor: COLORS.surfaceAlt, borderRadius: 2, overflow: 'hidden' },
  categoryProgressFill: { height: '100%', borderRadius: 2 },
});

export default ClubPassScreen;
