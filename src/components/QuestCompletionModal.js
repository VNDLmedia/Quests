// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Quest Completion Modal
// ═══════════════════════════════════════════════════════════════════════════
// Fullscreen celebration modal when user completes a quest

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, RADII, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

// Confetti particle component
const ConfettiParticle = ({ delay, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const colors = ['#E8B84A', '#5DADE2', '#2ECC71', '#E74C3C', '#9B59B6', '#F39C12'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const duration = 2500 + Math.random() * 1500;
    const drift = (Math.random() - 0.5) * 150;

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
          toValue: 360 * (2 + Math.random() * 3),
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
      style={[
        styles.confetti,
        {
          left: startX,
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
        },
      ]}
    />
  );
};

const QuestCompletionModal = ({ 
  visible, 
  quest, 
  rewards, // { score, card } - card is the awarded card object
  infoContent, 
  onClose 
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rewardScaleScore = useRef(new Animated.Value(0)).current;
  const rewardScaleCard = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [confettiParticles, setConfettiParticles] = useState([]);

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rewardScaleScore.setValue(0);
      rewardScaleCard.setValue(0);
      glowAnim.setValue(0);

      // Generate confetti particles
      const particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          id: i,
          delay: Math.random() * 800,
          startX: Math.random() * width,
        });
      }
      setConfettiParticles(particles);

      // Start animations
      Animated.sequence([
        // Main card bounce in
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        // Rewards pop in sequence
        Animated.stagger(150, [
          Animated.spring(rewardScaleScore, {
            toValue: 1,
            friction: 6,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.spring(rewardScaleCard, {
            toValue: 1,
            friction: 6,
            tension: 120,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Glow animation loop
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

  if (!visible || !quest) return null;

  const scoreReward = rewards?.score || 10;
  const cardReward = rewards?.card || null;

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

        {/* Background gradient */}
        <LinearGradient
          colors={['rgba(13,27,42,0.95)', 'rgba(27,40,56,0.98)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Main content */}
        <Animated.View
          style={[
            styles.container,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Glow effect behind icon */}
          <Animated.View
            style={[
              styles.glowContainer,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(232,184,74,0.4)', 'rgba(232,184,74,0)']}
              style={styles.glow}
            />
          </Animated.View>

          {/* Success icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={COLORS.gradients.gold}
              style={styles.iconGradient}
            >
              <Ionicons name="checkmark" size={48} color={COLORS.text.primary} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.congratsText}>Quest Abgeschlossen!</Text>
          <Text style={styles.questTitle}>{quest.title}</Text>

          {/* Rewards */}
          <View style={styles.rewardsContainer}>
            <Animated.View
              style={[
                styles.rewardCard,
                { transform: [{ scale: rewardScaleScore }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(232,184,74,0.2)', 'rgba(232,184,74,0.05)']}
                style={styles.rewardGradient}
              >
                <Ionicons name="trophy" size={28} color={COLORS.primary} />
                <Text style={[styles.rewardValue, { color: COLORS.primary }]}>+{scoreReward}</Text>
                <Text style={styles.rewardLabel}>Punkte</Text>
              </LinearGradient>
            </Animated.View>

            {cardReward && (
              <Animated.View
                style={[
                  styles.rewardCard,
                  { transform: [{ scale: rewardScaleCard }] },
                ]}
              >
                <LinearGradient
                  colors={cardReward.rarity?.color || ['rgba(93,173,226,0.2)', 'rgba(93,173,226,0.05)']}
                  style={styles.rewardGradient}
                >
                  <Ionicons name={cardReward.icon || 'albums'} size={28} color="#FFF" />
                  <Text style={[styles.rewardValue, { color: '#FFF', fontSize: 14 }]}>
                    {cardReward.name}
                  </Text>
                  <Text style={[styles.rewardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Neue Karte!</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </View>

          {/* Info Content (if provided) */}
          {infoContent && (
            <View style={styles.infoContainer}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoTitle}>
                  {infoContent.title || 'Wusstest du?'}
                </Text>
              </View>
              <ScrollView style={styles.infoScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.infoText}>{infoContent.text}</Text>
                {infoContent.imageUrl && (
                  <Image
                    source={{ uri: infoContent.imageUrl }}
                    style={styles.infoImage}
                    resizeMode="cover"
                  />
                )}
              </ScrollView>
            </View>
          )}

          {/* Continue button */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <LinearGradient
              colors={COLORS.gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>Weiter</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.text.primary} />
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
    top: height * 0.15,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconContainer: {
    marginBottom: 24,
    ...SHADOWS.xl,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  rewardCard: {
    borderRadius: RADII.lg,
    overflow: 'hidden',
  },
  rewardGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 8,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#5DADE2',
  },
  rewardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoContainer: {
    width: '100%',
    maxHeight: height * 0.25,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  infoScroll: {
    maxHeight: height * 0.15,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text.secondary,
  },
  infoImage: {
    width: '100%',
    height: 120,
    borderRadius: RADII.md,
    marginTop: 12,
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
  confetti: {
    position: 'absolute',
    top: -20,
  },
});

export default QuestCompletionModal;
