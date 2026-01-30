// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Pack Shop (Premium Design)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef } from 'react';
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
import { RARITY, getCollectionCompletion } from '../game/config/cards';
import { COLORS, SHADOWS } from '../theme';
import PackOpeningOverlay from '../components/PackOpeningOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium Pack Card
const PackCard = ({ packType, packKey, onBuy, canAfford, featured }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };
  
  const handleBuy = () => {
    if (!canAfford) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onBuy(packKey);
  };

  const getGuarantee = () => {
    if (packType.guarantees?.minLegendary > 0) return { text: 'Legendary garantiert', icon: 'star', color: '#F59E0B' };
    if (packType.guarantees?.minEpic > 0) return { text: 'Epic+ garantiert', icon: 'diamond', color: '#8B5CF6' };
    if (packType.guarantees?.minRare > 0) return { text: 'Rare+ garantiert', icon: 'shield', color: '#3B82F6' };
    return null;
  };

  const guarantee = getGuarantee();
  const isPremium = packType.id === 'mythic' || packType.id === 'elite';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleBuy}
    >
      <Animated.View style={[
        styles.packCard,
        featured && styles.packCardFeatured,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <LinearGradient
          colors={packType.packRarity.colors}
          style={styles.packGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative elements */}
          {isPremium && (
            <>
              <View style={[styles.glowOrb, { top: -20, right: -20 }]} />
              <View style={[styles.glowOrb, { bottom: -30, left: -30, opacity: 0.3 }]} />
            </>
          )}
          
          <View style={styles.packInner}>
            {/* Header */}
            <View style={styles.packHeader}>
              <View style={styles.packBadge}>
                <Ionicons name={packType.icon} size={20} color="#FFF" />
              </View>
              <View style={styles.cardCountChip}>
                <Text style={styles.cardCountText}>{packType.cardCount} Karten</Text>
              </View>
            </View>
            
            {/* Content */}
            <View style={styles.packBody}>
              <Text style={styles.packName}>{packType.name}</Text>
              <Text style={styles.packDesc}>{packType.description}</Text>
              
              {guarantee && (
                <View style={[styles.guaranteeChip, { backgroundColor: guarantee.color + '30' }]}>
                  <Ionicons name={guarantee.icon} size={14} color={guarantee.color} />
                  <Text style={[styles.guaranteeText, { color: guarantee.color }]}>
                    {guarantee.text}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Footer */}
            <View style={styles.packFooter}>
              <View style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}>
                <Ionicons name="diamond" size={18} color={canAfford ? '#FFF' : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.buyPrice, !canAfford && styles.buyPriceDisabled]}>
                  {packType.cost}
                </Text>
              </View>
              {!canAfford && (
                <Text style={styles.notEnough}>Zu wenig Gems</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const PackShopScreen = () => {
  const insets = useSafeAreaInsets();
  const { player, buyPack, openPack, uniqueCards } = useGame();
  
  const collectionStats = getCollectionCompletion(uniqueCards || []);

  const handleBuyPack = (packKey) => {
    const pack = PACK_TYPES[packKey];
    if ((player.gems || 0) < pack.cost) return;
    
    const result = buyPack(packKey);
    if (!result?.error) {
      openPack(packKey);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Header */}
        <View style={styles.wallet}>
          <LinearGradient
            colors={['#1E1B4B', '#312E81']}
            style={styles.walletGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.walletLeft}>
              <View style={styles.gemIcon}>
                <Ionicons name="diamond" size={24} color="#A78BFA" />
              </View>
              <View>
                <Text style={styles.walletLabel}>Dein Guthaben</Text>
                <Text style={styles.walletValue}>{player.gems || 0}</Text>
              </View>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletRight}>
              <Text style={styles.collectionLabel}>Sammlung</Text>
              <Text style={styles.collectionValue}>{collectionStats.percentage.toFixed(0)}%</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${collectionStats.percentage}%` }]} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Packs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kartenpacks</Text>
          <Text style={styles.sectionSub}>Wähle ein Pack und sammle Karten</Text>
          
          <View style={styles.packsList}>
            {Object.entries(PACK_TYPES).map(([key, pack], index) => (
              <PackCard
                key={key}
                packKey={key}
                packType={pack}
                onBuy={handleBuyPack}
                canAfford={(player.gems || 0) >= pack.cost}
                featured={index === Object.keys(PACK_TYPES).length - 1}
              />
            ))}
          </View>
        </View>

        {/* Odds Info */}
        <View style={styles.oddsCard}>
          <View style={styles.oddsHeader}>
            <Ionicons name="analytics" size={18} color={COLORS.primary} />
            <Text style={styles.oddsTitle}>Drop-Raten</Text>
          </View>
          <View style={styles.oddsGrid}>
            {Object.entries(RARITY).map(([key, rarity]) => (
              <View key={key} style={styles.oddsItem}>
                <View style={[styles.oddsDot, { backgroundColor: rarity.color[0] }]} />
                <Text style={styles.oddsName}>{rarity.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.oddsHint}>
            Höherwertige Packs haben bessere Chancen auf seltene Karten!
          </Text>
        </View>
      </ScrollView>
      
      <PackOpeningOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 20,
  },
  
  // Wallet
  wallet: {
    marginBottom: 28,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 32px rgba(30, 27, 75, 0.3)' },
    }),
  },
  walletGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  walletLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gemIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  walletValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  walletDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
  },
  walletRight: {
    alignItems: 'flex-end',
  },
  collectionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  collectionValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  progressTrack: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  
  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 20,
  },
  
  // Packs List
  packsList: {
    gap: 16,
  },
  packCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  packCardFeatured: {
    ...Platform.select({
      ios: { shadowColor: '#8B5CF6', shadowOpacity: 0.4, shadowRadius: 20 },
      web: { boxShadow: '0 12px 40px rgba(139, 92, 246, 0.3)' },
    }),
  },
  packGradient: {
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  packInner: {
    padding: 20,
  },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCountChip: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  packBody: {
    marginBottom: 20,
  },
  packName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  packDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  guaranteeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  guaranteeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  packFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buyBtnDisabled: {
    opacity: 0.5,
  },
  buyPrice: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  buyPriceDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
  notEnough: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Odds Card
  oddsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.md,
  },
  oddsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  oddsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  oddsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  oddsItem: {
    alignItems: 'center',
    gap: 6,
  },
  oddsDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  oddsName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  oddsHint: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PackShopScreen;
