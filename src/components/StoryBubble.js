import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../theme';

/**
 * StoryBubble - Instagram-like Story Bubbles für Trending Quests
 * 
 * Erscheinen oben auf der Map wie Stories.
 * Zeigen "Trending", "Hotspot", "Secret Drop" an.
 */
const StoryBubble = ({
  id,
  title,
  subtitle,
  icon = 'flame',
  gradient = COLORS.gradients.sunsetOrange,
  type = 'trending', // 'trending' | 'hotspot' | 'secret' | 'coffee'
  isNew = false,
  onPress,
  style,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Sanftes Wippen
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -4,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow für neue Items
    if (isNew) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isNew]);

  const getTypeConfig = () => {
    switch (type) {
      case 'trending':
        return {
          icon: 'trending-up',
          label: 'TRENDING',
          gradient: COLORS.gradients.sunsetOrange,
        };
      case 'hotspot':
        return {
          icon: 'flame',
          label: 'HOTSPOT',
          gradient: COLORS.gradients.roseGold,
        };
      case 'secret':
        return {
          icon: 'sparkles',
          label: 'SECRET DROP',
          gradient: COLORS.gradients.mysticPurple,
        };
      case 'coffee':
        return {
          icon: 'cafe',
          label: 'COFFEE BREAK',
          gradient: COLORS.gradients.freshMint,
        };
      case 'networking':
        return {
          icon: 'people',
          label: 'MEET UP',
          gradient: COLORS.gradients.electricBlue,
        };
      default:
        return {
          icon: 'star',
          label: 'EVENT',
          gradient: COLORS.gradients.electricBlue,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <TouchableOpacity onPress={() => onPress?.(id)} activeOpacity={0.9}>
      <Animated.View 
        style={[
          styles.container,
          { transform: [{ translateY: bounceAnim }] },
          style,
        ]}
      >
        {/* Icon Circle mit Gradient */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={gradient || config.gradient}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon || config.icon} size={24} color="#FFF" />
          </LinearGradient>
          
          {/* Neuer Badge */}
          {isNew && (
            <Animated.View style={[styles.newBadge, { opacity: glowAnim }]}>
              <View style={styles.newDot} />
            </Animated.View>
          )}
        </View>

        {/* Label */}
        <Text style={styles.label}>{config.label}</Text>
        
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * StoryBubbleRow - Horizontale Liste von Story Bubbles
 */
export const StoryBubbleRow = ({ stories, onStoryPress }) => {
  return (
    <View style={styles.row}>
      {stories.map((story, index) => (
        <StoryBubble
          key={story.id}
          {...story}
          onPress={onStoryPress}
          style={{ marginLeft: index === 0 ? 16 : 0 }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    marginRight: 12,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  newBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  newDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 14,
  },
  // Row Styles
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
});

export default StoryBubble;

