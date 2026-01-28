// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - 3D Card Component with Holographic Effects
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  PanResponder,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CARD_EFFECTS } from '../game/config/cards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Max rotation angles for 3D tilt
const MAX_ROTATE_X = 15;
const MAX_ROTATE_Y = 15;

export const Card3D = ({ 
  card, 
  size = 'large', // 'small', 'medium', 'large'
  interactive = true,
  showDetails = true,
  onPress,
  isRevealing = false,
  style,
}) => {
  // Animation values
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shinePosition = useRef(new Animated.Value(-1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const holoOffset = useRef(new Animated.Value(0)).current;

  // Size configurations
  const sizeConfig = {
    small: { width: 80, height: 112, fontSize: 8, iconSize: 24 },
    medium: { width: 140, height: 196, fontSize: 12, iconSize: 36 },
    large: { width: CARD_WIDTH, height: CARD_HEIGHT, fontSize: 16, iconSize: 60 },
  };
  
  const dimensions = sizeConfig[size] || sizeConfig.large;

  // Continuous shine animation for holographic effect
  useEffect(() => {
    if (card.effect === CARD_EFFECTS.HOLOGRAPHIC || card.effect === CARD_EFFECTS.FOIL) {
      const shineLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shinePosition, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shinePosition, {
            toValue: -1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      shineLoop.start();
      return () => shineLoop.stop();
    }
  }, [card.effect]);

  // Pulsing glow for legendary/epic cards
  useEffect(() => {
    if (card.rarity.id === 'legendary' || card.rarity.id === 'epic') {
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();
      return () => glowLoop.stop();
    }
  }, [card.rarity.id]);

  // Holographic rainbow shift
  useEffect(() => {
    if (card.effect === CARD_EFFECTS.HOLOGRAPHIC || card.effect === CARD_EFFECTS.PRISMATIC) {
      const holoLoop = Animated.loop(
        Animated.timing(holoOffset, {
          toValue: 360,
          duration: 4000,
          useNativeDriver: false, // Colors can't use native driver
        })
      );
      holoLoop.start();
      return () => holoLoop.stop();
    }
  }, [card.effect]);

  // Pan responder for 3D tilt effect
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      
      onPanResponderGrant: () => {
        Animated.spring(scale, {
          toValue: 1.05,
          friction: 5,
          useNativeDriver: true,
        }).start();
      },
      
      onPanResponderMove: (_, gestureState) => {
        if (!interactive) return;
        
        // Calculate rotation based on gesture position
        const { dx, dy } = gestureState;
        const newRotateY = (dx / dimensions.width) * MAX_ROTATE_Y;
        const newRotateX = -(dy / dimensions.height) * MAX_ROTATE_X;
        
        rotateX.setValue(Math.max(-MAX_ROTATE_X, Math.min(MAX_ROTATE_X, newRotateX)));
        rotateY.setValue(Math.max(-MAX_ROTATE_Y, Math.min(MAX_ROTATE_Y, newRotateY)));
      },
      
      onPanResponderRelease: () => {
        // Spring back to neutral position
        Animated.parallel([
          Animated.spring(rotateX, {
            toValue: 0,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(rotateY, {
            toValue: 0,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
        
        if (onPress) onPress();
      },
    })
  ).current;

  // Build transform style
  const cardTransform = {
    transform: [
      { perspective: 1000 },
      { scale },
      { 
        rotateX: rotateX.interpolate({
          inputRange: [-MAX_ROTATE_X, MAX_ROTATE_X],
          outputRange: [`-${MAX_ROTATE_X}deg`, `${MAX_ROTATE_X}deg`],
        })
      },
      { 
        rotateY: rotateY.interpolate({
          inputRange: [-MAX_ROTATE_Y, MAX_ROTATE_Y],
          outputRange: [`-${MAX_ROTATE_Y}deg`, `${MAX_ROTATE_Y}deg`],
        })
      },
    ],
  };

  // Shine overlay position
  const shineTransform = {
    transform: [
      {
        translateX: shinePosition.interpolate({
          inputRange: [-1, 1],
          outputRange: [-dimensions.width * 1.5, dimensions.width * 1.5],
        }),
      },
      { rotate: '25deg' },
    ],
  };

  // Get holographic overlay colors based on animation
  const getHoloColors = () => {
    if (card.effect === CARD_EFFECTS.HOLOGRAPHIC) {
      return ['rgba(255,0,0,0.2)', 'rgba(0,255,0,0.2)', 'rgba(0,0,255,0.2)', 'rgba(255,0,255,0.2)'];
    }
    if (card.effect === CARD_EFFECTS.GOLDEN) {
      return ['rgba(255,215,0,0.3)', 'rgba(255,165,0,0.3)', 'rgba(255,215,0,0.3)'];
    }
    if (card.effect === CARD_EFFECTS.PRISMATIC) {
      return ['rgba(147,51,234,0.3)', 'rgba(79,70,229,0.3)', 'rgba(236,72,153,0.3)'];
    }
    return ['transparent', 'transparent'];
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cardContainer,
        {
          width: dimensions.width,
          height: dimensions.height,
        },
        cardTransform,
        style,
      ]}
    >
      {/* Glow effect behind card */}
      {(card.rarity.id === 'legendary' || card.rarity.id === 'epic') && (
        <Animated.View 
          style={[
            styles.glowEffect,
            {
              backgroundColor: card.rarity.glowColor,
              opacity: glowOpacity,
              width: dimensions.width + 20,
              height: dimensions.height + 20,
            }
          ]} 
        />
      )}

      {/* Main card gradient */}
      <LinearGradient
        colors={card.rarity.color}
        style={[styles.cardGradient, { borderRadius: dimensions.width * 0.08 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Inner border */}
        <View style={[styles.cardInner, { borderRadius: dimensions.width * 0.06 }]}>
          
          {/* Holographic overlay */}
          {(card.effect === CARD_EFFECTS.HOLOGRAPHIC || 
            card.effect === CARD_EFFECTS.PRISMATIC ||
            card.effect === CARD_EFFECTS.GOLDEN) && (
            <LinearGradient
              colors={getHoloColors()}
              style={styles.holoOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          {/* Shine effect */}
          {(card.effect === CARD_EFFECTS.HOLOGRAPHIC || 
            card.effect === CARD_EFFECTS.FOIL) && (
            <Animated.View style={[styles.shineEffect, shineTransform]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                style={styles.shineGradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              />
            </Animated.View>
          )}

          {/* Top shine */}
          <View style={styles.topShine} />

          {/* Rarity badge */}
          <View style={styles.rarityBadge}>
            <Text style={[styles.rarityText, { fontSize: dimensions.fontSize * 0.7 }]}>
              {card.rarity.name.toUpperCase()}
            </Text>
          </View>

          {/* Card icon */}
          <View style={[styles.iconContainer, { 
            width: dimensions.iconSize * 1.6, 
            height: dimensions.iconSize * 1.6 
          }]}>
            <Ionicons 
              name={card.icon} 
              size={dimensions.iconSize} 
              color="white" 
            />
          </View>

          {/* Card name */}
          {showDetails && (
            <Text style={[styles.cardName, { fontSize: dimensions.fontSize * 1.2 }]}>
              {card.name}
            </Text>
          )}

          {/* Power badge */}
          <View style={styles.powerBadge}>
            <Ionicons name="flash" size={dimensions.fontSize} color="#fbbf24" />
            <Text style={[styles.powerText, { fontSize: dimensions.fontSize }]}>
              {card.power}
            </Text>
          </View>

          {/* Description (large cards only) */}
          {showDetails && size === 'large' && (
            <View style={styles.descriptionBox}>
              <Text style={[styles.descriptionText, { fontSize: dimensions.fontSize * 0.8 }]}>
                {card.description}
              </Text>
            </View>
          )}

        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 0 40px rgba(251, 191, 36, 0.6)',
      },
    }),
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  cardInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  holoOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '200%',
    height: '200%',
    zIndex: 10,
  },
  shineGradient: {
    width: 80,
    height: '100%',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  rarityBadge: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rarityText: {
    color: 'white',
    fontWeight: '800',
    letterSpacing: 1,
  },
  iconContainer: {
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardName: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  powerText: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  descriptionBox: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 10,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default Card3D;
