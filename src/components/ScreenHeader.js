import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

const ScreenHeader = ({ 
  title, 
  subtitle, 
  rightIcon, 
  onRightPress, 
  transparent = false 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      !transparent && styles.containerShadow,
      { paddingTop: insets.top + 10, height: 60 + insets.top }
    ]}>
      <View style={styles.content}>
        <View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {rightIcon && (
          <TouchableOpacity style={styles.rightBtn} onPress={onRightPress}>
            <Ionicons name={rightIcon} size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    zIndex: 10,
  },
  containerShadow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  rightBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScreenHeader;
