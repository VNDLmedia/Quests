import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton, GlassCard } from '../components';
import { COLORS, TYPOGRAPHY, BRAND, RADII } from '../theme';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'compass',
    title: 'Entdecke',
    description: 'Erkunde deine Stadt und finde versteckte Orte',
  },
  {
    icon: 'layers',
    title: 'Quests',
    description: 'Absolviere Abenteuer und sammle Belohnungen',
  },
  {
    icon: 'people',
    title: 'Community',
    description: 'Verbinde dich mit anderen Entdeckern',
  },
  {
    icon: 'trophy',
    title: 'Erfolge',
    description: 'Schalte Achievements frei und steige auf',
  },
];

const LandingScreen = ({ onGetStarted }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[COLORS.primaryLight, COLORS.background, COLORS.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* App Icon / Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={COLORS.gradients.primary}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="compass" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Brand Name */}
          <Text style={styles.brandName}>{BRAND.name}</Text>
          
          {/* Tagline */}
          <Text style={styles.tagline}>{BRAND.tagline}</Text>

          {/* Hero Description */}
          <Text style={styles.heroDescription}>
            Verwandle deinen Alltag in ein Abenteuer. Entdecke neue Orte, 
            schließe Quests ab und werde Teil einer Community von Entdeckern.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Was dich erwartet</Text>
          
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <GlassCard key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons
                    name={feature.icon}
                    size={28}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <GlassButton
            title="Start your path"
            onPress={onGetStarted}
            variant="gradient"
            gradient={COLORS.gradients.primary}
            size="lg"
            style={styles.ctaButton}
            icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            iconPosition="right"
          />

          <Text style={styles.ctaSubtext}>
            Kostenlos starten • Keine Kreditkarte erforderlich
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: RADII.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `0px 8px 24px ${COLORS.primary}40`,
      },
    }),
  },
  brandName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 48,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: width > 400 ? (width - 64) / 2 : '100%',
    padding: 20,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  ctaSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  ctaButton: {
    width: '100%',
    maxWidth: 320,
  },
  ctaSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.muted,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LandingScreen;
