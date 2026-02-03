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

// Helper to encode image URL properly (handles spaces and special characters)
const encodeImageUrl = (url) => {
  if (!url) return null;
  // If it's already a full URL with protocol, use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Split path and encode each segment to handle spaces and special chars
  const segments = url.split('/');
  const encodedSegments = segments.map(segment => 
    segment ? encodeURIComponent(segment) : segment
  );
  return encodedSegments.join('/');
};

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
  const rawImageUrl = infoContent?.image_url || infoContent?.imageUrl;
  const hasImage = !!rawImageUrl;
  const imageUrl = encodeImageUrl(rawImageUrl);

  // Fullscreen image mode for POIs
  if (hasImage) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.fullscreenOverlay}>
          {/* Fullscreen Image */}
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />

          {/* Overlay gradient at bottom for content and button */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
            style={[styles.fullscreenGradient, { paddingBottom: insets.bottom + 24 }]}
          >
            {/* Title */}
            <Text style={styles.fullscreenTitle}>{infoContent?.title || quest.title}</Text>
            
            {/* Text content */}
            {infoContent?.text && (
              <ScrollView 
                style={styles.fullscreenTextScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.fullscreenText}>{infoContent.text}</Text>
              </ScrollView>
            )}
            
            {/* Points badge */}
            <View style={styles.fullscreenPointsBadge}>
              <Ionicons name="trophy" size={20} color={COLORS.primary} />
              <Text style={styles.fullscreenPoints}>+{scoreReward} Punkte</Text>
            </View>

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
          </LinearGradient>
        </View>
      </Modal>
    );
  }

  // Standard quest completion modal (no image)
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
          <Text style={styles.congratsText}>Quest Complete!</Text>
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
                <Text style={styles.rewardLabel}>Points</Text>
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
                  <Text style={[styles.rewardLabel, { color: 'rgba(255,255,255,0.8)' }]}>New Card!</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </View>

          {/* Info Content text (if provided) */}
          {infoContent && infoContent.text && (
            <View style={styles.infoContainer}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoTitle}>
                  {infoContent.title || 'Did you know?'}
                </Text>
              </View>
              <ScrollView style={styles.infoScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.infoText}>{infoContent.text}</Text>
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
              <Text style={styles.continueText}>Continue</Text>
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
  // Fullscreen image mode styles
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenImage: {
    flex: 1,
    width: '100%',
  },
  fullscreenGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  fullscreenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  fullscreenTextScroll: {
    maxHeight: 120,
    width: '100%',
    marginBottom: 16,
  },
  fullscreenText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  fullscreenPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(232,184,74,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  fullscreenPoints: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
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
