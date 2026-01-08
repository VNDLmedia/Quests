import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADII, SHADOWS } from '../theme';

/**
 * GlassCard - Glassmorphism 2.0 Komponente
 * 
 * Milchig-weiße Glasfläche mit:
 * - Blur-Backdrop
 * - 80% Opazität
 * - Weiße 1px Border
 * - Super-Ellipsen (stark abgerundete Ecken)
 */
const GlassCard = ({ 
  children, 
  style, 
  variant = 'light', // 'light' | 'dark' | 'accent'
  intensity = 60,
  padding = 20,
  noPadding = false,
  accentGradient = null, // z.B. COLORS.gradients.electricBlue
}) => {
  const isLight = variant === 'light';
  const borderColor = isLight ? COLORS.glass.whiteBorder : COLORS.glass.darkBorder;
  const backgroundColor = isLight ? COLORS.glass.white : COLORS.glass.dark;
  
  // Web-Fallback (BlurView funktioniert nicht auf Web)
  if (Platform.OS === 'web') {
    return (
      <View style={[
        styles.container,
        { 
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
          borderColor,
          backdropFilter: 'blur(20px)',
        },
        style
      ]}>
        {accentGradient && (
          <LinearGradient
            colors={accentGradient}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        )}
        <View style={[styles.content, !noPadding && { padding }]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor }, SHADOWS.soft, style]}>
      <BlurView 
        intensity={intensity} 
        tint={isLight ? 'light' : 'dark'} 
        style={styles.blurContainer}
      >
        <View style={[styles.innerGlass, { backgroundColor }]}>
          {accentGradient && (
            <LinearGradient
              colors={accentGradient}
              style={styles.accentBar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <View style={[styles.content, !noPadding && { padding }]}>
            {children}
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  blurContainer: {
    flex: 1,
  },
  innerGlass: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
});

export default GlassCard;
