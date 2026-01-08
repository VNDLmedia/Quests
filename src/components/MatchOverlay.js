import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image,
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

/**
 * MatchOverlay - Visuell schönes "Match"-Overlay
 * 
 * Erscheint wenn zwei User sich connecten.
 * Mit Haptic Feedback und Confetti-Animation.
 */
const MatchOverlay = ({
  visible = false,
  user1 = {},
  user2 = {},
  karmaEarned = 50,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const karmaAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array(12).fill(0).map(() => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Haptic Feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Main Animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(rotateAnim1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(karmaAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti Animation
      confettiAnims.forEach((anim, index) => {
        const delay = index * 50;
        const direction = index % 2 === 0 ? 1 : -1;
        
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.y, {
              toValue: height * 0.5,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, {
              toValue: direction * (Math.random() * 150 + 50),
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: Math.random() * 4,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(1500),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();
      });
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim1.setValue(0);
      rotateAnim2.setValue(0);
      karmaAnim.setValue(0);
      confettiAnims.forEach((anim) => {
        anim.y.setValue(0);
        anim.x.setValue(0);
        anim.opacity.setValue(1);
        anim.rotate.setValue(0);
      });
    }
  }, [visible]);

  const rotate1 = rotateAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const rotate2 = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['15deg', '0deg'],
  });

  const karmaScale = karmaAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.3, 1],
  });

  const confettiColors = [
    '#FF6B35', '#FF9F1C', '#0EA5E9', '#8B5CF6', 
    '#10B981', '#F43F5E', '#FCD34D', '#A78BFA',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        {Platform.OS === 'web' ? (
          <View style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]} />
        ) : (
          <BlurView intensity={30} tint="dark" style={styles.backdrop} />
        )}

        {/* Confetti */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                left: width / 2 - 5 + (index - 6) * 10,
                top: height * 0.3,
                transform: [
                  { translateY: anim.y },
                  { translateX: anim.x },
                  { rotate: anim.rotate.interpolate({
                    inputRange: [0, 4],
                    outputRange: ['0deg', '1440deg'],
                  })},
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Connected Text */}
          <LinearGradient
            colors={COLORS.gradients.electricBlue}
            style={styles.connectedBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="flash" size={16} color="#FFF" />
            <Text style={styles.connectedText}>CONNECTED!</Text>
          </LinearGradient>

          {/* Avatars */}
          <View style={styles.avatarsContainer}>
            <Animated.View style={[styles.avatarWrapper, { transform: [{ rotate: rotate1 }] }]}>
              <LinearGradient
                colors={COLORS.gradients.electricBlue}
                style={styles.avatarBorder}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={user1.avatar || require('../../assets/icon.png')}
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>
              <Text style={styles.userName}>{user1.name || 'Du'}</Text>
            </Animated.View>

            {/* Heart Icon */}
            <View style={styles.heartContainer}>
              <LinearGradient
                colors={COLORS.gradients.roseGold}
                style={styles.heartBg}
              >
                <Ionicons name="heart" size={24} color="#FFF" />
              </LinearGradient>
            </View>

            <Animated.View style={[styles.avatarWrapper, { transform: [{ rotate: rotate2 }] }]}>
              <LinearGradient
                colors={COLORS.gradients.mysticPurple}
                style={styles.avatarBorder}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={user2.avatar || require('../../assets/icon.png')}
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>
              <Text style={styles.userName}>{user2.name || 'Neuer Kontakt'}</Text>
            </Animated.View>
          </View>

          {/* Karma Earned */}
          <Animated.View 
            style={[
              styles.karmaContainer,
              { transform: [{ scale: karmaScale }] },
            ]}
          >
            <Text style={styles.karmaLabel}>KARMA VERDIENT</Text>
            <Text style={styles.karmaValue}>+{karmaEarned}</Text>
          </Animated.View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradients.electricBlue}
              style={styles.closeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.closeText}>Weiter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 40,
    gap: 8,
  },
  connectedText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
    ...SHADOWS.strong,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  heartContainer: {
    marginHorizontal: -15,
    zIndex: 10,
  },
  heartBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  karmaContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  karmaLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  karmaValue: {
    color: '#FCD34D',
    fontSize: 48,
    fontWeight: '900',
  },
  closeButton: {
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  closeGradient: {
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  closeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MatchOverlay;

