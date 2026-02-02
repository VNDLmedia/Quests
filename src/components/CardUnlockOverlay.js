import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useGame } from '../game/GameProvider';
import { RARITY } from '../game/config/cards';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export const CardUnlockOverlay = () => {
  const { justUnlockedCard, acknowledgeCard } = useGame();
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Animation Values
  const scale = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (justUnlockedCard) {
      // Reset state
      setIsFlipped(false);
      rotateY.setValue(0);
      
      // Entrance Animation
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Floating Effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      scale.setValue(0);
    }
  }, [justUnlockedCard]);

  const handleFlip = () => {
    if (isFlipped) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.sequence([
      // Scale down slightly
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      // Flip
      Animated.parallel([
        Animated.timing(rotateY, {
          toValue: 180,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.1, // Pop out
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Flash effect
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setIsFlipped(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  };

  const handleClose = () => {
    Animated.timing(scale, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      acknowledgeCard();
    });
  };

  if (!justUnlockedCard) return null;

  const frontInterpolate = rotateY.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = rotateY.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = rotateY.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = rotateY.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  return (
    <Modal transparent visible={!!justUnlockedCard} animationType="fade">
      <View style={styles.container}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.content}>
          <Text style={styles.headerText}>NEUE KARTE FREIGESCHALTET!</Text>
          
          <TouchableOpacity activeOpacity={0.9} onPress={handleFlip}>
            <Animated.View style={[
              styles.cardContainer, 
              { transform: [{ scale }, { translateY: floatAnim }] }
            ]}>
              {/* BACK OF CARD (Hidden initially) */}
              <Animated.View style={[
                styles.cardFace, 
                styles.cardBack, 
                { 
                  transform: [{ rotateY: backInterpolate }],
                  opacity: backOpacity
                }
              ]}>
                <LinearGradient
                  colors={justUnlockedCard.rarity.color}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardInnerBorder}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={justUnlockedCard.icon} size={60} color="white" />
                    </View>
                    <Text style={styles.cardName}>{justUnlockedCard.name}</Text>
                    <View style={styles.rarityBadge}>
                      <Text style={styles.rarityText}>{justUnlockedCard.rarity.name}</Text>
                    </View>
                    <Text style={styles.cardDesc}>{justUnlockedCard.description}</Text>
                    
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Ionicons name="flash" size={16} color="#fbbf24" />
                        <Text style={styles.statText}>{justUnlockedCard.power}</Text>
                      </View>
                      <View style={styles.stat}>
                        <Ionicons name="star" size={16} color="#fbbf24" />
                        <Text style={styles.statText}>Lvl {justUnlockedCard.unlockLevel}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* FRONT OF CARD (Visible initially, shows "Tap to Reveal") */}
              <Animated.View style={[
                styles.cardFace, 
                styles.cardFront, 
                { 
                  transform: [{ rotateY: frontInterpolate }],
                  opacity: frontOpacity
                }
              ]}>
                <LinearGradient
                  colors={['#1e293b', '#0f172a']}
                  style={styles.gradient}
                >
                  <View style={[styles.cardInnerBorder, { borderColor: '#334155' }]}>
                    <Ionicons name="help-circle-outline" size={80} color="#475569" />
                    <Text style={styles.tapText}>Tippen zum Enthüllen</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

            </Animated.View>
          </TouchableOpacity>

          {isFlipped && (
            <Animated.View style={{ opacity: scale, marginTop: 40 }}>
              <TouchableOpacity style={styles.collectButton} onPress={handleClose}>
                <LinearGradient
                  colors={['#38bdf8', '#2563eb']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.collectText}>COLLECT</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
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
  content: {
    alignItems: 'center',
    width: '100%',
  },
  headerText: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 40,
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardFace: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardBack: {
    // The revealed side
  },
  cardFront: {
    // The hidden side
  },
  gradient: {
    flex: 1,
    padding: 10,
  },
  cardInnerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cardName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  rarityBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  rarityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 'auto',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 8,
  },
  statText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tapText: {
    color: '#94a3b8',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  collectButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 60,
  },
  collectText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
