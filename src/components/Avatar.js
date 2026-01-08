import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';

/**
 * Avatar - Rundes Profilbild mit Status-Ring
 * 
 * Wie bei Instagram Stories:
 * - Farbiger Ring zeigt Status an
 * - Animierter Ring für aktive States
 * - Spotlight-Ring (Gold) für VIPs
 */
const Avatar = ({
  source,
  size = 48,
  status = null, // 'active' | 'story' | 'spotlight' | 'networking' | null
  showRing = true,
  ringWidth = 3,
  style,
  onPress,
  animated = false,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated && status) {
      // Pulse Animation für aktive Status
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotation für Spotlight
      if (status === 'spotlight') {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      }
    }
  }, [animated, status]);

  const getStatusColors = () => {
    if (!status || !showRing) return null;
    return COLORS.statusRing[status] || COLORS.statusRing.active;
  };

  const statusColors = getStatusColors();
  const totalSize = size + (statusColors ? ringWidth * 2 + 4 : 0);
  
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderRing = () => {
    if (!statusColors) return null;

    return (
      <Animated.View 
        style={[
          styles.ringContainer,
          { 
            width: totalSize, 
            height: totalSize,
            transform: [
              { scale: animated ? pulseAnim : 1 },
              { rotate: status === 'spotlight' ? rotation : '0deg' },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={statusColors}
          style={[styles.ring, { borderRadius: totalSize / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { width: totalSize, height: totalSize }, style]}>
      {renderRing()}
      
      {/* Weißer Innen-Ring (Gap) */}
      <View style={[
        styles.innerRing,
        {
          width: size + 4,
          height: size + 4,
          borderRadius: (size + 4) / 2,
        },
      ]}>
        {/* Profilbild */}
        <Image
          source={source || require('../../assets/icon.png')}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          defaultSource={require('../../assets/icon.png')}
        />
      </View>
    </View>
  );
};

// Mini-Avatar für Map-Ansicht (User-Position)
export const MapAvatar = ({ source, size = 40, showTorch = true }) => {
  const torchAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (showTorch) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(torchAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(torchAnim, {
            toValue: 0.6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showTorch]);

  return (
    <View style={styles.mapAvatarContainer}>
      {/* Torch Light / Lichtkegel */}
      {showTorch && (
        <Animated.View 
          style={[
            styles.torchLight,
            {
              opacity: torchAnim,
              transform: [{ scale: torchAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(56, 189, 248, 0.4)', 'rgba(56, 189, 248, 0)']}
            style={styles.torchGradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 0 }}
          />
        </Animated.View>
      )}
      
      {/* Avatar */}
      <View style={[styles.mapAvatarRing, { width: size + 6, height: size + 6 }]}>
        <Image
          source={source || require('../../assets/icon.png')}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: '100%',
    height: '100%',
  },
  innerRing: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  image: {
    backgroundColor: '#E2E8F0',
  },
  // Map Avatar Styles
  mapAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchLight: {
    position: 'absolute',
    width: 120,
    height: 120,
    top: -60,
  },
  torchGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  mapAvatarRing: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#38BDF8',
    ...SHADOWS.medium,
  },
});

export default Avatar;

