import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADII, SHADOWS } from '../theme';

/**
 * GlassCard - Dark Theme Glassmorphism Component
 * 
 * Optimized for dark navy background with subtle glass effects
 */
const GlassCard = ({ 
  children, 
  style, 
  variant = 'dark', // 'dark' | 'light' | 'accent'
  intensity = 40,
  padding = 20,
  noPadding = false,
  accentGradient = null,
  glow = false,
}) => {
  const isDark = variant === 'dark';
  const borderColor = isDark ? COLORS.glass.darkBorder : COLORS.glass.whiteBorder;
  const backgroundColor = isDark ? COLORS.glass.dark : COLORS.glass.white;
  
  // Web-Fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[
        styles.container,
        { 
          backgroundColor: isDark 
            ? 'rgba(27, 40, 56, 0.85)' 
            : 'rgba(255, 255, 255, 0.1)',
          borderColor,
          backdropFilter: 'blur(16px)',
        },
        glow && styles.glowEffect,
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
    <View style={[
      styles.container, 
      { borderColor }, 
      SHADOWS.soft, 
      glow && SHADOWS.glow,
      style
    ]}>
      <BlurView 
        intensity={intensity} 
        tint="dark"
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
    height: 3,
    width: '100%',
  },
  glowEffect: Platform.OS === 'web' ? {
    boxShadow: '0 0 24px rgba(232, 184, 74, 0.2)',
  } : {},
});

export default GlassCard;
