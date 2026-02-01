import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar,
  Dimensions,
  LayoutAnimation,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, COLORS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

const MissionsScreen = () => {
  const [filter, setFilter] = useState('active');
  const [missionStarted, setMissionStarted] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);

  // Responsive Card Width calculation
  const cardWidth = Math.min(width - 40, 400);
  const shadowWidth = cardWidth - 40;

  // Data
  const quests = [
    { 
      id: 1, type: 'story', title: 'The Golden Compass', desc: 'Find the hidden QR code behind the fountain.',
      progress: 0, total: 1, xp: 500, difficulty: 3, time: '01:45:00', color: '#8B5CF6', icon: 'compass', status: 'active',
      briefing: 'Legends say a golden compass is hidden near the central water fountain. Scan it to reveal the treasure map.'
    },
    { 
      id: 2, type: 'daily', title: 'Coffee Run', desc: 'Get a coffee at Starbucks.',
      progress: 1, total: 1, xp: 150, difficulty: 1, color: '#F59E0B', icon: 'cafe', status: 'completed'
    },
    { 
      id: 3, type: 'challenge', title: 'Fashionista', desc: 'Visit 3 Fashion Stores.',
      progress: 1, total: 3, xp: 300, difficulty: 2, color: '#EC4899', icon: 'shirt', status: 'active',
      briefing: 'Check out the new collections at Zara, H&M, and Mango to complete this challenge.'
    },
  ];

  const dailyProgress = 33; 
  const filteredQuests = filter === 'all' ? quests : quests.filter(q => filter === 'active' ? q.status !== 'completed' : q.status === 'completed');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header */}
      <View style={styles.header}>
        <View /> 
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HERO CARD */}
        {filter === 'active' && (
          <TouchableOpacity style={styles.cardContainer} activeOpacity={0.95} onPress={() => !missionStarted && setMissionStarted(true)}>
            <LinearGradient
              colors={missionStarted ? ['#10B981', '#059669'] : ['#4F46E5', '#3730A3']}
              style={[styles.heroCard, { width: cardWidth }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLogo}>
                  <View style={[styles.pulseDot, missionStarted && { backgroundColor: '#FFF' }]} />
                  <Text style={styles.cardBrand}>{missionStarted ? 'IN PROGRESS' : 'PRIORITY'}</Text>
                </View>
                <View style={styles.timerBadge}>
                  <Ionicons name="stopwatch" size={14} color="#FFF" />
                  <Text style={styles.timerText}>08:45</Text>
                </View>
              </View>
              
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Espresso Speed Run</Text>
                <Text style={styles.heroDesc}>Reach Starbucks in the South Wing before the timer runs out!</Text>
              </View>
              
              <View style={styles.cardBottom}>
                <View style={[styles.xpBadge, missionStarted && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[styles.xpText, missionStarted && { color: '#FFF' }]}>+150 XP</Text>
                </View>
                <TouchableOpacity style={styles.startBtn} onPress={() => setMissionStarted(!missionStarted)}>
                  <Text style={[styles.startBtnText, missionStarted && { color: '#10B981' }]}>
                    {missionStarted ? 'Complete' : 'Start'}
                  </Text>
                  <Ionicons name={missionStarted ? "checkmark" : "arrow-forward"} size={16} color={missionStarted ? '#10B981' : '#4F46E5'} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={[styles.cardShadow, { width: shadowWidth, backgroundColor: missionStarted ? '#10B981' : '#4F46E5' }]} />
          </TouchableOpacity>
        )}

        {/* Status & Tabs */}
        <View style={styles.statusCompact}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Daily Goal</Text>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={14} color="#EF4444" />
              <Text style={styles.streakText}>5 Day Streak</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${dailyProgress}%` }]} />
          </View>
        </View>

        <View style={styles.tabs}>
          {['active', 'completed', 'all'].map((t) => (
            <TouchableOpacity 
              key={t} 
              style={[styles.tab, filter === t && styles.tabActive]}
              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setFilter(t); }}
            >
              <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {filteredQuests.map((quest, index) => (
            <QuestCard key={quest.id} quest={quest} onPress={() => setSelectedQuest(quest)} />
          ))}
        </View>
        <View style={styles.spacer} />
      </ScrollView>

      {/* Quest Modal */}
      <Modal visible={!!selectedQuest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedQuest && (
              <>
                <View style={[styles.modalIcon, { backgroundColor: selectedQuest.color + '20' }]}>
                  <Ionicons name={selectedQuest.icon} size={32} color={selectedQuest.color} />
                </View>
                <Text style={styles.modalTitle}>{selectedQuest.title}</Text>
                <Text style={styles.modalBrief}>{selectedQuest.briefing || selectedQuest.desc}</Text>
                
                <View style={styles.modalStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>REWARD</Text>
                    <Text style={styles.statVal}>+{selectedQuest.xp} XP</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>DIFFICULTY</Text>
                    <View style={{flexDirection:'row'}}>{[...Array(3)].map((_,i) => <Ionicons key={i} name="star" size={12} color={i<selectedQuest.difficulty ? '#FBBF24':'#E2E8F0'} />)}</View>
                  </View>
                </View>

                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: selectedQuest.color }]} onPress={() => setSelectedQuest(null)}>
                  <Text style={styles.modalBtnText}>Accept Mission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedQuest(null)}>
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

const QuestCard = ({ quest, onPress }) => {
  const isCompleted = quest.status === 'completed';
  return (
    <TouchableOpacity style={[styles.card, isCompleted && styles.cardCompleted]} activeOpacity={0.9} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: isCompleted ? '#F1F5F9' : quest.color + '15' }]}>
        <Ionicons name={isCompleted ? 'checkmark' : quest.icon} size={22} color={isCompleted ? '#94A3B8' : quest.color} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isCompleted && styles.textCompleted]}>{quest.title}</Text>
          {!isCompleted && <Text style={[styles.xpLabel, { color: quest.color }]}>+{quest.xp} XP</Text>}
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{quest.desc}</Text>
        {!isCompleted && quest.total > 1 && (
          <View style={styles.progressContainer}>
            <View style={styles.miniBar}><View style={[styles.miniFill, { width: (quest.progress/quest.total*100) + '%', backgroundColor: quest.color }]} /></View>
            <Text style={styles.progressText}>{quest.progress}/{quest.total}</Text>
          </View>
        )}
      </View>
      {!isCompleted && <Ionicons name="chevron-forward" size={18} color={COLORS.text.muted} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 100 },
  
  cardContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  heroCard: { minHeight: 200, borderRadius: 20, padding: 20, justifyContent: 'space-between', zIndex: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardLogo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  cardBrand: { color: '#FFF', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { color: '#FFF', fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums'] },
  heroContent: { marginBottom: 20 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpBadge: { backgroundColor: '#FBBF24', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  xpText: { color: '#000', fontWeight: '800', fontSize: 12 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  startBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  cardShadow: { position: 'absolute', top: 15, height: 200, borderRadius: 20, opacity: 0.3, zIndex: 1, transform: [{ translateY: 8 }] },

  statusCompact: { paddingHorizontal: 24, marginBottom: 24, maxWidth: 600, alignSelf: 'center', width: '100%' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  streakContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  tabs: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  tab: { marginRight: 24, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.text.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: COLORS.text.muted },
  tabTextActive: { color: COLORS.text.primary },

  listContainer: { paddingHorizontal: 24, gap: 14, maxWidth: 600, alignSelf: 'center', width: '100%' },
  card: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cardCompleted: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardContent: { flex: 1, marginRight: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  textCompleted: { textDecorationLine: 'line-through', color: COLORS.text.muted },
  xpLabel: { fontSize: 12, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 18 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  miniBar: { flex: 1, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, fontWeight: '600', color: COLORS.text.muted },
  spacer: { height: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center', ...SHADOWS.lg },
  modalIcon: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalBrief: { fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalStats: { flexDirection: 'row', gap: 32, marginBottom: 32 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text.muted, marginBottom: 4 },
  statVal: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  modalBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  modalBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  closeBtn: { padding: 12 },
  closeText: { color: COLORS.text.muted, fontWeight: '600' },
});

export default MissionsScreen;
