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

const FEATURES = [
  { icon: 'map', label: 'Explore' },
  { icon: 'trophy', label: 'Quests' },
  { icon: 'people', label: 'Connect' },
  { icon: 'star', label: 'Rewards' },
];

const AUREA_FEATURES = [
  { icon: 'eye', title: 'Bella Vista Demo', text: 'Visit our dedicated suite for a high-detail showcase of the synergy between the 2D Digital Twin and live navigation.' },
  { icon: 'globe', title: 'Event-Wide Experience', text: 'During the entire Aurea Award, the platform is open for everyone to navigate the venue, discover POIs, and participate in the first "Aurea Quest".' },
  { icon: 'podium', title: 'Live Leaderboard', text: 'While the first official honors for players are slated for 2027, we will publish a live ranking of all participants immediately following the event.' },
];

const CARD_FEATURES = [
  { icon: 'diamond', title: 'Rare & Unique', text: 'Seek out limited-edition motifs exclusive to specific events and hidden park locations.' },
  { icon: 'qr-code', title: 'The Physical Bridge', text: 'Scan QR codes on physical cards to unlock their digital twins in your secure vault.' },
  { icon: 'gift', title: 'Digital Perks', text: 'High-tier cards unlock real-world "Physical Perks" like Queue Jumpers, Golden Tickets, and exclusive discounts.' },
];

// Section Header Component
const SectionHeader = ({ icon, title, subtitle, gold }) => (
  <View style={styles.sectionHeader}>
    <View style={[styles.sectionIconContainer, gold && styles.sectionIconGold]}>
      <Ionicons name={icon} size={22} color={gold ? COLORS.text.primary : COLORS.primary} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

// Feature Card Component
const FeatureCard = ({ icon, title, text }) => (
  <GlassCard style={styles.featureCard} variant="dark">
    <View style={styles.featureCardIcon}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
    </View>
    <Text style={styles.featureCardTitle}>{title}</Text>
    <Text style={styles.featureCardText}>{text}</Text>
  </GlassCard>
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
        colors={COLORS.gradients.hero}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
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
            <Text style={styles.heroTitleGold}>CARTOGRAPHER</Text>{'\n'}
            OF REALITY
          </Text>
          
          <Text style={styles.heroTagline}>
            Where Your Journey Never Ends.{'\n'}
            From the Sofa to the Ride — and into Legend.
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

        {/* PWA Install Button */}
        {canInstall && Platform.OS === 'web' && (
          <TouchableOpacity style={styles.installButton} onPress={handleInstallPWA}>
            <View style={styles.installIconContainer}>
              <Ionicons name="download" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.installTextContainer}>
              <Text style={styles.installTitle}>App installieren</Text>
              <Text style={styles.installSubtitle}>Zum Home-Screen hinzufügen</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.text.muted} />
          </TouchableOpacity>
        )}

        {/* Introduction Section */}
        <View style={styles.section}>
          <View style={styles.highlightBar} />
          <Text style={styles.introTitle}>
            The Map is No Longer Static.{'\n'}
            <Text style={styles.introTitleGold}>Reality is Now Playable.</Text>
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
            icon="compass" 
            title="The Call of the Adventurers" 
            subtitle="Follow in the Footsteps of the ACE"
          />
          <GlassCard style={styles.aceCard} variant="dark">
            <Text style={styles.bodyText}>
              For centuries, the Adventurer's Club of Europe (ACE) has sought to map the unknown. Now, for the first time, the gates of exploration are opening to you.
            </Text>
            <Text style={styles.bodyText}>
              Through the Eternal Path, you step into the shoes of the world's greatest explorers. Our storytelling-driven quest engine turns every corner of the park into a potential discovery.
            </Text>
            <Text style={styles.aceHighlight}>
              Follow the path, complete the challenges, and prove your worth to the Club. The legends are real—and you are now part of them.
            </Text>
          </GlassCard>
        </View>

        {/* Aurea Award Section */}
        <View style={styles.section}>
          <SectionHeader 
            icon="calendar" 
            title="LIVE AT AUREA AWARD 8" 
            subtitle="A Reality-Wide Pilot"
            gold
          />
          <View style={styles.dateCard}>
            <LinearGradient
              colors={COLORS.gradients.gold}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="flash" size={24} color={COLORS.text.primary} />
            <Text style={styles.dateText}>February 2026</Text>
            <Text style={styles.dateSubtext}>Be the First to Walk the Path</Text>
          </View>
          <Text style={styles.bodyText}>
            The future of location-based entertainment is making its official debut at Aurea Award 8. This isn't just a presentation in a room—it is a live, event-wide environment where reality is remapped in real-time.
          </Text>
          
          {AUREA_FEATURES.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>

        {/* Trading Cards Section */}
        <View style={styles.section}>
          <SectionHeader 
            icon="layers" 
            title="COLLECT THE EXTRAORDINARY" 
            subtitle="The Rare Europa-Park Trading Card Series"
          />
          <Text style={styles.bodyText}>
            Your achievements deserve to be immortalized. Through our Collectible Stack, you can earn and trade digital trading cards with varying levels of rarity.
          </Text>
          
          {CARD_FEATURES.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
          
          <Text style={styles.highlightText}>
            Will you be the one to complete the set?
          </Text>
        </View>

        {/* Partnership Section */}
        <View style={styles.section}>
          <SectionHeader 
            icon="people" 
            title="STRATEGY MEETS CREATIVITY"
          />
          <Text style={styles.bodyText}>
            Eternal Path is the result of a unique partnership between the "Architect of Transformation" and the "Visionary of Play."
          </Text>
          
          <GlassCard style={styles.partnerCard} variant="dark">
            <TouchableOpacity
              onPress={() => Linking.openURL('https://ch.linkedin.com/in/ivo-strohhammer-07358972')}
              style={styles.partnerRow}
            >
              <View style={styles.partnerIcon}>
                <Ionicons name="construct" size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>Ivo Strohhammer</Text>
                <Text style={styles.partnerCompany}>toSUMMIT</Text>
                <Text style={styles.partnerDesc}>Ensuring technology is a profitable, scalable engine that solves real-world operational challenges like crowd management and real-time analytics.</Text>
              </View>
              <Ionicons name="logo-linkedin" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </GlassCard>
          
          <GlassCard style={styles.partnerCard} variant="dark">
            <TouchableOpacity
              onPress={() => Linking.openURL('https://de.linkedin.com/in/ramy-t%C3%B6pperwien-11150b25b')}
              style={styles.partnerRow}
            >
              <View style={styles.partnerIcon}>
                <Ionicons name="color-wand" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>Ramy Töpperwien</Text>
                <Text style={styles.partnerCompany}>LUCRAM Media</Text>
                <Text style={styles.partnerDesc}>Infusing the project with world-class storytelling and community-driven gaming concepts for the "Guest of the Future."</Text>
              </View>
              <Ionicons name="logo-linkedin" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaDivider} />
          <Text style={styles.ctaTitle}>
            ARE YOU READY TO{'\n'}
            <Text style={styles.ctaTitleGold}>WALK THE PATH?</Text>
          </Text>
          <Text style={styles.ctaText}>
            From pre-visit AI-guided routing to post-visit global high scores, the adventure never stops. Join us as we redefine the future of leisure.
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
              icon={isLocked ? <Ionicons name="time" size={24} color={COLORS.text.primary} /> : <Ionicons name="compass" size={22} color={COLORS.text.primary} />}
              iconPosition="left"
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
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  
  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerImage: {
    width: width * 0.9,
    height: 50,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: 1,
  },
  heroTitleGold: {
    color: COLORS.primary,
  },
  heroTagline: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
  
  // Features
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  featureLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.muted,
  },
  
  // Install Button
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  installIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    backgroundColor: 'rgba(232, 184, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  installTextContainer: {
    flex: 1,
  },
  installTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  installSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.muted,
  },
  
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232, 184, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionIconGold: {
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Introduction
  highlightBar: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 2,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  introTitleGold: {
    color: COLORS.primary,
  },
  bodyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  highlightText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // ACE Card
  aceCard: {
    padding: 16,
  },
  aceHighlight: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 0,
  },
  
  // Date Card
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: RADII.md,
    marginBottom: 16,
    gap: 12,
    overflow: 'hidden',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  dateSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.primary,
    opacity: 0.8,
  },
  
  // Feature Cards
  featureCard: {
    padding: 14,
    marginBottom: 10,
  },
  featureCardIcon: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    backgroundColor: 'rgba(232, 184, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureCardTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureCardText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  
  // Partner Cards
  partnerCard: {
    marginBottom: 12,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 4,
  },
  partnerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  partnerCompany: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  partnerDesc: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  // CTA Section
  ctaSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  ctaDivider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.borderLight,
    marginBottom: 24,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  ctaTitleGold: {
    color: COLORS.primary,
  },
  ctaText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 320,
  },
  ctaButtonWrapper: {
    width: '100%',
    maxWidth: 300,
  },
  ctaButton: {
    width: '100%',
  },
  ctaButtonText: {
    color: COLORS.text.primary,
    fontWeight: '800',
  },
  ctaButtonTextLocked: {
    fontSize: 16,
    letterSpacing: 0.5,
    fontWeight: '900',
  },
});

export default LandingScreen;
