// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Kartensammlung Komponente
// Zeigt gesammelte Karten, Boni und Set-Fortschritt
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
import { 
  COLLECTIBLE_CARDS, 
  CARD_CATEGORIES,
  calculateTotalBonuses,
  getSetProgress,
  getCountrySetProgress,
  RARITY_COLORS,
  RARITY_LABELS,
} from '../game/config/cardCollection';
import { COUNTRIES } from '../game/config/countries';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// ═══════════════════════════════════════════════════════════════════════════
// EINZELNE SAMMELKARTE
// ═══════════════════════════════════════════════════════════════════════════

const CollectibleCard = ({ card, isCollected, onPress, size = 'normal' }) => {
  const country = COUNTRIES[card.country];
  const rarity = RARITY_COLORS[card.rarity] || RARITY_COLORS.common;
  
  const cardWidth = size === 'small' ? 70 : size === 'large' ? CARD_WIDTH : 90;
  const cardHeight = cardWidth * 1.4;

  return (
    <TouchableOpacity 
      style={[
        styles.collectibleCard,
        { width: cardWidth, height: cardHeight },
        !isCollected && styles.cardNotCollected,
      ]}
      activeOpacity={0.8}
      onPress={() => onPress?.(card)}
    >
      {/* Glow-Effekt für gesammelte Karten */}
      {isCollected && (
        <View style={[styles.cardGlow, { backgroundColor: rarity.glow }]} />
      )}
      
      {/* Karten-Container */}
      <View style={[
        styles.cardInner,
        { borderColor: isCollected ? rarity.bg : COLORS.borderLight },
      ]}>
        {/* Kartenbild oder Platzhalter */}
        {isCollected ? (
          <Image 
            source={{ uri: card.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Ionicons name="help" size={24} color={COLORS.text.muted} />
            <Text style={styles.placeholderText}>?</Text>
          </View>
        )}
        
        {/* Overlay mit Info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.cardOverlay}
        >
          {isCollected ? (
            <>
              <Text style={styles.cardName} numberOfLines={1}>
                {card.name}
              </Text>
              {/* Rarity Badge */}
              <View style={[styles.rarityBadge, { backgroundColor: rarity.bg }]}>
                <Text style={[styles.rarityText, { color: rarity.text }]}>
                  {RARITY_LABELS[card.rarity]}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.lockedText}>Not unlocked yet</Text>
          )}
        </LinearGradient>
        
        {/* Land-Flag */}
        {country && isCollected && (
          <View style={styles.countryFlag}>
            <Text style={styles.flagEmoji}>{country.flag}</Text>
          </View>
        )}
        
        {/* Bonus-Indikator */}
        {isCollected && card.individualBonus && (
          <View style={styles.bonusIndicator}>
            <Ionicons name="flash" size={10} color="#FFD700" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BONUS-ÜBERSICHT
// ═══════════════════════════════════════════════════════════════════════════

const BonusOverview = ({ bonuses }) => {
  if (!bonuses) return null;

  const hasAnyBonus = 
    bonuses.xpMultiplier > 1 || 
    bonuses.questXpBonus > 0 || 
    bonuses.discountPercent > 0 ||
    bonuses.specialBadges.length > 0;

  if (!hasAnyBonus) {
    return (
      <View style={styles.noBonusContainer}>
        <Ionicons name="gift-outline" size={32} color={COLORS.text.muted} />
        <Text style={styles.noBonusText}>
          Collect cards to unlock bonuses!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.bonusOverview}>
      {/* Aktive Boni */}
      <View style={styles.activeBonuses}>
        {bonuses.xpMultiplier > 1 && (
          <View style={styles.bonusChip}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={styles.bonusChipText}>
              {Math.round((bonuses.xpMultiplier - 1) * 100)}% XP
            </Text>
          </View>
        )}
        
        {bonuses.questXpBonus > 0 && (
          <View style={styles.bonusChip}>
            <Ionicons name="add-circle" size={14} color="#10B981" />
            <Text style={styles.bonusChipText}>
              +{bonuses.questXpBonus} XP/Quest
            </Text>
          </View>
        )}
        
        {bonuses.discountPercent > 0 && (
          <View style={[styles.bonusChip, styles.discountChip]}>
            <Ionicons name="pricetag" size={14} color="#EC4899" />
            <Text style={styles.bonusChipText}>
              {bonuses.discountPercent}% Rabatt
            </Text>
          </View>
        )}
        
        {bonuses.socialMultiplier > 1 && (
          <View style={styles.bonusChip}>
            <Ionicons name="people" size={14} color="#8B5CF6" />
            <Text style={styles.bonusChipText}>
              {bonuses.socialMultiplier}x Social
            </Text>
          </View>
        )}
      </View>
      
      {/* Spezial-Badges */}
      {bonuses.specialBadges.length > 0 && (
        <View style={styles.badgesContainer}>
          {bonuses.specialBadges.map((badge, index) => (
            <View key={index} style={[styles.badge, badge.partial && styles.badgePartial]}>
              {badge.flag ? (
                <Text style={styles.badgeFlag}>{badge.flag}</Text>
              ) : (
                <Ionicons name={badge.icon} size={14} color="#FFD700" />
              )}
              <View style={styles.badgeTextContainer}>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeBonus}>{badge.bonus}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SET-FORTSCHRITT
// ═══════════════════════════════════════════════════════════════════════════

const SetProgressCard = ({ category, progress, country }) => {
  const isComplete = progress.isComplete;
  const config = country || CARD_CATEGORIES[category];
  
  return (
    <View style={[styles.setCard, isComplete && styles.setCardComplete]}>
      <View style={styles.setHeader}>
        {country ? (
          <Text style={styles.setFlag}>{country.flag}</Text>
        ) : (
          <View style={[styles.setIcon, isComplete && styles.setIconComplete]}>
            <Ionicons 
              name={config?.icon || 'albums'} 
              size={18} 
              color={isComplete ? '#FFD700' : COLORS.text.muted} 
            />
          </View>
        )}
        <View style={styles.setInfo}>
          <Text style={[styles.setName, isComplete && styles.setNameComplete]}>
            {config?.name}
          </Text>
          <Text style={styles.setProgress}>
            {progress.collected}/{progress.total}
          </Text>
        </View>
        {isComplete && (
          <View style={styles.completeIcon}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
        )}
      </View>
      
      {/* Progress Bar */}
      <View style={styles.setProgressBar}>
        <LinearGradient
          colors={isComplete ? ['#10B981', '#059669'] : [COLORS.primary, COLORS.secondary]}
          style={[styles.setProgressFill, { width: `${progress.percentage}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      
      {/* Set Bonus */}
      {isComplete && (
        <View style={styles.setBonusContainer}>
          <Ionicons name="gift" size={12} color="#10B981" />
          <Text style={styles.setBonusText}>
            {CARD_CATEGORIES[category]?.setBonus.complete.bonus || 'Set komplett!'}
          </Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// KARTEN-DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════

const CardDetailModal = ({ card, visible, onClose, isCollected }) => {
  if (!card) return null;
  
  const country = COUNTRIES[card.country];
  const rarity = RARITY_COLORS[card.rarity] || RARITY_COLORS.common;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackground} onPress={onClose} />
        
        <View style={styles.modalContent}>
          {/* Karte groß */}
          <View style={[styles.modalCard, { borderColor: rarity.bg }]}>
            {isCollected ? (
              <Image 
                source={{ uri: card.image }}
                style={styles.modalCardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.modalCardPlaceholder}>
                <Ionicons name="lock-closed" size={48} color={COLORS.text.muted} />
              </View>
            )}
          </View>
          
          {/* Info */}
          <View style={styles.modalInfo}>
            <View style={styles.modalHeader}>
              {country && <Text style={styles.modalFlag}>{country.flag}</Text>}
              <Text style={styles.modalName}>{card.name}</Text>
            </View>
            
            <View style={[styles.modalRarity, { backgroundColor: rarity.bg }]}>
              <Text style={[styles.modalRarityText, { color: rarity.text }]}>
                {RARITY_LABELS[card.rarity]}
              </Text>
            </View>
            
            <Text style={styles.modalDescription}>{card.description}</Text>
            
            {/* Bonus */}
            {card.individualBonus && isCollected && (
              <View style={styles.modalBonus}>
                <Ionicons name="flash" size={18} color="#FFD700" />
                <Text style={styles.modalBonusText}>
                  {card.individualBonus.label}
                </Text>
              </View>
            )}
            
            {!isCollected && (
              <View style={styles.modalLocked}>
                <Ionicons name="lock-closed" size={16} color={COLORS.text.muted} />
                <Text style={styles.modalLockedText}>
                  Complete challenges to unlock this card
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HAUPTKOMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

const CardCollection = ({ collectedCardIds = [], compact = false }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('cards'); // 'cards', 'sets', 'countries'
  
  const allCards = Object.values(COLLECTIBLE_CARDS);
  
  // Berechnete Werte
  const bonuses = useMemo(() => 
    calculateTotalBonuses(collectedCardIds), 
    [collectedCardIds]
  );
  
  const collectionStats = useMemo(() => ({
    collected: collectedCardIds.length,
    total: allCards.length,
    percentage: (collectedCardIds.length / allCards.length) * 100,
  }), [collectedCardIds, allCards]);

  // Set-Fortschritte
  const setProgresses = useMemo(() => {
    return Object.keys(CARD_CATEGORIES).map(catId => ({
      category: catId,
      progress: getSetProgress(collectedCardIds, catId),
    })).filter(s => s.progress.total > 0);
  }, [collectedCardIds]);

  // Länder-Fortschritte
  const countryProgresses = useMemo(() => {
    return Object.keys(COUNTRIES).map(countryId => ({
      country: COUNTRIES[countryId],
      progress: getCountrySetProgress(collectedCardIds, countryId),
    })).filter(c => c.progress.total > 0);
  }, [collectedCardIds]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Sammlung Header */}
        <View style={styles.compactHeader}>
          <View style={styles.compactStats}>
            <Ionicons name="albums" size={18} color={COLORS.primary} />
            <Text style={styles.compactStatsText}>
              {collectionStats.collected}/{collectionStats.total} Karten
            </Text>
          </View>
          {bonuses.discountPercent > 0 && (
            <View style={styles.compactBonus}>
              <Ionicons name="pricetag" size={12} color="#EC4899" />
              <Text style={styles.compactBonusText}>
                {bonuses.discountPercent}% Rabatt
              </Text>
            </View>
          )}
        </View>
        
        {/* Mini-Kartenvorschau */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactCards}
        >
          {allCards.slice(0, 6).map(card => (
            <CollectibleCard
              key={card.id}
              card={card}
              isCollected={collectedCardIds.includes(card.id)}
              onPress={setSelectedCard}
              size="small"
            />
          ))}
          {allCards.length > 6 && (
            <View style={styles.moreCardsIndicator}>
              <Text style={styles.moreCardsText}>+{allCards.length - 6}</Text>
            </View>
          )}
        </ScrollView>
        
        <CardDetailModal
          card={selectedCard}
          visible={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          isCollected={selectedCard ? collectedCardIds.includes(selectedCard.id) : false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header mit Gesamtfortschritt */}
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="albums" size={28} color="#FFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Meine Sammlung</Text>
            <Text style={styles.headerSubtitle}>
              {collectionStats.collected} von {collectionStats.total} Karten
            </Text>
          </View>
          <View style={styles.headerPercentage}>
            <Text style={styles.percentageText}>
              {Math.round(collectionStats.percentage)}%
            </Text>
          </View>
        </View>
        
        {/* Gesamt-Fortschrittsbalken */}
        <View style={styles.headerProgressBar}>
          <View 
            style={[
              styles.headerProgressFill, 
              { width: `${collectionStats.percentage}%` }
            ]} 
          />
        </View>
      </LinearGradient>

      {/* Bonus-Übersicht */}
      <View style={styles.bonusSection}>
        <Text style={styles.sectionTitle}>Aktive Boni</Text>
        <BonusOverview bonuses={bonuses} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'cards' && styles.tabActive]}
          onPress={() => setActiveTab('cards')}
        >
          <Ionicons 
            name="card" 
            size={16} 
            color={activeTab === 'cards' ? COLORS.primary : COLORS.text.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'cards' && styles.tabTextActive]}>
            Karten
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sets' && styles.tabActive]}
          onPress={() => setActiveTab('sets')}
        >
          <Ionicons 
            name="layers" 
            size={16} 
            color={activeTab === 'sets' ? COLORS.primary : COLORS.text.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'sets' && styles.tabTextActive]}>
            Sets
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'countries' && styles.tabActive]}
          onPress={() => setActiveTab('countries')}
        >
          <Ionicons 
            name="globe" 
            size={16} 
            color={activeTab === 'countries' ? COLORS.primary : COLORS.text.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'countries' && styles.tabTextActive]}>
            Länder
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'cards' && (
        <View style={styles.cardsGrid}>
          {allCards.map(card => (
            <CollectibleCard
              key={card.id}
              card={card}
              isCollected={collectedCardIds.includes(card.id)}
              onPress={setSelectedCard}
              size="normal"
            />
          ))}
        </View>
      )}

      {activeTab === 'sets' && (
        <View style={styles.setsContainer}>
          {setProgresses.map(({ category, progress }) => (
            <SetProgressCard
              key={category}
              category={category}
              progress={progress}
            />
          ))}
        </View>
      )}

      {activeTab === 'countries' && (
        <View style={styles.countriesContainer}>
          {countryProgresses.map(({ country, progress }) => (
            <SetProgressCard
              key={country.id}
              progress={progress}
              country={country}
            />
          ))}
          {countryProgresses.length === 0 && (
            <View style={styles.emptyCountries}>
              <Ionicons name="globe-outline" size={32} color={COLORS.text.muted} />
              <Text style={styles.emptyText}>
                Sammle Karten aus verschiedenen Ländern!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        visible={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        isCollected={selectedCard ? collectedCardIds.includes(selectedCard.id) : false}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  
  // Header
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  headerPercentage: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  
  // Bonus Section
  bonusSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  bonusOverview: {
    gap: 12,
  },
  activeBonuses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bonusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountChip: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  bonusChipText: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  badgesContainer: {
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  badgePartial: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.borderLight,
  },
  badgeFlag: {
    fontSize: 20,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeName: {
    color: COLORS.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeBonus: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  noBonusContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  noBonusText: {
    color: COLORS.text.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  
  // Tab Navigation
  tabNav: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  
  // Cards Grid
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
    justifyContent: 'center',
  },
  
  // Collectible Card
  collectibleCard: {
    position: 'relative',
  },
  cardNotCollected: {
    opacity: 0.5,
  },
  cardGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 12,
    opacity: 0.6,
  },
  cardInner: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: COLORS.surfaceAlt,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  placeholderText: {
    color: COLORS.text.muted,
    fontSize: 24,
    fontWeight: '800',
    marginTop: -10,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    alignItems: 'center',
  },
  cardName: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  rarityText: {
    fontSize: 7,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lockedText: {
    color: COLORS.text.muted,
    fontSize: 7,
    textAlign: 'center',
  },
  countryFlag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
  flagEmoji: {
    fontSize: 12,
  },
  bonusIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 3,
  },
  
  // Sets Container
  setsContainer: {
    padding: 12,
    gap: 10,
  },
  setCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  setCardComplete: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  setIconComplete: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  setFlag: {
    fontSize: 28,
    marginRight: 10,
  },
  setInfo: {
    flex: 1,
  },
  setName: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  setNameComplete: {
    color: '#10B981',
  },
  setProgress: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  completeIcon: {
    marginLeft: 8,
  },
  setProgressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  setProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  setBonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  setBonusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Countries
  countriesContainer: {
    padding: 12,
    gap: 10,
  },
  emptyCountries: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyText: {
    color: COLORS.text.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  
  // Compact Version
  compactContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactStatsText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  compactBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactBonusText: {
    color: '#EC4899',
    fontSize: 11,
    fontWeight: '700',
  },
  compactCards: {
    gap: 8,
    paddingRight: 12,
  },
  moreCardsIndicator: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  moreCardsText: {
    color: COLORS.text.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    width: width - 60,
    maxWidth: 340,
    ...SHADOWS.lg,
  },
  modalCard: {
    width: 180,
    height: 252,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  modalCardImage: {
    width: '100%',
    height: '100%',
  },
  modalCardPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInfo: {
    alignItems: 'center',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalFlag: {
    fontSize: 24,
  },
  modalName: {
    color: COLORS.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  modalRarity: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalDescription: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalBonusText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
  },
  modalLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalLockedText: {
    color: COLORS.text.muted,
    fontSize: 12,
    flex: 1,
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
  },
  modalCloseBtnText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CardCollection;
