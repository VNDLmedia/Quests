// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Pack Shop Screen
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
import { RARITY, getCollectionCompletion, getRarityDistribution } from '../game/config/cards';
import { ScreenHeader, GlassCard } from '../components';
import PackOpeningOverlay from '../components/PackOpeningOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pack Card Component
const PackCard = ({ packType, packKey, onBuy, canAfford, gems }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Pulsing glow for premium packs
  React.useEffect(() => {
    if (packType.id === 'legendary' || packType.id === 'mythic') {
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
      toValue: 0.95,
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
      Alert.alert('Nicht genug Gems', `Du brauchst ${packType.cost} Gems für dieses Pack.`);
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
        {/* Glow effect */}
        {(packType.id === 'elite' || packType.id === 'mythic') && (
          <Animated.View
            style={[
              styles.packGlow,
              {
                backgroundColor: packType.packRarity.glowColor,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.6],
                }),
              },
            ]}
          />
        )}
        
        <LinearGradient
          colors={packType.packRarity.colors}
          style={styles.packGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.packContent}>
            {/* Pack icon */}
            <View style={styles.packIconContainer}>
              <Ionicons name={packType.icon} size={48} color="white" />
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
                    <Ionicons name="checkmark-circle" size={12} color="#fbbf24" /> Garantiert Legendary
                  </Text>
                )}
                {packType.guarantees.minEpic > 0 && !packType.guarantees.minLegendary && (
                  <Text style={styles.guaranteeText}>
                    <Ionicons name="checkmark-circle" size={12} color="#a78bfa" /> Garantiert Epic+
                  </Text>
                )}
                {packType.guarantees.minRare > 0 && !packType.guarantees.minEpic && (
                  <Text style={styles.guaranteeText}>
                    <Ionicons name="checkmark-circle" size={12} color="#60a5fa" /> Garantiert Rare+
                  </Text>
                )}
              </View>
            )}
            
            {/* Price button */}
            <View style={[styles.priceButton, !canAfford && styles.priceButtonDisabled]}>
              <Ionicons name="diamond" size={18} color={canAfford ? '#38bdf8' : '#64748b'} />
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
  const [selectedPack, setSelectedPack] = useState(null);
  
  // Collection stats
  const collectionStats = getCollectionCompletion(uniqueCards);
  const rarityDist = getRarityDistribution(uniqueCards);

  const handleBuyPack = (packKey) => {
    const result = buyPack(packKey);
    
    if (result?.error) {
      Alert.alert('Fehler', result.error);
      return;
    }
    
    // Immediately open the pack
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    openPack(packKey);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Card Shop" />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gems Balance */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceContent}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>Dein Guthaben</Text>
                <View style={styles.gemDisplay}>
                  <Ionicons name="diamond" size={28} color="#38bdf8" />
                  <Text style={styles.gemCount}>{player.gems}</Text>
                </View>
              </View>
              <View style={styles.balanceRight}>
                <Text style={styles.collectionLabel}>Sammlung</Text>
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
          </LinearGradient>
        </View>

        {/* Rarity Stats */}
        <View style={styles.rarityStats}>
          {Object.entries(RARITY).map(([key, rarity]) => (
            <View key={key} style={styles.rarityStat}>
              <View style={[styles.rarityDot, { backgroundColor: rarity.color[0] }]} />
              <Text style={styles.rarityStatText}>
                {rarityDist[rarity.id] || 0}
              </Text>
            </View>
          ))}
        </View>

        {/* Section Header */}
        <Text style={styles.sectionTitle}>Kartenpacks</Text>
        <Text style={styles.sectionSubtitle}>
          Öffne Packs und sammle alle Karten!
        </Text>

        {/* Pack Grid */}
        <View style={styles.packGrid}>
          {Object.entries(PACK_TYPES).map(([key, packType]) => (
            <PackCard
              key={key}
              packKey={key}
              packType={packType}
              onBuy={handleBuyPack}
              canAfford={player.gems >= packType.cost}
              gems={player.gems}
            />
          ))}
        </View>

        {/* Info Section */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#38bdf8" />
            <Text style={styles.infoTitle}>Wie funktioniert's?</Text>
          </View>
          <Text style={styles.infoText}>
            • Schließe Quests ab, um Gems zu verdienen{'\n'}
            • Kaufe Packs mit deinen Gems{'\n'}
            • Öffne Packs und sammle seltene Karten{'\n'}
            • Duplikate werden automatisch in Gems umgewandelt
          </Text>
        </GlassCard>
      </ScrollView>
      
      {/* Pack Opening Overlay */}
      <PackOpeningOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  balanceCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: 20,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {},
  balanceLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  gemDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gemCount: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  collectionLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  collectionCount: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  collectionBar: {
    width: 100,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  collectionProgress: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  rarityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 25,
  },
  rarityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rarityStatText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 20,
  },
  packGrid: {
    gap: 15,
  },
  packCard: {
    marginBottom: 5,
  },
  packGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 26,
  },
  packGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  packContent: {
    padding: 20,
    alignItems: 'center',
  },
  packIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardCountBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#0f172a',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  packDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
  },
  chancesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  chanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chanceText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  guaranteeBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 15,
  },
  guaranteeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  priceButtonDisabled: {
    borderColor: 'rgba(100, 116, 139, 0.3)',
    opacity: 0.6,
  },
  priceText: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '800',
  },
  priceTextDisabled: {
    color: '#64748b',
  },
  infoCard: {
    marginTop: 30,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 24,
  },
});

export default PackShopScreen;
