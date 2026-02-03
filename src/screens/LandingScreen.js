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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton, GlassCard } from '../components';
import { COLORS, TYPOGRAPHY, RADII, SHADOWS } from '../theme';
import { shouldLockApp, getTimeUntilLaunch, formatTimeRemaining } from '../utils/launchTimer';

const { width } = Dimensions.get('window');
const LINKEDIN_BLUE = '#0077b5';

const FEATURES = [
  { icon: 'map-outline', label: 'Explore' },
  { icon: 'trophy-outline', label: 'Quests' },
  { icon: 'people-outline', label: 'Connect' },
  { icon: 'star-outline', label: 'Rewards' },
];

const AUREA_FEATURES = [
  { title: 'Bella Vista Demo', text: 'Visit our dedicated suite for a high-detail showcase of the synergy between the 2D Digital Twin and live navigation.' },
  { title: 'Event-Wide Experience', text: 'During the entire Aurea Award, the platform is open for everyone to navigate the venue, discover POIs, and participate in the first "Aurea Quest".' },
  { title: 'Live Leaderboard', text: 'While the first official honors for players are slated for 2027, we will publish a live ranking of all participants immediately following the event.' },
];

const CARD_FEATURES = [
  { title: 'Rare & Unique', text: 'Seek out limited-edition motifs exclusive to specific events and hidden park locations.' },
  { title: 'The Physical Bridge', text: 'Scan QR codes on physical cards to unlock their digital twins in your secure vault.' },
  { title: 'Digital Perks', text: 'High-tier cards unlock real-world "Physical Perks" like Queue Jumpers, Golden Tickets, and exclusive discounts.' },
];

// Simplified Section Header (No Icons, Cleaner Typography)
const SectionHeader = ({ title, subtitle, gold }) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, gold && styles.textGold]}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    <View style={[styles.sectionDivider, gold && styles.bgGold]} />
  </View>
);

// Cleaner Feature Card (Minimalist)
const FeatureCard = ({ title, text }) => (
  <View style={styles.featureCard}>
    <Text style={styles.featureCardTitle}>{title}</Text>
    <Text style={styles.featureCardText}>{text}</Text>
  </View>
);

// LinkedIn Button Component
const LinkedInButton = ({ name, role, url }) => (
  <TouchableOpacity 
    style={styles.linkedInButton}
    onPress={() => Linking.openURL(url)}
    activeOpacity={0.8}
  >
    <View style={styles.linkedInIconBox}>
      <Ionicons name="logo-linkedin" size={24} color="#fff" />
    </View>
    <View style={styles.linkedInContent}>
      <Text style={styles.linkedInName}>{name}</Text>
      <Text style={styles.linkedInRole}>{role}</Text>
    </View>
    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ opacity: 0.7 }} />
  </TouchableOpacity>
);

const LandingScreen = ({ onGetStarted }) => {
  const insets = useSafeAreaInsets();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLocked, setIsLocked] = useState(shouldLockApp());
  const bypassTimerRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  // PWA Install prompt handler
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    const locked = shouldLockApp();
    setIsLocked(locked);
    
    if (locked) {
      setTimeRemaining(getTimeUntilLaunch());
      
      const interval = setInterval(() => {
        const newTimeRemaining = getTimeUntilLaunch();
        setTimeRemaining(newTimeRemaining);
        
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

  useEffect(() => {
    return () => {
      if (bypassTimerRef.current) {
        clearTimeout(bypassTimerRef.current);
      }
    };
  }, []);

  const handleGetStarted = () => {
    if (!isLocked) {
      onGetStarted();
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  const handleTouchStart = () => {
    if (isLocked) {
      bypassTimerRef.current = setTimeout(() => {
        setIsLocked(false);
        bypassTimerRef.current = null;
      }, 15000);
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
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../public/img/header.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />
          
          <Text style={styles.heroTitle}>
            BECOME A{'\n'}
            <Text style={styles.textGold}>CARTOGRAPHER</Text>{'\n'}
            OF REALITY
          </Text>
          
          <Text style={styles.heroTagline}>
            Where Your Journey Never Ends.{'\n'}
            From the Sofa to the Ride — and into Legend.
          </Text>

          <View
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={[styles.ctaButtonWrapper, { marginTop: 32 }]}
          >
            <GlassButton
              title={isLocked ? `Starts in ${formatTimeRemaining(timeRemaining)}` : "Start Your Quest"}
              onPress={handleGetStarted}
              variant="gradient"
              gradient={isLocked ? [COLORS.text.muted, COLORS.surface, COLORS.text.muted] : COLORS.gradients.gold}
              size="lg"
              style={styles.ctaButton}
              icon={isLocked ? <Ionicons name="time-outline" size={24} color={COLORS.text.primary} /> : null}
              textStyle={[styles.ctaButtonText, isLocked && styles.ctaButtonTextLocked]}
            />
          </View>
        </View>

        {/* Features Row - Simplified */}
        <View style={styles.featuresRow}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={feature.icon} size={24} color={COLORS.text.secondary} />
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* PWA Install Button */}
        {canInstall && Platform.OS === 'web' && (
          <TouchableOpacity style={styles.installButton} onPress={handleInstallPWA}>
            <View style={styles.installContent}>
              <Text style={styles.installTitle}>Install App</Text>
              <Text style={styles.installSubtitle}>Add to home screen</Text>
            </View>
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Introduction Section */}
        <View style={styles.section}>
          <Text style={styles.introTitle}>
            The Map is No Longer Static.{'\n'}
            <Text style={styles.textGold}>Reality is Now Playable.</Text>
          </Text>
          <Text style={styles.bodyText}>
            Imagine a world where the physical and digital are no longer separate. Eternal Path is not just an app; it is a revolutionary "Operational Guest Experience" platform. We have transformed the traditional 2D Digital Twin into a living, breathing ecosystem where your movements shape the story.
          </Text>
          <Text style={styles.bodyText}>
            Whether you are navigating the intricate paths of Europa-Park, hunting for secrets in a museum, or exploring a modern shopping mall, you are no longer just a visitor.
          </Text>
          <Text style={styles.highlightText}>
            You are a Cartographer of Reality.
          </Text>
        </View>

        {/* ACE Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="The Call of the Adventurers" 
            subtitle="Follow in the Footsteps of the ACE"
          />
          <View style={styles.cleanCard}>
            <Text style={styles.bodyText}>
              For centuries, the Adventurer's Club of Europe (ACE) has sought to map the unknown. Now, for the first time, the gates of exploration are opening to you.
            </Text>
            <Text style={styles.bodyText}>
              Through the Eternal Path, you step into the shoes of the world's greatest explorers. Our storytelling-driven quest engine turns every corner of the park into a potential discovery.
            </Text>
            <Text style={styles.aceHighlight}>
              Follow the path, complete the challenges, and prove your worth to the Club. The legends are real—and you are now part of them.
            </Text>
          </View>
        </View>

        {/* Aurea Award Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="LIVE AT AUREA AWARD 8" 
            subtitle="A Reality-Wide Pilot"
            gold
          />
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>February 2026</Text>
            <Text style={styles.dateSubtext}>Be the First to Walk the Path</Text>
          </View>
          <Text style={styles.bodyText}>
            The future of location-based entertainment is making its official debut at Aurea Award 8. This isn't just a presentation in a room—it is a live, event-wide environment where reality is remapped in real-time.
          </Text>
          
          <View style={styles.featureGrid}>
            {AUREA_FEATURES.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </View>
        </View>

        {/* Trading Cards Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="COLLECT THE EXTRAORDINARY" 
            subtitle="The Rare Europa-Park Trading Card Series"
          />
          <Text style={styles.bodyText}>
            Your achievements deserve to be immortalized. Through our Collectible Stack, you can earn and trade digital trading cards with varying levels of rarity.
          </Text>
          
          <View style={styles.featureGrid}>
            {CARD_FEATURES.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </View>
          
          <Text style={styles.highlightText}>
            Will you be the one to complete the set?
          </Text>
        </View>

        {/* Partnership Section - Redesigned LinkedIn Style */}
        <View style={styles.section}>
          <SectionHeader 
            title="STRATEGY MEETS CREATIVITY"
          />
          <Text style={[styles.bodyText, { marginBottom: 24 }]}>
            Eternal Path is the result of a unique partnership between the "Architect of Transformation" and the "Visionary of Play."
          </Text>
          
          <View style={styles.linkedInContainer}>
            <LinkedInButton 
              name="Ivo Strohhammer"
              role="toSUMMIT"
              url="https://ch.linkedin.com/in/ivo-strohhammer-07358972"
            />
            <View style={{ height: 12 }} />
            <LinkedInButton 
              name="Ramy Töpperwien"
              role="LUCRAM Media"
              url="https://de.linkedin.com/in/ramy-t%C3%B6pperwien-11150b25b"
            />
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>
            ARE YOU READY TO{'\n'}
            <Text style={styles.textGold}>WALK THE PATH?</Text>
          </Text>
          
          <View
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={styles.ctaButtonWrapper}
          >
            <GlassButton
              title={isLocked ? `Starts in ${formatTimeRemaining(timeRemaining)}` : "Start Your Quest"}
              onPress={handleGetStarted}
              variant="gradient"
              gradient={isLocked ? [COLORS.text.muted, COLORS.surface, COLORS.text.muted] : COLORS.gradients.gold}
              size="lg"
              style={styles.ctaButton}
              icon={isLocked ? <Ionicons name="time-outline" size={24} color={COLORS.text.primary} /> : null}
              textStyle={[styles.ctaButtonText, isLocked && styles.ctaButtonTextLocked]}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24, // More breathing room for mobile
  },
  
  // Typography Helpers
  textGold: {
    color: COLORS.primary,
  },
  bgGold: {
    backgroundColor: COLORS.primary,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerImage: {
    width: width * 0.8,
    height: 60,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  heroTagline: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    maxWidth: 300,
  },
  
  // Features Row
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  // Install Button
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  installContent: {
    flex: 1,
  },
  installTitle: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  installSubtitle: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  
  // Sections
  section: {
    marginBottom: 48,
  },
  sectionHeader: {
    marginBottom: 24,
    alignItems: 'flex-start', // Left aligned for cleaner look
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 12,
  },
  sectionDivider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.text.muted,
    opacity: 0.3,
  },
  
  // Intro
  introTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'left',
    lineHeight: 32,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    color: '#A0A0A0', // Softer than pure white/grey
    lineHeight: 26, // Better readability
    marginBottom: 16,
    textAlign: 'left',
  },
  highlightText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'left',
    marginTop: 8,
  },
  
  // Clean Card (No Glass)
  cleanCard: {
    paddingVertical: 8,
  },
  aceHighlight: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 24,
  },
  
  // Date Display
  dateDisplay: {
    marginBottom: 24,
  },
  dateText: {
    fontSize: 28,
    fontWeight: '300', // Thinner, cleaner
    color: COLORS.primary,
    marginBottom: 4,
  },
  dateSubtext: {
    fontSize: 14,
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Feature Grid
  featureGrid: {
    gap: 16,
    marginTop: 8,
  },
  featureCard: {
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 16,
  },
  featureCardTitle: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  featureCardText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  
  // LinkedIn Section
  linkedInContainer: {
    marginTop: 8,
  },
  linkedInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LINKEDIN_BLUE,
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  linkedInIconBox: {
    marginRight: 16,
  },
  linkedInContent: {
    flex: 1,
  },
  linkedInName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  linkedInRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  
  // CTA Section
  ctaSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 32,
  },
  ctaButtonWrapper: {
    width: '100%',
    maxWidth: 320,
  },
  ctaButton: {
    width: '100%',
  },
  ctaButtonText: {
    color: COLORS.text.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  ctaButtonTextLocked: {
    fontSize: 16,
  },
});

export default LandingScreen;
