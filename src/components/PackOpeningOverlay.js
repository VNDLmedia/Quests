// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Pack Opening Overlay with Dopamine-Maximizing Animations
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { PACK_TYPES } from '../game/config/packs';
import Card3D from './Card3D';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation phases
const PHASES = {
  IDLE: 'idle',
  PACK_ENTRANCE: 'pack_entrance',
  PACK_SHAKE: 'pack_shake',
  PACK_EXPLODE: 'pack_explode',
  CARDS_FLY_OUT: 'cards_fly_out',
  CARD_REVEAL: 'card_reveal',
  COMPLETE: 'complete',
};

// Particle component for explosion effects
const Particle = ({ delay, color, startX, startY }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const angle = Math.random() * Math.PI * 2;
  const distance = 100 + Math.random() * 200;
  const endX = Math.cos(angle) * distance;
  const endY = Math.sin(angle) * distance;
  
  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: endX,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: endY,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          left: startX,
          top: startY,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    />
  );
};

// Sparkle component for card reveals
const Sparkle = ({ x, y, delay }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: x,
          top: y,
          opacity,
          transform: [
            { scale },
            {
              rotate: rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name="sparkles" size={24} color="#fbbf24" />
    </Animated.View>
  );
};

export const PackOpeningOverlay = () => {
  const { packOpeningResult, clearPackResult } = useGame();
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [particles, setParticles] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const [showLegendaryFlash, setShowLegendaryFlash] = useState(false);
  
  // Animation refs
  const packScale = useRef(new Animated.Value(0)).current;
  const packRotate = useRef(new Animated.Value(0)).current;
  const packY = useRef(new Animated.Value(50)).current;
  const packOpacity = useRef(new Animated.Value(1)).current;
  const packShake = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const cardsContainerOpacity = useRef(new Animated.Value(0)).current;
  const cardScales = useRef([]).current;
  const cardFlips = useRef([]).current;
  const backgroundGlow = useRef(new Animated.Value(0)).current;
  
  // Initialize card animations when result changes
  useEffect(() => {
    if (packOpeningResult?.cards) {
      cardScales.length = 0;
      cardFlips.length = 0;
      packOpeningResult.cards.forEach(() => {
        cardScales.push(new Animated.Value(0));
        cardFlips.push(new Animated.Value(0));
      });
    }
  }, [packOpeningResult]);

  // Main animation sequence
  useEffect(() => {
    if (packOpeningResult) {
      setPhase(PHASES.PACK_ENTRANCE);
      setCurrentCardIndex(0);
      runPackEntrance();
    } else {
      resetAnimations();
    }
  }, [packOpeningResult]);

  const resetAnimations = () => {
    setPhase(PHASES.IDLE);
    packScale.setValue(0);
    packRotate.setValue(0);
    packY.setValue(50);
    packOpacity.setValue(1);
    packShake.setValue(0);
    flashOpacity.setValue(0);
    cardsContainerOpacity.setValue(0);
    backgroundGlow.setValue(0);
    setParticles([]);
    setSparkles([]);
    setShowLegendaryFlash(false);
    setCurrentCardIndex(0);
  };

  // Phase 1: Pack entrance with dramatic appearance
  const runPackEntrance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.spring(packScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(packY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundGlow, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPhase(PHASES.PACK_SHAKE);
      // Auto-start shake after a moment
      setTimeout(() => {
        if (phase !== PHASES.COMPLETE) {
          runPackShake();
        }
      }, 500);
    });
  };

  // Phase 2: Pack shakes with anticipation
  const runPackShake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Shake animation
    const shakeSequence = Animated.sequence([
      ...Array(6).fill(null).map((_, i) => 
        Animated.timing(packShake, {
          toValue: i % 2 === 0 ? 10 : -10,
          duration: 50,
          useNativeDriver: true,
        })
      ),
      Animated.timing(packShake, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]);

    // Increase intensity
    Animated.sequence([
      shakeSequence,
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(packScale, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        shakeSequence,
      ]),
    ]).start();
  };

  // Phase 3: Pack explodes on tap
  const handlePackTap = useCallback(() => {
    if (phase !== PHASES.PACK_SHAKE) return;
    
    setPhase(PHASES.PACK_EXPLODE);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Generate explosion particles
    const packColors = ['#fbbf24', '#f59e0b', '#ef4444', '#ffffff', '#38bdf8'];
    const newParticles = [];
    for (let i = 0; i < 40; i++) {
      newParticles.push({
        id: i,
        color: packColors[Math.floor(Math.random() * packColors.length)],
        startX: SCREEN_WIDTH / 2 - 5,
        startY: SCREEN_HEIGHT / 2 - 100,
        delay: Math.random() * 200,
      });
    }
    setParticles(newParticles);
    
    // Pack explosion animation
    Animated.parallel([
      Animated.timing(packScale, {
        toValue: 2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(packOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      setTimeout(() => {
        setPhase(PHASES.CARDS_FLY_OUT);
        runCardsAppear();
      }, 300);
    });
  }, [phase]);

  // Phase 4: Cards appear and fan out
  const runCardsAppear = () => {
    Animated.timing(cardsContainerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Stagger card appearances
    packOpeningResult?.cards.forEach((card, index) => {
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        Animated.spring(cardScales[index], {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }, index * 200);
    });
    
    // After all cards appear, start reveal phase
    setTimeout(() => {
      setPhase(PHASES.CARD_REVEAL);
      revealNextCard(0);
    }, (packOpeningResult?.cards.length || 0) * 200 + 500);
  };

  // Phase 5: Cards flip to reveal
  const revealNextCard = (index) => {
    if (!packOpeningResult?.cards || index >= packOpeningResult.cards.length) {
      setPhase(PHASES.COMPLETE);
      return;
    }
    
    const card = packOpeningResult.cards[index];
    setCurrentCardIndex(index);
    
    // Heavy haptic for legendary/epic
    if (card.rarity.id === 'legendary') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowLegendaryFlash(true);
      
      // Gold flash effect
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => setShowLegendaryFlash(false));
      
      // Generate sparkles
      const newSparkles = [];
      for (let i = 0; i < 15; i++) {
        newSparkles.push({
          id: `sparkle_${index}_${i}`,
          x: Math.random() * SCREEN_WIDTH,
          y: Math.random() * SCREEN_HEIGHT,
          delay: Math.random() * 500,
        });
      }
      setSparkles(prev => [...prev, ...newSparkles]);
    } else if (card.rarity.id === 'epic') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Flip animation
    Animated.timing(cardFlips[index], {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        revealNextCard(index + 1);
      }, 800);
    });
  };

  // Handle close
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearPackResult();
  };

  if (!packOpeningResult) return null;

  const cards = packOpeningResult.cards || [];
  const hasLegendary = cards.some(c => c.rarity.id === 'legendary');
  const hasEpic = cards.some(c => c.rarity.id === 'epic');

  return (
    <Modal transparent visible={!!packOpeningResult} animationType="fade">
      <View style={styles.container}>
        <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Background glow */}
        <Animated.View
          style={[
            styles.backgroundGlow,
            {
              opacity: backgroundGlow,
              backgroundColor: hasLegendary ? '#fbbf24' : hasEpic ? '#8b5cf6' : '#3b82f6',
            },
          ]}
        />
        
        {/* Flash effect */}
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashOpacity,
              backgroundColor: showLegendaryFlash ? '#fbbf24' : '#ffffff',
            },
          ]}
        />
        
        {/* Particles */}
        {particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
        
        {/* Sparkles */}
        {sparkles.map((s) => (
          <Sparkle key={s.id} {...s} />
        ))}

        {/* Pack (Phase 1-2) */}
        {(phase === PHASES.PACK_ENTRANCE || phase === PHASES.PACK_SHAKE || phase === PHASES.PACK_EXPLODE) && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePackTap}
            disabled={phase !== PHASES.PACK_SHAKE}
          >
            <Animated.View
              style={[
                styles.packContainer,
                {
                  opacity: packOpacity,
                  transform: [
                    { scale: packScale },
                    { translateY: packY },
                    { translateX: packShake },
                    {
                      rotateZ: packRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#4f46e5', '#7c3aed', '#8b5cf6']}
                style={styles.pack}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.packInner}>
                  <Ionicons name="gift" size={60} color="white" />
                  <Text style={styles.packText}>TIPPEN ZUM ÖFFNEN</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Cards (Phase 3-5) */}
        {(phase === PHASES.CARDS_FLY_OUT || phase === PHASES.CARD_REVEAL || phase === PHASES.COMPLETE) && (
          <Animated.View style={[styles.cardsContainer, { opacity: cardsContainerOpacity }]}>
            <Text style={styles.headerText}>
              {phase === PHASES.COMPLETE ? 'DEINE NEUEN KARTEN!' : 'ENTHÜLLEN...'}
            </Text>
            
            <View style={styles.cardsRow}>
              {cards.map((card, index) => {
                const isRevealed = phase === PHASES.COMPLETE || index < currentCardIndex || 
                  (index === currentCardIndex && cardFlips[index]?._value > 0.5);
                
                return (
                  <Animated.View
                    key={`card_${index}`}
                    style={[
                      styles.cardWrapper,
                      {
                        transform: [
                          { scale: cardScales[index] || 0 },
                          {
                            rotateY: (cardFlips[index] || new Animated.Value(0)).interpolate({
                              inputRange: [0, 1],
                              outputRange: ['180deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {isRevealed ? (
                      <Card3D 
                        card={card} 
                        size="small" 
                        interactive={false}
                        showDetails={false}
                      />
                    ) : (
                      <View style={styles.cardBack}>
                        <LinearGradient
                          colors={['#1e293b', '#0f172a']}
                          style={styles.cardBackGradient}
                        >
                          <Ionicons name="help" size={30} color="#475569" />
                        </LinearGradient>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Summary when complete */}
            {phase === PHASES.COMPLETE && (
              <View style={styles.summary}>
                <View style={styles.rarityCount}>
                  {Object.entries(
                    cards.reduce((acc, card) => {
                      acc[card.rarity.name] = (acc[card.rarity.name] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([rarity, count]) => (
                    <View key={rarity} style={styles.rarityItem}>
                      <Text style={styles.rarityCountText}>{count}x</Text>
                      <Text style={styles.rarityName}>{rarity}</Text>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity style={styles.collectButton} onPress={handleClose}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.collectGradient}
                  >
                    <Text style={styles.collectText}>EINSAMMELN</Text>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 50,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 60,
  },
  packContainer: {
    alignItems: 'center',
  },
  pack: {
    width: 200,
    height: 280,
    borderRadius: 20,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 0 60px rgba(139, 92, 246, 0.6)',
      },
    }),
  },
  packInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  packText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 2,
  },
  cardsContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 30,
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  cardWrapper: {
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    width: 80,
    height: 112,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardBackGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
  },
  summary: {
    alignItems: 'center',
    marginTop: 20,
  },
  rarityCount: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  rarityItem: {
    alignItems: 'center',
  },
  rarityCountText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rarityName: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  collectButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
      },
    }),
  },
  collectGradient: {
    paddingVertical: 16,
    paddingHorizontal: 50,
  },
  collectText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default PackOpeningOverlay;
