// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Pack Opening Overlay (Simplified & Robust)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGame } from '../game/GameProvider';
import Card3D from './Card3D';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PackOpeningOverlay = () => {
  const { packOpeningResult, clearPackResult } = useGame();
  const [step, setStep] = useState(0); // 0=pack, 1=revealing, 2=done
  const [revealedCount, setRevealedCount] = useState(0);
  
  const packScale = useRef(new Animated.Value(0)).current;
  const packShakeX = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;

  // Reset when new pack
  useEffect(() => {
    if (packOpeningResult) {
      setStep(0);
      setRevealedCount(0);
      packScale.setValue(0);
      packShakeX.setValue(0);
      cardsOpacity.setValue(0);
      
      // Animate pack in
      Animated.spring(packScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start(() => {
        // Start shake
        startShake();
      });
    }
  }, [packOpeningResult]);

  const startShake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.loop(
      Animated.sequence([
        Animated.timing(packShakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(packShakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(packShakeX, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(packShakeX, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(packShakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
        Animated.delay(300),
      ]),
      { iterations: -1 }
    ).start();
  };

  const handleOpenPack = () => {
    if (step !== 0) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Explode pack
    Animated.parallel([
      Animated.timing(packScale, { toValue: 3, duration: 300, useNativeDriver: true }),
      Animated.timing(packShakeX, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      packScale.setValue(0);
      setStep(1);
      
      // Show cards
      Animated.timing(cardsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Auto-reveal cards one by one
        revealCards();
      });
    });
  };

  const revealCards = () => {
    const cards = packOpeningResult?.cards || [];
    let count = 0;
    
    const revealNext = () => {
      if (count >= cards.length) {
        setStep(2);
        return;
      }
      
      const card = cards[count];
      if (card.rarity?.id === 'legendary' || card.rarity?.id === 'epic') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      count++;
      setRevealedCount(count);
      
      setTimeout(revealNext, 400);
    };
    
    setTimeout(revealNext, 300);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearPackResult();
  };

  if (!packOpeningResult) return null;

  const cards = packOpeningResult.cards || [];

  return (
    <Modal transparent visible={true} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Pack Phase */}
        {step === 0 && (
          <TouchableOpacity 
            style={styles.packTouchable} 
            onPress={handleOpenPack}
            activeOpacity={0.9}
          >
            <Animated.View 
              style={[
                styles.packWrapper,
                {
                  transform: [
                    { scale: packScale },
                    { translateX: packShakeX },
                  ],
                }
              ]}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9', '#5B21B6']}
                style={styles.pack}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.packShine} />
                <View style={styles.packContent}>
                  <Ionicons name="gift" size={64} color="#FFF" />
                  <Text style={styles.packLabel}>TIPPEN</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Cards Phase */}
        {step >= 1 && (
          <Animated.View style={[styles.cardsArea, { opacity: cardsOpacity }]}>
            <Text style={styles.title}>
              {step === 2 ? '🎉 YOUR CARDS!' : 'Opening...'}
            </Text>
            
            <View style={styles.cardsGrid}>
              {cards.map((card, i) => {
                const isRevealed = i < revealedCount;
                return (
                  <Animated.View 
                    key={i} 
                    style={[
                      styles.cardSlot,
                      isRevealed && styles.cardRevealed,
                    ]}
                  >
                    {isRevealed ? (
                      <Card3D card={card} size="small" interactive={false} showDetails={false} />
                    ) : (
                      <View style={styles.cardHidden}>
                        <Ionicons name="help" size={28} color="#475569" />
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Summary */}
            {step === 2 && (
              <View style={styles.summary}>
                <View style={styles.rarityRow}>
                  {['legendary', 'epic', 'rare', 'common'].map(rarity => {
                    const count = cards.filter(c => c.rarity?.id === rarity).length;
                    if (count === 0) return null;
                    return (
                      <View key={rarity} style={styles.rarityBadge}>
                        <Text style={styles.rarityCount}>{count}x</Text>
                        <Text style={styles.rarityLabel}>{rarity}</Text>
                      </View>
                    );
                  })}
                </View>
                
                <TouchableOpacity style={styles.collectBtn} onPress={handleClose}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.collectGradient}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    <Text style={styles.collectText}>COLLECT</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  // Pack
  packTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  packWrapper: {
    alignItems: 'center',
  },
  pack: {
    width: 180,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 40 },
      android: { elevation: 24 },
      web: { boxShadow: '0 0 80px rgba(139, 92, 246, 0.7)' },
    }),
  },
  packShine: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 100,
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '25deg' }],
  },
  packContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  packLabel: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
  },
  
  // Cards
  cardsArea: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  cardSlot: {
    width: 80,
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardRevealed: {
    transform: [{ scale: 1 }],
  },
  cardHidden: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Summary
  summary: {
    alignItems: 'center',
    gap: 20,
  },
  rarityRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rarityBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rarityCount: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  rarityLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  collectBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' },
    }),
  },
  collectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  collectText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default PackOpeningOverlay;
