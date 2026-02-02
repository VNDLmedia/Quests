// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - POI Completion Modal
// ═══════════════════════════════════════════════════════════════════════════
// Shows when all POIs have been scanned - reveals the secret card hint

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

// Confetti particle
const ConfettiParticle = ({ delay, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const colors = ['#E8B84A', '#5DADE2', '#2ECC71', '#E74C3C', '#9B59B6', '#F39C12'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 8 + Math.random() * 10;

  useEffect(() => {
    const duration = 3000 + Math.random() * 2000;
    const drift = (Math.random() - 0.5) * 200;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: drift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (2 + Math.random() * 4),
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          delay: duration * 0.7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: -20,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        transform: [
          { translateY },
          { translateX },
          {
            rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
        opacity,
      }}
    />
  );
};

const POICompletionModal = ({
  visible,
  title = 'Alle Stationen gefunden!',
  text = 'Herzlichen Glückwunsch! Du hast alle Stationen besucht.',
  hintText, // The secret hint where the card is hidden
  imageUrl,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const hintScaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [confettiParticles, setConfettiParticles] = useState([]);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      hintScaleAnim.setValue(0);
      glowAnim.setValue(0);

      // Generate confetti
      const particles = [];
      for (let i = 0; i < 60; i++) {
        particles.push({
          id: i,
          delay: Math.random() * 1000,
          startX: Math.random() * width,
        });
      }
      setConfettiParticles(particles);

      // Animations
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.delay(300),
        Animated.spring(hintScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow loop
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
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {confettiParticles.map((p) => (
          <ConfettiParticle key={p.id} delay={p.delay} startX={p.startX} />
        ))}

        <LinearGradient
          colors={['rgba(13,27,42,0.95)', 'rgba(27,40,56,0.98)']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.container,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Glow */}
          <Animated.View
            style={[
              styles.glowContainer,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(232,184,74,0.5)', 'rgba(232,184,74,0)']}
              style={styles.glow}
            />
          </Animated.View>

          {/* Trophy Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={COLORS.gradients.gold}
              style={styles.iconGradient}
            >
              <Ionicons name="trophy" size={56} color={COLORS.text.primary} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{text}</Text>

          {/* Image */}
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {/* Secret Hint Card */}
          {hintText && (
            <Animated.View
              style={[
                styles.hintCard,
                { transform: [{ scale: hintScaleAnim }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(232,184,74,0.2)', 'rgba(232,184,74,0.05)']}
                style={styles.hintGradient}
              >
                <View style={styles.hintHeader}>
                  <Ionicons name="key" size={24} color={COLORS.primary} />
                  <Text style={styles.hintTitle}>Geheimnis enthüllt!</Text>
                </View>
                <Text style={styles.hintText}>{hintText}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <LinearGradient
              colors={COLORS.gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>Verstanden</Text>
              <Ionicons name="checkmark" size={22} color={COLORS.text.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowContainer: {
    position: 'absolute',
    top: height * 0.12,
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  iconContainer: {
    marginBottom: 24,
    ...SHADOWS.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: RADII.lg,
    marginBottom: 24,
  },
  hintCard: {
    width: '100%',
    borderRadius: RADII.lg,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(232,184,74,0.4)',
  },
  hintGradient: {
    padding: 20,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,184,74,0.2)',
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  hintText: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});

export default POICompletionModal;
