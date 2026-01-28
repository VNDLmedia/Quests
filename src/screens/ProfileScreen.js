import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, Dimensions, Animated, Pressable } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard, GlassButton, Avatar, ScreenHeader } from '../components';
import { useGame } from '../game/GameProvider';
import { CARDS, RARITY, getCollectionCompletion, getRarityDistribution } from '../game/config/cards';
import Card3D from '../components/Card3D';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_WIDTH = (width - 60) / COLUMN_COUNT;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Tabs für die Profilseite
const TABS = [
  { id: 'profile', label: 'Profil', icon: 'person' },
  { id: 'collection', label: 'Sammlung', icon: 'albums' },
];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { player, collection, uniqueCards } = useGame();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedCard, setSelectedCard] = useState(null);
  const [rarityFilter, setRarityFilter] = useState('all');
  const cardScale = useRef(new Animated.Value(1)).current;
  
  // Calculate Progress
  const xpProgress = (player.xpInCurrentLevel / player.xpNeededForNext) * 100;
  
  // Collection Stats using new helper functions
  const collectionStats = getCollectionCompletion(uniqueCards || []);
  const rarityStats = getRarityDistribution(uniqueCards || []);
  const unlockedCards = CARDS.filter(c => (uniqueCards || []).includes(c.id));
  const totalPower = unlockedCards.reduce((sum, c) => sum + c.power, 0);
  
  // Filtered Cards
  const filteredCards = rarityFilter === 'all' 
    ? CARDS 
    : CARDS.filter(c => c.rarity.id === rarityFilter);

  const openCardDetail = (card) => {
    setSelectedCard(card);
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const closeCardDetail = () => {
    Animated.timing(cardScale, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setSelectedCard(null));
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ data }) => {
    setIsScanning(false);
    alert(`NPC rekrutiert: ${data}`);
  };

  const renderCollectionItem = (card) => {
    const isUnlocked = (uniqueCards || []).includes(card.id);
    const duplicateCount = (collection || []).filter(id => id === card.id).length;

    return (
      <Pressable 
        key={card.id} 
        style={styles.cardWrapper}
        onPress={() => isUnlocked && openCardDetail(card)}
      >
        <View style={[styles.cardItem, !isUnlocked && styles.cardLocked]}>
          {isUnlocked ? (
            <LinearGradient
              colors={card.rarity.color}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardShine} />
              <Ionicons name={card.icon} size={28} color="white" />
              <View style={styles.powerBadge}>
                <Ionicons name="flash" size={10} color="#fbbf24" />
                <Text style={styles.powerText}>{card.power}</Text>
              </View>
              {duplicateCount > 1 && (
                <View style={styles.duplicateBadge}>
                  <Text style={styles.duplicateText}>x{duplicateCount}</Text>
                </View>
              )}
              <View style={styles.rarityIndicator}>
                <View style={[styles.rarityDot, { backgroundColor: card.rarity.color[1] }]} />
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.lockedContent}>
              <View style={styles.lockCircle}>
                <Ionicons name="lock-closed" size={20} color="#475569" />
              </View>
              <Text style={styles.levelReq}>Pack</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardName, !isUnlocked && styles.textLocked]} numberOfLines={1}>
          {card.name}
        </Text>
      </Pressable>
    );
  };

  // Render Tab Content
  const renderTabContent = () => {
    if (activeTab === 'collection') {
      return (
        <View style={styles.collectionTab}>
          {/* Collection Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <LinearGradient colors={['#3b82f6', '#60a5fa']} style={styles.statGradient}>
                <Ionicons name="albums" size={20} color="white" />
                <Text style={styles.statNumber}>{collectionStats.owned}/{collectionStats.total}</Text>
                <Text style={styles.statLabel}>Karten</Text>
              </LinearGradient>
            </View>
            <View style={styles.statBox}>
              <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.statGradient}>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.statNumber}>{totalPower}</Text>
                <Text style={styles.statLabel}>Power</Text>
              </LinearGradient>
            </View>
            <View style={styles.statBox}>
              <LinearGradient colors={['#8b5cf6', '#a78bfa']} style={styles.statGradient}>
                <Ionicons name="diamond" size={20} color="white" />
                <Text style={styles.statNumber}>{(rarityStats.legendary || 0) + (rarityStats.epic || 0)}</Text>
                <Text style={styles.statLabel}>Selten</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Rarity Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, rarityFilter === 'all' && styles.filterChipActive]}
              onPress={() => setRarityFilter('all')}
            >
              <Text style={[styles.filterText, rarityFilter === 'all' && styles.filterTextActive]}>Alle</Text>
            </TouchableOpacity>
            {Object.entries(RARITY).map(([key, rarity]) => (
              <TouchableOpacity 
                key={key}
                style={[
                  styles.filterChip, 
                  rarityFilter === rarity.id && styles.filterChipActive,
                  rarityFilter === rarity.id && { borderColor: rarity.color[0] }
                ]}
                onPress={() => setRarityFilter(rarity.id)}
              >
                <View style={[styles.filterDot, { backgroundColor: rarity.color[0] }]} />
                <Text style={[
                  styles.filterText, 
                  rarityFilter === rarity.id && styles.filterTextActive
                ]}>{rarity.name}</Text>
                <Text style={styles.filterCount}>({
                  CARDS.filter(c => c.rarity.id === rarity.id).filter(c => (uniqueCards || []).includes(c.id)).length
                })</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cards Grid */}
          <Text style={styles.sectionTitle}>
            {rarityFilter === 'all' ? 'Alle Karten' : RARITY[rarityFilter.toUpperCase()]?.name || 'Karten'}
          </Text>
          <View style={styles.grid}>
            {filteredCards.map(renderCollectionItem)}
          </View>
        </View>
      );
    }

    // Profile Tab
    return (
      <>
        {/* PLAYER HEADER */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#38bdf8', '#2563eb']}
              style={styles.avatarBorder}
            >
               <Ionicons name="person" size={40} color="white" />
            </LinearGradient>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{player.level}</Text>
            </View>
          </View>
          
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.displayName || player.username}</Text>
            <Text style={styles.playerTitle}>{player.levelTitle?.title || 'Rookie'}</Text>
            
            {/* XP Bar */}
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBarFill, { width: `${xpProgress || 0}%` }]} />
            </View>
            <Text style={styles.xpText}>{Math.floor(player.xpInCurrentLevel || 0)} / {Math.floor(player.xpNeededForNext || 100)} XP</Text>
          </View>
        </View>

        {/* GEMS DISPLAY */}
        <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
          <GlassCard style={styles.gemsCard}>
            <View style={styles.gemsContent}>
              <View style={styles.gemsLeft}>
                <Ionicons name="diamond" size={32} color="#38bdf8" />
                <View>
                  <Text style={styles.gemsLabel}>Deine Gems</Text>
                  <Text style={styles.gemsCount}>{player.gems || 0}</Text>
                </View>
              </View>
              <View style={styles.shopButton}>
                <Text style={styles.shopButtonText}>Shop</Text>
                <Ionicons name="chevron-forward" size={18} color="#38bdf8" />
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Quick Collection Preview */}
        <TouchableOpacity onPress={() => setActiveTab('collection')}>
          <GlassCard style={styles.collectionPreview}>
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionTitle}>Meine Sammlung</Text>
              <View style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>Alle ansehen</Text>
                <Ionicons name="chevron-forward" size={16} color="#38bdf8" />
              </View>
            </View>
            <View style={styles.previewCards}>
              {unlockedCards.slice(0, 4).map(card => (
                <LinearGradient
                  key={card.id}
                  colors={card.rarity.color}
                  style={styles.previewCard}
                >
                  <Ionicons name={card.icon} size={18} color="white" />
                </LinearGradient>
              ))}
              {unlockedCards.length > 4 && (
                <View style={styles.moreCards}>
                  <Text style={styles.moreText}>+{unlockedCards.length - 4}</Text>
                </View>
              )}
              {unlockedCards.length === 0 && (
                <View style={styles.emptyPreview}>
                  <Ionicons name="gift-outline" size={24} color="#64748b" />
                  <Text style={styles.emptyText}>Öffne Packs im Shop!</Text>
                </View>
              )}
            </View>
            <View style={styles.collectionProgress}>
              <View style={[styles.collectionBar, { width: `${collectionStats.percentage}%` }]} />
            </View>
            <Text style={styles.collectionSubtext}>{collectionStats.owned} von {collectionStats.total} Karten gesammelt</Text>
          </GlassCard>
        </TouchableOpacity>

        {/* ACTIONS */}
        <GlassCard style={styles.actionCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowQR(true)}>
            <View style={styles.actionIcon}>
              <Ionicons name="qr-code" size={24} color="#38bdf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Mein Quest-Code</Text>
              <Text style={styles.actionDesc}>Zeige deinen Code anderen Spielern</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#475569" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.actionRow} onPress={startScan}>
             <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="scan" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Spieler scannen</Text>
              <Text style={styles.actionDesc}>Finde NPCs oder Freunde</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#475569" />
          </TouchableOpacity>
        </GlassCard>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={activeTab === 'collection' ? 'Sammlung' : 'Profil'} />
      
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#38bdf8' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderTabContent()}
      </ScrollView>

      {/* CARD DETAIL MODAL */}
      <Modal visible={!!selectedCard} transparent animationType="fade" onRequestClose={closeCardDetail}>
        <Pressable style={styles.cardModalOverlay} onPress={closeCardDetail}>
          <Animated.View style={[styles.cardDetailContainer, { transform: [{ scale: cardScale }] }]}>
            {selectedCard && (
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Card3D card={selectedCard} size="large" interactive={true} />
                <TouchableOpacity style={styles.cardCloseBtn} onPress={closeCardDetail}>
                  <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </Pressable>
            )}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* QR MODAL */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <View style={styles.modalContainer}>
          <GlassCard style={styles.qrCard}>
             <Text style={styles.qrTitle}>Dein Code</Text>
             <View style={styles.qrWrapper}>
               <QRCode value={`USER:${player.id || 'GUEST'}`} size={200} />
             </View>
             <GlassButton title="Schließen" onPress={() => setShowQR(false)} />
          </GlassCard>
        </View>
      </Modal>

      {/* SCANNER MODAL */}
      <Modal visible={isScanning} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
            barcodeSettings={{ barcodeTypes: ["qr"] }}
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsScanning(false)}>
                <Ionicons name="close-circle" size={48} color="white" />
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
    backgroundColor: '#0f172a',
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#38bdf8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  // Profile Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatarBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fbbf24',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  levelText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  xpBarContainer: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  xpText: {
    color: '#64748b',
    fontSize: 12,
  },
  // Gems Card
  gemsCard: {
    marginBottom: 20,
    padding: 16,
  },
  gemsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gemsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gemsLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  gemsCount: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  shopButtonText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
  // Collection Preview
  collectionPreview: {
    marginBottom: 20,
    padding: 16,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  previewCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    minHeight: 56,
  },
  previewCard: {
    width: 44,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCards: {
    width: 44,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  collectionProgress: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  collectionBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  collectionSubtext: {
    color: '#64748b',
    fontSize: 12,
  },
  // Collection Tab
  collectionTab: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  statGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statNumber: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  // Filter
  filterScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#38bdf8',
  },
  filterCount: {
    color: '#64748b',
    fontSize: 12,
  },
  // Cards Grid
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 10,
  },
  cardItem: {
    height: CARD_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardLocked: {
    backgroundColor: '#0f172a',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  powerBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  powerText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  duplicateBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  duplicateText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rarityIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedContent: {
    alignItems: 'center',
    opacity: 0.6,
  },
  levelReq: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  cardName: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  textLocked: {
    color: '#475569',
  },
  // Action Card
  actionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionDesc: {
    color: '#94a3b8',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  // Card Detail Modal
  cardModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 30,
  },
  cardDetailContainer: {
    alignItems: 'center',
  },
  cardCloseBtn: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  // QR Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  qrCard: {
    width: '100%',
    alignItems: 'center',
    padding: 30,
  },
  qrTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 30,
  },
  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});

export default ProfileScreen;
