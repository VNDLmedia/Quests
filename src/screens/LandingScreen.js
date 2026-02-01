import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton, GlassCard } from '../components';
import { COLORS, TYPOGRAPHY, BRAND, RADII, SHADOWS } from '../theme';
import { shouldLockApp, getTimeUntilLaunch, formatTimeRemaining } from '../utils/launchTimer';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'map', label: 'Explore' },
  { icon: 'trophy', label: 'Quests' },
  { icon: 'people', label: 'Connect' },
  { icon: 'star', label: 'Rewards' },
];

const LandingScreen = ({ onGetStarted }) => {
  const insets = useSafeAreaInsets();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLocked, setIsLocked] = useState(shouldLockApp());

  // Update countdown timer every second
  useEffect(() => {
    // Initial check
    const locked = shouldLockApp();
    setIsLocked(locked);
    
    if (locked) {
      setTimeRemaining(getTimeUntilLaunch());
      
      // Update every second
      const interval = setInterval(() => {
        const newTimeRemaining = getTimeUntilLaunch();
        setTimeRemaining(newTimeRemaining);
        
        // Check if launch time has been reached
        if (newTimeRemaining.hours === 0 && 
            newTimeRemaining.minutes === 0 && 
            newTimeRemaining.seconds === 0) {
          setIsLocked(false);
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  // Handle button press - only works when not locked
  const handleGetStarted = () => {
    if (!isLocked) {
      onGetStarted();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={COLORS.gradients.hero}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      {/* Decorative circuit lines */}
      <View style={styles.circuitDecor}>
        <View style={[styles.circuitLine, styles.circuitLine1]} />
        <View style={[styles.circuitLine, styles.circuitLine2]} />
        <View style={[styles.circuitDot, { top: '15%', right: '20%' }]} />
        <View style={[styles.circuitDot, { top: '25%', left: '15%' }]} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Logo Image */}
          <Image
            source={require('../../public/img/header.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />

          {/* Tagline */}
          <Text style={styles.heroTagline}>
            Welcome to the first{'\n'}
            <Text style={styles.heroHighlight}>living</Text>,{' '}
            <Text style={styles.heroHighlight}>breathing</Text>,{' '}
            <Text style={styles.heroHighlightGold}>digital</Text> reality.
          </Text>
        </View>

        {/* Features Row */}
        <View style={styles.featuresRow}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Info Card */}
        <GlassCard style={styles.infoCard} variant="dark">
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={COLORS.secondary} />
            <Text style={styles.infoText}>Transform your world into an adventure</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="flash" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>Complete quests, earn rewards, level up</Text>
          </View>
        </GlassCard>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <GlassButton
            title={isLocked ? `Starts in ${formatTimeRemaining(timeRemaining)}` : "Start Your Quest"}
            onPress={handleGetStarted}
            variant="gradient"
            gradient={COLORS.gradients.gold}
            size="lg"
            style={styles.ctaButton}
            icon={isLocked ? <Ionicons name="time" size={22} color="#0D1B2A" /> : <Ionicons name="compass" size={22} color="#0D1B2A" />}
            iconPosition="left"
            textStyle={styles.ctaButtonText}
            disabled={isLocked}
          />

          <Text style={styles.ctaSubtext}>
            {isLocked 
              ? "Launch countdown • Coming soon" 
              : "Free to play • No credit card required"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  circuitDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circuitLine: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  circuitLine1: {
    width: 2,
    height: 120,
    top: 80,
    right: 60,
    transform: [{ rotate: '45deg' }],
  },
  circuitLine2: {
    width: 80,
    height: 2,
    top: 150,
    right: 30,
  },
  circuitDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerImage: {
    width: width * 0.85,
    height: 80,
    marginBottom: 24,
  },
  heroTagline: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
  },
  heroHighlight: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  heroHighlightGold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  featureLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.muted,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
    flex: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  spacer: {
    flex: 1,
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    width: '100%',
    maxWidth: 320,
    ...SHADOWS.glow,
  },
  ctaButtonText: {
    color: '#0D1B2A',
    fontWeight: '800',
  },
  ctaSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.muted,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LandingScreen;
