import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  View,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../theme';

/**
 * GlassButton - Glassmorphism Button mit Gradient-Optionen
 * 
 * Variants:
 * - glass: Milchig-weißer Glaseffekt
 * - gradient: Farbverlauf (z.B. Sunset Orange)
 * - outline: Transparenter Button mit Border
 */
const GlassButton = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'glass', // 'glass' | 'gradient' | 'outline'
  gradient = COLORS.gradients.electricBlue,
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  haptic = true,
}) => {
  
  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Haptic Feedback
    if (haptic && Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const textSizes = {
    sm: 13,
    md: 15,
    lg: 17,
  };

  const renderContent = () => (
    <View style={[styles.contentRow, sizeStyles[size]]}>
      {loading ? (
        <ActivityIndicator color={variant === 'gradient' ? '#FFF' : COLORS.text.primary} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[
            styles.text,
            { fontSize: textSizes[size] },
            variant === 'gradient' && styles.textGradient,
            variant === 'outline' && styles.textOutline,
            disabled && styles.textDisabled,
            textStyle,
          ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  // Gradient Variant
  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.container, disabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={disabled ? ['#CBD5E1', '#94A3B8'] : gradient}
          style={styles.gradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Outline Variant
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          styles.container,
          styles.outlineContainer,
          disabled && styles.disabled,
          style,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Glass Variant (Default)
  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          styles.container,
          styles.webGlass,
          disabled && styles.disabled,
          style,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[styles.container, SHADOWS.soft, disabled && styles.disabled, style]}
    >
      <BlurView intensity={50} tint="light" style={styles.blurContainer}>
        <View style={styles.glassInner}>
          {renderContent()}
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.lg,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
  },
  glassInner: {
    backgroundColor: COLORS.glass.white,
    borderWidth: 1,
    borderColor: COLORS.glass.whiteBorder,
    borderRadius: RADII.lg,
  },
  webGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  gradientContainer: {
    borderRadius: RADII.lg,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.glass.whiteBorder,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  textGradient: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textOutline: {
    color: '#FFFFFF',
  },
  textDisabled: {
    color: '#94A3B8',
  },
  disabled: {
    opacity: 0.6,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default GlassButton;
