import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SHADOWS } from '../theme';

/**
 * POIMarker - Point of Interest Marker für die Map
 * 
 * 3D-Icons die sanft über den Gebäuden schweben (Wipp-Animation).
 * Verschiedene Typen: Stand, Stage, Food, Info, etc.
 */
const POIMarker = ({
  type = 'default', // 'stand' | 'stage' | 'food' | 'info' | 'sponsor' | 'wc'
  title,
  isActive = false,
  isHighlighted = false,
  crowdLevel = 0, // 0-100, für Heatmap
  onPress,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Wipp-Animation (schwebendes Gefühl)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isHighlighted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isHighlighted]);

  const getTypeConfig = () => {
    switch (type) {
      case 'stand':
        return {
          icon: 'storefront',
          gradient: COLORS.gradients.electricBlue,
          label: 'Stand',
        };
      case 'stage':
        return {
          icon: 'mic',
          gradient: COLORS.gradients.mysticPurple,
          label: 'Stage',
        };
      case 'food':
        return {
          icon: 'restaurant',
          gradient: COLORS.gradients.sunsetOrange,
          label: 'Food',
        };
      case 'drinks':
        return {
          icon: 'beer',
          gradient: COLORS.gradients.freshMint,
          label: 'Drinks',
        };
      case 'info':
        return {
          icon: 'information-circle',
          gradient: COLORS.gradients.electricBlue,
          label: 'Info',
        };
      case 'sponsor':
        return {
          icon: 'star',
          gradient: COLORS.gradients.roseGold,
          label: 'Sponsor',
        };
      case 'wc':
        return {
          icon: 'body',
          gradient: ['#64748B', '#94A3B8'],
          label: 'WC',
        };
      case 'exit':
        return {
          icon: 'exit',
          gradient: ['#64748B', '#94A3B8'],
          label: 'Ausgang',
        };
      default:
        return {
          icon: 'location',
          gradient: COLORS.gradients.electricBlue,
          label: 'POI',
        };
    }
  };

  const config = getTypeConfig();

  // Heatmap Glow basierend auf crowdLevel
  const getHeatmapColor = () => {
    if (crowdLevel < 30) return null;
    if (crowdLevel < 60) return 'rgba(251, 113, 133, 0.3)';
    if (crowdLevel < 80) return 'rgba(168, 85, 247, 0.4)';
    return 'rgba(239, 68, 68, 0.5)';
  };

  const heatmapColor = getHeatmapColor();

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [
            { translateY: floatAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Heatmap Glow */}
      {heatmapColor && (
        <View style={[styles.heatmapGlow, { backgroundColor: heatmapColor }]} />
      )}

      {/* Schatten auf dem Boden */}
      <View style={styles.shadow} />
      
      {/* Marker */}
      <LinearGradient
        colors={config.gradient}
        style={styles.marker}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={config.icon} size={20} color="#FFF" />
      </LinearGradient>

      {/* Label */}
      {title && (
        <View style={styles.labelContainer}>
          <Text style={styles.label} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}

      {/* Crowd Indicator */}
      {crowdLevel > 50 && (
        <View style={styles.crowdBadge}>
          <Ionicons name="people" size={10} color="#FFF" />
          <Text style={styles.crowdText}>{crowdLevel}%</Text>
        </View>
      )}
    </Animated.View>
  );
};

/**
 * HeatmapOverlay - Pulsierender Bereich für "was los ist"
 */
export const HeatmapOverlay = ({ intensity = 0.5, color = 'pink' }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: intensity,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [intensity]);

  const colors = {
    pink: 'rgba(251, 113, 133, 0.4)',
    purple: 'rgba(168, 85, 247, 0.4)',
    blue: 'rgba(56, 189, 248, 0.4)',
  };

  return (
    <Animated.View
      style={[
        styles.heatmapOverlay,
        { 
          backgroundColor: colors[color] || colors.pink,
          opacity: pulseAnim,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  shadow: {
    position: 'absolute',
    bottom: -8,
    width: 30,
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 15,
    transform: [{ scaleX: 1.5 }],
  },
  labelContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    ...SHADOWS.soft,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  crowdBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  crowdText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  heatmapGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -18,
  },
  heatmapOverlay: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});

export default POIMarker;

