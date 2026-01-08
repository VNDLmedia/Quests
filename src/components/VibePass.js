import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

/**
 * VibePass - Der "Vibe Pass" (Profil & QR)
 * 
 * Sieht aus wie eine hochwertige Konzertkarte oder Kreditkarte aus Glas.
 * Enthält: Foto, Name, Tags und den dynamischen Scan-Code.
 */
const VibePass = ({
  user = {},
  style,
  compact = false,
}) => {
  const {
    id = 'VIBE-2024-001',
    name = 'Max Mustermann',
    avatar = null,
    tags = ['#Design', '#Networking'],
    karmaPoints = 1250,
    isSpotlight = false,
    qrValue = null,
  } = user;

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer-Effekt
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

  const cardHeight = compact ? CARD_HEIGHT * 0.7 : CARD_HEIGHT;

  const renderContent = () => (
    <View style={styles.content}>
      {/* Header mit Logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>VIBE</Text>
        {isSpotlight && (
          <View style={styles.spotlightBadge}>
            <Text style={styles.spotlightText}>★ SPOTLIGHT</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Avatar & Info */}
        <View style={styles.userInfo}>
          <View style={[
            styles.avatarContainer,
            isSpotlight && styles.avatarSpotlight,
          ]}>
            <Image
              source={avatar || require('../../assets/icon.png')}
              style={styles.avatar}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.tagsRow}>
              {tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* QR Code */}
        {!compact && (
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrValue || `vibe://user/${id}`}
                size={70}
                color="#0F172A"
                backgroundColor="white"
              />
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.idLabel}>PASS ID</Text>
          <Text style={styles.idValue}>{id}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.karmaLabel}>KARMA</Text>
          <Text style={styles.karmaValue}>{karmaPoints.toLocaleString()}</Text>
        </View>
      </View>

      {/* Shimmer Effect */}
      <Animated.View 
        style={[
          styles.shimmer,
          { transform: [{ translateX: shimmerTranslate }] },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.15)',
            'transparent',
          ]}
          style={styles.shimmerGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </View>
  );

  // Web Fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height: cardHeight }, style]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
          style={[styles.card, styles.webCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: cardHeight }, style]}>
      <BlurView intensity={80} tint="light" style={styles.blurView}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.85)',
            'rgba(255, 255, 255, 0.6)',
          ]}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: RADII.xl,
    overflow: 'hidden',
    ...SHADOWS.strong,
  },
  blurView: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  webCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
    color: COLORS.text.primary,
  },
  spotlightBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spotlightText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  avatarSpotlight: {
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  qrContainer: {
    marginLeft: 16,
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    ...SHADOWS.soft,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 12,
    marginTop: 12,
  },
  footerLeft: {},
  footerRight: {
    alignItems: 'flex-end',
  },
  idLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.text.muted,
    letterSpacing: 1,
  },
  idValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  karmaLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.text.muted,
    letterSpacing: 1,
  },
  karmaValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0EA5E9',
    marginTop: 2,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
  },
});

export default VibePass;

