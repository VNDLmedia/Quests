// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Pack Shop Screen (Redesigned)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGame } from '../game/GameProvider';
import { PACK_TYPES } from '../game/config/packs';
import { RARITY, getCollectionCompletion, getRarityDistribution } from '../game/config/cards';
import { COLORS, SHADOWS } from '../theme';
import PackOpeningOverlay from '../components/PackOpeningOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PACK_CARD_WIDTH = SCREEN_WIDTH * 0.7;
const PACK_CARD_HEIGHT = 340;

// Featured Pack Component - Large horizontal scrolling cards
const FeaturedPack = ({ packType, packKey, onBuy, canAfford, isActive }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;
  
  // Pulsing glow animation
  useEffect(() => {
    if (isActive && (packType.id === 'elite' || packType.id === 'mythic')) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isActive, packType.id]);
  
  // Shine effect
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isActive]);
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };
  
  const handleBuy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onBuy(packKey);
  };

  const getGuaranteeText = () => {
    if (packType.guarantees?.minLegendary > 0) return '✦ Legendary Guaranteed';
    if (packType.guarantees?.minEpic > 0) return '✦ Epic+ Guaranteed';
    if (packType.guarantees?.minRare > 0) return '✦ Rare+ Guaranteed';
    return null;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleBuy}
      disabled={!canAfford}
    >
      <Animated.View style={[styles.featuredCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={packType.packRarity.colors}
          style={styles.featuredGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Shine overlay */}
          <Animated.View 
            style={[
              styles.shineOverlay,
              {
                transform: [{
                  translateX: shineAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-PACK_CARD_WIDTH, PACK_CARD_WIDTH * 2],
                  }),
                }],
              },
            ]} 
          />
          
          {/* Background pattern */}
          <View style={styles.patternOverlay}>
            <View style={[styles.patternCircle, { top: -50, right: -50 }]} />
            <View style={[styles.patternCircle, { bottom: -30, left: -30, width: 100, height: 100 }]} />
          </View>
          
          {/* Card count badge */}
          <View style={styles.cardCountCorner}>
            <Text style={styles.cardCountNumber}>{packType.cardCount}</Text>
            <Text style={styles.cardCountLabel}>CARDS</Text>
          </View>
          
          {/* Pack icon */}
          <View style={styles.packIconWrap}>
            <View style={styles.packIconGlow} />
            <View style={styles.packIconInner}>
              <Ionicons name={packType.icon} size={56} color="#FFF" />
            </View>
          </View>
          
          {/* Pack info */}
          <Text style={styles.packTitle}>{packType.name}</Text>
          <Text style={styles.packDesc}>{packType.description}</Text>
          
          {/* Guarantee badge */}
          {getGuaranteeText() && (
            <View style={styles.guaranteePill}>
              <Text style={styles.guaranteeText}>{getGuaranteeText()}</Text>
            </View>
          )}
          
          {/* Rarity chances */}
          <View style={styles.oddsRow}>
            {Object.entries(packType.rarityWeights).reverse().slice(0, 3).map(([rarity, chance]) => (
              <View key={rarity} style={styles.oddsPill}>
                <View style={[styles.oddsDot, { backgroundColor: getRarityColor(rarity) }]} />
                <Text style={styles.oddsText}>{(chance * 100).toFixed(0)}%</Text>
              </View>
            ))}
          </View>
          
          {/* Buy button */}
          <View style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}>
            <Ionicons name="diamond" size={20} color={canAfford ? '#FFF' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.buyPrice, !canAfford && styles.buyPriceDisabled]}>
              {packType.cost}
            </Text>
          </View>
          
          {!canAfford && (
            <Text style={styles.notEnoughText}>Nicht genug Gems</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Quick buy mini pack button
const QuickPackButton = ({ packType, packKey, onBuy, canAfford, isSelected, onSelect }) => (
  <TouchableOpacity 
    style={[styles.quickPack, isSelected && styles.quickPackSelected]}
    onPress={() => onSelect(packKey)}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={isSelected ? packType.packRarity.colors : ['#F1F5F9', '#E2E8F0']}
      style={styles.quickPackGradient}
    >
      <Ionicons 
        name={packType.icon} 
        size={22} 
        color={isSelected ? '#FFF' : COLORS.text.secondary} 
      />
      <Text style={[styles.quickPackPrice, isSelected && styles.quickPackPriceActive]}>
        {packType.cost}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Helper to get rarity color
const getRarityColor = (rarity) => {
  const colors = {
    legendary: '#F59E0B',
    epic: '#8B5CF6',
    rare: '#3B82F6',
    common: '#94A3B8',
  };
  return colors[rarity] || colors.common;
};

const PackShopScreen = () => {
  const insets = useSafeAreaInsets();
  const { player, buyPack, openPack, uniqueCards } = useGame();
  const scrollViewRef = useRef(null);
  const [selectedPack, setSelectedPack] = useState('STARTER');
  
  const packKeys = Object.keys(PACK_TYPES);
  const collectionStats = getCollectionCompletion(uniqueCards || []);
  const rarityDist = getRarityDistribution(uniqueCards || []);

  const handleBuyPack = (packKey) => {
    const pack = PACK_TYPES[packKey];
    if ((player.gems || 0) < pack.cost) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    const result = buyPack(packKey);
    if (result?.error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    openPack(packKey);
  };
  
  const handleSelectPack = (packKey) => {
    setSelectedPack(packKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gems */}
        <View style={styles.header}>
          <View style={styles.gemsCard}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.gemsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="diamond" size={28} color="#FFF" />
              <View style={styles.gemsInfo}>
                <Text style={styles.gemsLabel}>Deine Gems</Text>
                <Text style={styles.gemsValue}>{player.gems || 0}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Collection Progress */}
        <View style={styles.collectionSection}>
          <View style={styles.collectionHeader}>
            <Text style={styles.sectionTitle}>Sammlung</Text>
            <Text style={styles.collectionFraction}>
              {collectionStats.owned}/{collectionStats.total}
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={[styles.progressFill, { width: `${Math.max(collectionStats.percentage, 2)}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          
          {/* Rarity breakdown */}
          <View style={styles.rarityRow}>
            {Object.entries(RARITY).map(([key, rarity]) => (
              <View key={key} style={styles.rarityItem}>
                <View style={[styles.rarityDot, { backgroundColor: rarity.color[0] }]} />
                <Text style={styles.rarityCount}>{rarityDist[rarity.id] || 0}</Text>
                <Text style={styles.rarityName}>{rarity.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pack Selection Tabs */}
        <View style={styles.packTabs}>
          {packKeys.map((key) => (
            <QuickPackButton
              key={key}
              packKey={key}
              packType={PACK_TYPES[key]}
              canAfford={(player.gems || 0) >= PACK_TYPES[key].cost}
              isSelected={selectedPack === key}
              onSelect={handleSelectPack}
              onBuy={handleBuyPack}
            />
          ))}
        </View>

        {/* Featured Pack Display */}
        <View style={styles.featuredSection}>
          <FeaturedPack
            packKey={selectedPack}
            packType={PACK_TYPES[selectedPack]}
            onBuy={handleBuyPack}
            canAfford={(player.gems || 0) >= PACK_TYPES[selectedPack].cost}
            isActive={true}
          />
        </View>

        {/* How it works */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>So funktioniert's</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="flag" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.infoText}>Quests erledigen</Text>
            </View>
            <View style={styles.infoArrow}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.text.muted} />
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="diamond" size={20} color="#10B981" />
              </View>
              <Text style={styles.infoText}>Gems verdienen</Text>
            </View>
            <View style={styles.infoArrow}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.text.muted} />
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="gift" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.infoText}>Packs öffnen</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Pack Opening Overlay */}
      <PackOpeningOverlay />
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
  },
  
  // Header
  header: {
    marginBottom: 24,
  },
  gemsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  gemsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  gemsInfo: {
    flex: 1,
  },
  gemsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  gemsValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  
  // Collection
  collectionSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.md,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  collectionFraction: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rarityItem: {
    alignItems: 'center',
    flex: 1,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  rarityCount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  rarityName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.muted,
    textTransform: 'uppercase',
  },
  
  // Pack Tabs
  packTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickPack: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quickPackSelected: {
    ...SHADOWS.md,
  },
  quickPackGradient: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  quickPackPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  quickPackPriceActive: {
    color: '#FFF',
  },
  
  // Featured Pack
  featuredSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  featuredCard: {
    width: PACK_CARD_WIDTH,
    height: PACK_CARD_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
      web: { boxShadow: '0 12px 40px rgba(0,0,0,0.2)' },
    }),
  },
  featuredGradient: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardCountCorner: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardCountNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  cardCountLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  packIconWrap: {
    marginBottom: 16,
    position: 'relative',
  },
  packIconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    top: -10,
    left: -10,
  },
  packIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  packDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  guaranteePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  guaranteeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  oddsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  oddsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  oddsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  oddsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyPrice: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  buyPriceDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  notEnoughText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 8,
  },
  
  // Info Section
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.sm,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  infoArrow: {
    paddingHorizontal: 4,
  },
});

export default PackShopScreen;
