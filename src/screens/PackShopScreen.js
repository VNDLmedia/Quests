// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Pack Shop Screen (Light Theme)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGame } from '../game/GameProvider';
import { PACK_TYPES } from '../game/config/packs';
import { RARITY, CARDS, getCollectionCompletion, getRarityDistribution } from '../game/config/cards';
import { GlassCard } from '../components';
import { COLORS, SHADOWS } from '../theme';
import PackOpeningOverlay from '../components/PackOpeningOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pack Card Component
const PackCard = ({ packType, packKey, onBuy, canAfford, gems }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Pulsing glow for premium packs
  React.useEffect(() => {
    if (packType.id === 'elite' || packType.id === 'mythic') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [packType.id]);
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!canAfford) {
      Alert.alert('Not enough gems', `You need ${packType.cost} gems for this pack.`);
      return;
    }
    onBuy(packKey);
  };

  // Get probability display
  const getRarityChances = () => {
    const weights = packType.rarityWeights;
    return [
      { rarity: 'Legendary', chance: weights.legendary * 100, color: RARITY.LEGENDARY.color[0] },
      { rarity: 'Epic', chance: weights.epic * 100, color: RARITY.EPIC.color[0] },
      { rarity: 'Rare', chance: weights.rare * 100, color: RARITY.RARE.color[0] },
    ];
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.packCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={packType.packRarity.colors}
          style={styles.packGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.packContent}>
            {/* Pack icon */}
            <View style={styles.packIconContainer}>
              <Ionicons name={packType.icon} size={40} color="white" />
              <View style={styles.cardCountBadge}>
                <Text style={styles.cardCountText}>{packType.cardCount}</Text>
              </View>
            </View>
            
            {/* Pack name */}
            <Text style={styles.packName}>{packType.name}</Text>
            <Text style={styles.packDescription}>{packType.description}</Text>
            
            {/* Rarity chances */}
            <View style={styles.chancesContainer}>
              {getRarityChances().map((item, index) => (
                <View key={index} style={styles.chanceItem}>
                  <View style={[styles.chanceDot, { backgroundColor: item.color }]} />
                  <Text style={styles.chanceText}>
                    {item.rarity}: {item.chance.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Guarantees */}
            {packType.guarantees && (
              <View style={styles.guaranteeBadge}>
                {packType.guarantees.minLegendary > 0 && (
                  <Text style={styles.guaranteeText}>
                    <Ionicons name="checkmark-circle" size={12} color="#fbbf24" /> Guaranteed Legendary
                  </Text>
                )}
                {packType.guarantees.minEpic > 0 && !packType.guarantees.minLegendary && (
                  <Text style={styles.guaranteeText}>
                    <Ionicons name="checkmark-circle" size={12} color="#a78bfa" /> Guaranteed Epic+
                  </Text>
                )}
                {packType.guarantees.minRare > 0 && !packType.guarantees.minEpic && (
                  <Text style={styles.guaranteeText}>
                    <Ionicons name="checkmark-circle" size={12} color="#60a5fa" /> Guaranteed Rare+
                  </Text>
                )}
              </View>
            )}
            
            {/* Price button */}
            <View style={[styles.priceButton, !canAfford && styles.priceButtonDisabled]}>
              <Ionicons name="diamond" size={16} color={canAfford ? COLORS.primary : COLORS.text.muted} />
              <Text style={[styles.priceText, !canAfford && styles.priceTextDisabled]}>
                {packType.cost}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const PackShopScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { player, buyPack, openPack, collection, uniqueCards } = useGame();
  
  // Collection stats
  const collectionStats = getCollectionCompletion(uniqueCards || []);
  const rarityDist = getRarityDistribution(uniqueCards || []);

  const handleBuyPack = (packKey) => {
    const result = buyPack(packKey);
    
    if (result?.error) {
      Alert.alert('Error', result.error);
      return;
    }
    
    // Immediately open the pack
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    openPack(packKey);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gems Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceLeft}>
              <View style={styles.gemIconWrapper}>
                <Ionicons name="diamond" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.balanceLabel}>Your Balance</Text>
                <Text style={styles.gemCount}>{player.gems || 0}</Text>
              </View>
            </View>
            <View style={styles.balanceRight}>
              <Text style={styles.collectionLabel}>Collection</Text>
              <Text style={styles.collectionCount}>
                {collectionStats.owned}/{collectionStats.total}
              </Text>
              <View style={styles.collectionBar}>
                <View 
                  style={[
                    styles.collectionProgress, 
                    { width: `${collectionStats.percentage}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Rarity Stats */}
        <View style={styles.rarityStats}>
          {Object.entries(RARITY).map(([key, rarity]) => (
            <View key={key} style={styles.rarityStat}>
              <View style={[styles.rarityDot, { backgroundColor: rarity.color[0] }]} />
              <Text style={styles.rarityStatText}>
                {rarityDist[rarity.id] || 0}
              </Text>
              <Text style={styles.rarityStatLabel}>{rarity.name}</Text>
            </View>
          ))}
        </View>

        {/* Section Header */}
        <Text style={styles.sectionTitle}>Card Packs</Text>

        {/* Pack Grid */}
        <View style={styles.packGrid}>
          {Object.entries(PACK_TYPES).map(([key, packType]) => (
            <PackCard
              key={key}
              packKey={key}
              packType={packType}
              onBuy={handleBuyPack}
              canAfford={(player.gems || 0) >= packType.cost}
              gems={player.gems || 0}
            />
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoTitle}>How does it work?</Text>
          </View>
          <Text style={styles.infoText}>
            • Complete quests to earn gems{'\n'}
            • Buy packs with your gems{'\n'}
            • Open packs and collect rare cards{'\n'}
            • Duplicates are automatically converted to gems
          </Text>
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
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  gemCount: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  collectionLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  collectionCount: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  collectionBar: {
    width: 80,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  collectionProgress: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  rarityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  rarityStat: {
    alignItems: 'center',
    gap: 4,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rarityStatText: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  rarityStatLabel: {
    color: COLORS.text.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  packGrid: {
    gap: 16,
  },
  packCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  packGradient: {
    borderRadius: 20,
  },
  packContent: {
    padding: 20,
    alignItems: 'center',
  },
  packIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cardCountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.surface,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  cardCountText: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  packName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  packDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  chancesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  chanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chanceText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  guaranteeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  guaranteeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    ...SHADOWS.md,
  },
  priceButtonDisabled: {
    backgroundColor: COLORS.surfaceAlt,
    opacity: 0.7,
  },
  priceText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  priceTextDisabled: {
    color: COLORS.text.muted,
  },
  infoCard: {
    marginTop: 24,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  infoText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    lineHeight: 22,
  },
});

export default PackShopScreen;
