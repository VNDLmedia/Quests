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
import { COLORS, RADII, SHADOWS } from '../theme';

/**
 * GlassButton - Dark Theme Glassmorphism Button
 * 
 * Variants:
 * - glass: Subtle dark glass effect
 * - gradient: Golden/orange gradient (primary CTA)
 * - outline: Transparent with border
 */
const GlassButton = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'glass',
  gradient = COLORS.gradients.gold,
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  size = 'md',
  haptic = true,
}) => {
  
  const handlePress = async () => {
    if (disabled || loading) return;
    
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
        <ActivityIndicator color={variant === 'gradient' ? COLORS.background : COLORS.text.primary} />
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

  // Gradient Variant (Primary CTA)
  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.container, disabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={disabled ? [COLORS.text.muted, COLORS.surface] : gradient}
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

  // Glass Variant (Default - Dark theme)
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
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
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
    backgroundColor: COLORS.glass.dark,
    borderWidth: 1,
    borderColor: COLORS.glass.darkBorder,
    borderRadius: RADII.lg,
  },
  webGlass: {
    backgroundColor: 'rgba(27, 40, 56, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
  },
  gradientContainer: {
    borderRadius: RADII.lg,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    color: COLORS.background,
    fontWeight: '700',
  },
  textOutline: {
    color: COLORS.text.primary,
  },
  textDisabled: {
    color: COLORS.text.muted,
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default GlassButton;
