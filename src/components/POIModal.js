// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - POI Modal (Video + Combined Image/Info Content)
// ═══════════════════════════════════════════════════════════════════════════
// Shows video first (if available), then image with overlaid title/text

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

// Helper to construct image URL from filename or path
const getImageUrl = (pathOrFilename) => {
  if (!pathOrFilename) return null;
  
  // If it's already a full URL, use it as-is
  if (pathOrFilename.startsWith('http://') || pathOrFilename.startsWith('https://')) {
    return pathOrFilename;
  }
  
  let path = pathOrFilename.trim();
  
  // Handle @public/ prefix (e.g., "@public/img/Ramy.jpeg" -> "/img/Ramy.jpeg")
  if (path.startsWith('@public/')) {
    path = '/' + path.slice(8); // Remove "@public/" prefix
  }
  // Handle public/ prefix without @ (e.g., "public/img/Ramy.jpeg" -> "/img/Ramy.jpeg")
  else if (path.startsWith('public/')) {
    path = '/' + path.slice(7); // Remove "public/" prefix
  }
  // Handle paths that already start with / (keep as-is)
  else if (path.startsWith('/')) {
    // Already a proper path
  }
  // Handle just a filename (default to /img/ folder)
  else {
    path = `/img/${path}`;
  }
  
  // URL encode spaces and special characters in the path
  // Split path, encode each segment, rejoin
  const segments = path.split('/');
  const encodedSegments = segments.map(segment => 
    segment ? encodeURIComponent(segment) : segment
  );
  
  return encodedSegments.join('/');
};

const POIModal = ({
  visible,
  poi, // { name, videoUrl, infoTitle, infoText, infoImageUrl, hook }
  onComplete, // Called when user closes the modal
  onClose, // Called if user skips/closes early
}) => {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState('content'); // 'video' | 'content'
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const contentSlideAnim = useRef(new Animated.Value(100)).current;

  // Determine the starting phase based on what content is available
  const getInitialPhase = () => {
    if (poi?.videoUrl) return 'video';
    return 'content';
  };

  useEffect(() => {
    if (visible) {
      // Reset state
      setPhase(getInitialPhase());
      setVideoLoading(true);
      setVideoError(false);
      setImageLoading(true);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      contentSlideAnim.setValue(100);

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

      // Animate content slide up after a delay
      setTimeout(() => {
        Animated.spring(contentSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }).start();
      }, 200);
    }
  }, [visible, poi]);

  const handleVideoEnd = () => {
    // Video finished, transition to content phase
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPhase('content');
      contentSlideAnim.setValue(100);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(contentSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
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

  const hasImage = !!poi.infoImageUrl;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {phase === 'video' && poi.videoUrl ? (
            // VIDEO PHASE
            <View style={[styles.videoContainer, { paddingTop: insets.top + 20 }]}>
              <TouchableOpacity style={[styles.closeButton, { top: insets.top + 16 }]} onPress={handleClose}>
                <View style={styles.closeButtonInner}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>

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
            // COMBINED IMAGE + TEXT CONTENT PHASE
            <View style={styles.contentContainer}>
              {/* Close Button */}
              <TouchableOpacity 
                style={[styles.closeButton, { top: insets.top + 16 }]} 
                onPress={handleClose}
              >
                <View style={styles.closeButtonInner}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>

              {/* Background Image (if available) */}
              {hasImage && (
                <View style={styles.imageContainer}>
                  {imageLoading && (
                    <View style={styles.imageLoadingContainer}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  )}
                  <Image
                    source={{ uri: getImageUrl(poi.infoImageUrl) }}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </View>
              )}

              {/* Gradient Overlay for Text Readability */}
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(13,27,42,0.4)',
                  'rgba(13,27,42,0.85)',
                  'rgba(13,27,42,0.98)',
                ]}
                locations={[0, 0.3, 0.55, 0.75]}
                style={styles.gradientOverlay}
              />

              {/* Content Overlay at Bottom */}
              <Animated.View 
                style={[
                  styles.contentOverlay,
                  { 
                    paddingBottom: insets.bottom + 24,
                    transform: [{ translateY: contentSlideAnim }],
                  }
                ]}
              >
                {/* Success Badge */}
                <View style={styles.successBadge}>
                  <LinearGradient
                    colors={COLORS.gradients.gold}
                    style={styles.successBadgeGradient}
                  >
                    <Ionicons name="checkmark" size={20} color={COLORS.text.primary} />
                  </LinearGradient>
                  <Text style={styles.successBadgeText}>Station entdeckt!</Text>
                </View>

                {/* Title */}
                <Text style={styles.contentTitle}>
                  {poi.infoTitle || poi.name}
                </Text>

                {/* Hook (subtitle) */}
                {poi.hook && (
                  <Text style={styles.contentHook}>
                    {poi.hook}
                  </Text>
                )}

                {/* Story Text - Scrollable if needed */}
                <ScrollView 
                  style={styles.textScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.textScrollContent}
                >
                  <Text style={styles.contentText}>
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
              </Animated.View>
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
  },

  // Close Button (shared)
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Video Phase
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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

  // Combined Content Phase
  contentContainer: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1B2A',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Success Badge
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  successBadgeGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  successBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  // Content Text
  contentTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
    lineHeight: 32,
  },
  contentHook: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    color: COLORS.primary,
    marginBottom: 16,
    lineHeight: 22,
  },
  textScroll: {
    maxHeight: height * 0.22,
    marginBottom: 20,
  },
  textScrollContent: {
    paddingBottom: 8,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text.secondary,
  },

  // Continue Button
  continueButton: {
    width: '100%',
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
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
