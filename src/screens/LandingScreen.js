import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  TouchableOpacity,
  Linking,
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
  const bypassTimerRef = useRef(null);

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

  // Cleanup bypass timer on unmount
  useEffect(() => {
    return () => {
      if (bypassTimerRef.current) {
        clearTimeout(bypassTimerRef.current);
      }
    };
  }, []);

  // Handle button press - only works when not locked
  const handleGetStarted = () => {
    if (!isLocked) {
      onGetStarted();
    }
  };

  // Hidden bypass: hold button for 15 seconds to unlock (production only)
  const handleTouchStart = () => {
    if (isLocked) {
      bypassTimerRef.current = setTimeout(() => {
        setIsLocked(false);
        bypassTimerRef.current = null;
      }, 15000); // 15 seconds
    }
  };

  const handleTouchEnd = () => {
    if (bypassTimerRef.current) {
      clearTimeout(bypassTimerRef.current);
      bypassTimerRef.current = null;
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
          {/* Countdown Button Wrapper with Orange Glow */}
          <View
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={[
              styles.ctaButtonWrapper,
              isLocked && styles.ctaButtonWrapperLocked
            ]}
          >
            <GlassButton
              title={isLocked ? `Starts in ${formatTimeRemaining(timeRemaining)}` : "Start Your Quest"}
              onPress={handleGetStarted}
              variant="gradient"
              gradient={isLocked ? ['#E8B84A', '#D4A53D', '#E8B84A'] : COLORS.gradients.gold}
              size="lg"
              style={[styles.ctaButton, isLocked && styles.ctaButtonLocked]}
              icon={isLocked ? <Ionicons name="time" size={24} color="#0D1B2A" /> : <Ionicons name="compass" size={22} color="#0D1B2A" />}
              iconPosition="left"
              textStyle={[styles.ctaButtonText, isLocked && styles.ctaButtonTextLocked]}
            />
          </View>

          <Text style={[styles.ctaSubtext, isLocked && styles.ctaSubtextLocked]}>
            {isLocked 
              ? "Launch countdown • Coming soon" 
              : ""}
          </Text>

          {/* LinkedIn Links */}
          <View style={styles.linkedinContainer}>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://de.linkedin.com/in/ramy-t%C3%B6pperwien-11150b25b')}
              style={styles.linkedinLink}
            >
              <Ionicons name="logo-linkedin" size={16} color={COLORS.primary} />
              <Text style={styles.linkedinText}>Ramy Töpperwien</Text>
            </TouchableOpacity>
            <Text style={styles.linkedinSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://ch.linkedin.com/in/ivo-strohhammer-07358972')}
              style={styles.linkedinLink}
            >
              <Ionicons name="logo-linkedin" size={16} color={COLORS.primary} />
              <Text style={styles.linkedinText}>Ivo Strohhammer</Text>
            </TouchableOpacity>
          </View>
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
    width: width * 0.95,
    height: 60,
    marginBottom: 20
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
    padding: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  infoText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
    flex: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 2,
  },
  spacer: {
    flex: 1,
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaButtonWrapper: {
    width: '100%',
    maxWidth: 320,
  },
  ctaButtonWrapperLocked: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
    borderRadius: RADII.lg,
    borderWidth: 3,
    borderColor: 'rgba(232, 184, 74, 0.6)',
    backgroundColor: 'rgba(232, 184, 74, 0.05)',
  },
  ctaButton: {
    width: '100%',
    ...SHADOWS.glow,
  },
  ctaButtonLocked: {
    opacity: 1,
  },
  ctaButtonText: {
    color: '#0D1B2A',
    fontWeight: '800',
  },
  ctaButtonTextLocked: {
    fontSize: 17,
    letterSpacing: 1,
    fontWeight: '900',
  },
  ctaSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.muted,
    marginTop: 16,
    textAlign: 'center',
  },
  ctaSubtextLocked: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  linkedinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 12,
  },
  linkedinLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkedinText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '500',
  },
  linkedinSeparator: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.muted,
  },
});

export default LandingScreen;
