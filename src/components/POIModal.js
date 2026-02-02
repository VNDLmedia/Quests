// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - POI Modal (Video + Info Content)
// ═══════════════════════════════════════════════════════════════════════════
// Shows video first, then info modal with title, text, and image

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, RADII, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

const POIModal = ({
  visible,
  poi, // { name, videoUrl, infoTitle, infoText, infoImageUrl }
  onComplete, // Called when user closes the info modal
  onClose, // Called if user skips/closes early
}) => {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState('video'); // 'video' | 'info'
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Reset state
      setPhase(poi?.videoUrl ? 'video' : 'info');
      setVideoLoading(true);
      setVideoError(false);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, poi]);

  const handleVideoEnd = () => {
    // Video finished, transition to info phase
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPhase('info');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSkipVideo = () => {
    if (videoRef.current) {
      videoRef.current.stopAsync();
    }
    handleVideoEnd();
  };

  const handleComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (onComplete) onComplete();
    });
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.stopAsync();
    }
    if (onClose) onClose();
  };

  if (!visible || !poi) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(13,27,42,0.98)', 'rgba(27,40,56,0.98)']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.container,
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 20,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={COLORS.text.muted} />
          </TouchableOpacity>

          {phase === 'video' && poi.videoUrl ? (
            // VIDEO PHASE
            <View style={styles.videoContainer}>
              <Text style={styles.poiName}>{poi.name}</Text>

              <View style={styles.videoWrapper}>
                {videoLoading && (
                  <View style={styles.videoLoading}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Video wird geladen...</Text>
                  </View>
                )}

                {videoError ? (
                  <View style={styles.videoError}>
                    <Ionicons name="alert-circle" size={48} color={COLORS.error} />
                    <Text style={styles.errorText}>Video konnte nicht geladen werden</Text>
                    <TouchableOpacity style={styles.skipButton} onPress={handleVideoEnd}>
                      <Text style={styles.skipButtonText}>Weiter</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Video
                    ref={videoRef}
                    source={{ uri: poi.videoUrl }}
                    style={styles.video}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    useNativeControls={false}
                    onLoad={() => setVideoLoading(false)}
                    onError={(e) => {
                      console.error('Video error:', e);
                      setVideoError(true);
                      setVideoLoading(false);
                    }}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.didJustFinish) {
                        handleVideoEnd();
                      }
                    }}
                  />
                )}
              </View>

              {/* Skip Button */}
              <TouchableOpacity style={styles.skipVideoButton} onPress={handleSkipVideo}>
                <Text style={styles.skipVideoText}>Überspringen</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            // INFO PHASE
            <View style={styles.infoContainer}>
              {/* POI Icon */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={COLORS.gradients.gold}
                  style={styles.iconGradient}
                >
                  <Ionicons name="checkmark" size={40} color={COLORS.text.primary} />
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.infoTitle}>
                {poi.infoTitle || poi.name}
              </Text>

              {/* Scrollable Content */}
              <ScrollView 
                style={styles.infoScroll} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.infoScrollContent}
              >
                {poi.infoImageUrl && (
                  <Image
                    source={{ uri: poi.infoImageUrl }}
                    style={styles.infoImage}
                    resizeMode="cover"
                  />
                )}

                <Text style={styles.infoText}>
                  {poi.infoText || 'Station erfolgreich besucht!'}
                </Text>
              </ScrollView>

              {/* Continue Button */}
              <TouchableOpacity style={styles.continueButton} onPress={handleComplete}>
                <LinearGradient
                  colors={COLORS.gradients.gold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueText}>Weiter</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.text.primary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    padding: 8,
  },

  // Video Phase
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: RADII.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoLoading: {
    position: 'absolute',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  videoError: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  skipButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
  },
  skipButtonText: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  skipVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipVideoText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Info Phase
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    ...SHADOWS.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoScroll: {
    maxHeight: height * 0.4,
    width: '100%',
  },
  infoScrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  infoImage: {
    width: '100%',
    height: 200,
    borderRadius: RADII.lg,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  continueButton: {
    width: '100%',
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
    marginTop: 24,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});

export default POIModal;
