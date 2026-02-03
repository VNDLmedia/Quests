// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Universal QR Scanner Component
// Works in Web, PWA, and Native environments with fallback support
// iOS Safari requires user gesture to request camera permission
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';

// Import jsQR for iOS/Safari fallback (BarcodeDetector not supported)
let jsQR = null;
try {
  jsQR = require('jsqr');
} catch (e) {
  console.warn('[UniversalQRScanner] jsQR not available');
}

// Detect iOS
const isIOS = () => {
  if (Platform.OS !== 'web') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if we're in a secure context (HTTPS or localhost)
const isSecureContext = () => {
  if (Platform.OS !== 'web') return true;
  // window.isSecureContext is the standard way to check
  if (typeof window !== 'undefined' && 'isSecureContext' in window) {
    return window.isSecureContext;
  }
  // Fallback check
  const protocol = window.location?.protocol;
  const hostname = window.location?.hostname;
  return protocol === 'https:' || 
         hostname === 'localhost' || 
         hostname === '127.0.0.1' ||
         hostname?.endsWith('.localhost');
};

/**
 * Universal QR Scanner that works across all platforms
 * Uses BarcodeDetector API where available (Chrome/Edge on Android/Desktop)
 * Falls back to jsQR library for iOS/Safari
 * @param {Function} onScan - Callback when QR code is scanned: ({ data }) => void
 * @param {Function} onClose - Callback when scanner is closed
 */
const UniversalQRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraState, setCameraState] = useState('idle'); // 'idle' | 'requesting' | 'active' | 'error'
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const hasScannedRef = useRef(false);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const scanningRef = useRef(false);

  // Detect if we can use camera-based scanning (either BarcodeDetector or jsQR)
  const secureContextOk = isSecureContext();
  const hasMediaDevices = Platform.OS === 'web' && 
    typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;
  const hasDecoder = ('BarcodeDetector' in window) || jsQR;
  const canUseCamera = secureContextOk && hasMediaDevices && hasDecoder;
  
  // Debug logging for iOS issues
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('[UniversalQRScanner] Environment check:', {
        isIOS: isIOS(),
        isSecureContext: secureContextOk,
        hasMediaDevices,
        hasDecoder,
        canUseCamera,
        protocol: window.location?.protocol,
        hostname: window.location?.hostname,
      });
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Handle successful scan
  const handleSuccessfulScan = useCallback((data) => {
    if (hasScannedRef.current) return;
    
    console.log('[UniversalQRScanner] QR code detected:', data);
    hasScannedRef.current = true;
    scanningRef.current = false;

    // Haptic feedback on web (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Clean up before calling onScan
    cleanup();

    // Call onScan with slight delay to ensure cleanup
    setTimeout(() => {
      onScan({ data });
    }, 50);
  }, [cleanup, onScan]);

  // QR Code scanning loop
  const scanQRCode = useCallback(() => {
    if (!scanningRef.current || hasScannedRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try BarcodeDetector first (Chrome/Edge on Android/Desktop)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
        });

        barcodeDetector
          .detect(canvas)
          .then((barcodes) => {
            if (barcodes.length > 0 && !hasScannedRef.current) {
              handleSuccessfulScan(barcodes[0].rawValue);
            }
          })
          .catch(() => {
            // Silent catch - detection errors are normal
          });
      }
      // Fallback to jsQR for iOS/Safari
      else if (jsQR) {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && !hasScannedRef.current) {
            handleSuccessfulScan(code.data);
          }
        } catch (e) {
          // Ignore jsQR errors
        }
      }
    }

    if (scanningRef.current && !hasScannedRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  }, [handleSuccessfulScan]);

  // Start camera - MUST be called from user gesture on iOS
  const startCamera = useCallback(async () => {
    console.log('[UniversalQRScanner] Starting camera...');
    setCameraState('requesting');
    setCameraError(null);
    setPermissionDenied(false);

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Please use a modern browser.');
      }

      // Request camera permission - iOS requires this to be in response to user gesture
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });

      console.log('[UniversalQRScanner] Camera stream obtained');
      streamRef.current = stream;

      // Wait a tick to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not available'));
            return;
          }
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (err) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(err);
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video timeout'));
          }, 10000);
        });

        // Try to play the video
        try {
          await videoRef.current.play();
          console.log('[UniversalQRScanner] Video playing');
        } catch (playErr) {
          console.warn('[UniversalQRScanner] Play warning:', playErr);
          // Continue anyway - some browsers report play() errors even when video works
        }

        // Start scanning
        setCameraState('active');
        scanningRef.current = true;
        hasScannedRef.current = false;
        scanQRCode();
      } else {
        throw new Error('Video element not available');
      }
    } catch (err) {
      console.error('[UniversalQRScanner] Camera error:', err);
      
      // Check if permission was denied
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setCameraError('Camera access denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is already in use');
      } else if (err.name === 'OverconstrainedError') {
        setCameraError('Camera does not support the requirements');
      } else {
        setCameraError(err.message || 'Camera error');
      }
      
      setCameraState('error');
      cleanup();
    }
  }, [cleanup, scanQRCode]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan({ data: manualCode.trim() });
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleRetryCamera = () => {
    cleanup();
    hasScannedRef.current = false;
    setShowManualInput(false);
    setCameraState('idle');
  };

  // Show manual input when camera is not available
  if (!canUseCamera) {
    // Determine the specific reason
    let errorTitle = 'QR Scanner not available';
    let errorMessage = 'Your browser does not support QR scanning. Please enter the code ID manually.';
    let errorIcon = 'qr-code-outline';
    
    if (!secureContextOk) {
      errorTitle = 'HTTPS required';
      errorMessage = 'The QR scanner requires a secure connection (HTTPS). Please open the app via HTTPS or localhost.';
      errorIcon = 'lock-closed';
    } else if (!hasMediaDevices) {
      errorTitle = 'Camera not supported';
      errorMessage = 'Your browser does not support camera access. Please use Safari or Chrome.';
      errorIcon = 'camera-off';
    }
    
    return (
      <View style={styles.container}>
        <View style={styles.manualContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close-circle" size={40} color={COLORS.text.muted} />
          </TouchableOpacity>

          <Ionicons name={errorIcon} size={64} color={COLORS.text.muted} />
          <Text style={styles.manualTitle}>{errorTitle}</Text>
          <Text style={styles.manualSubtitle}>{errorMessage}</Text>
          
          {!secureContextOk && (
            <View style={styles.securityHint}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.warning} />
              <Text style={styles.securityHintText}>
                URL: {Platform.OS === 'web' ? window.location?.href : 'N/A'}
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. ID001, ID002, ..."
              placeholderTextColor={COLORS.text.muted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              onSubmitEditing={handleManualSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !manualCode.trim() && styles.submitBtnDisabled]}
            onPress={handleManualSubmit}
            disabled={!manualCode.trim()}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Manual input view
  if (showManualInput) {
    return (
      <View style={styles.container}>
        <View style={styles.manualContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close-circle" size={40} color={COLORS.text.muted} />
          </TouchableOpacity>

          <Ionicons name="create-outline" size={64} color={COLORS.text.muted} />
          <Text style={styles.manualTitle}>Manual Entry</Text>
          <Text style={styles.manualSubtitle}>
            Enter the code ID manually (e.g. ID001, ID002, ...)
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. ID001, ID002, ..."
              placeholderTextColor={COLORS.text.muted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              onSubmitEditing={handleManualSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !manualCode.trim() && styles.submitBtnDisabled]}
            onPress={handleManualSubmit}
            disabled={!manualCode.trim()}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => {
            setShowManualInput(false);
            if (cameraState === 'active') {
              // Camera is already running
            } else {
              setCameraState('idle');
            }
          }}>
            <Ionicons name="camera" size={18} color={COLORS.primary} />
            <Text style={styles.backBtnText}>Back to Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Error state - show error and options
  if (cameraState === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.manualContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close-circle" size={40} color={COLORS.text.muted} />
          </TouchableOpacity>

          <Ionicons 
            name={permissionDenied ? 'lock-closed' : 'camera-off'} 
            size={64} 
            color={COLORS.error} 
          />
          <Text style={styles.manualTitle}>
            {permissionDenied ? 'Camera Access Denied' : 'Camera Not Available'}
          </Text>
          <Text style={styles.manualSubtitle}>
            {cameraError}
          </Text>

          {permissionDenied && (
            <View style={styles.permissionHint}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.permissionHintText}>
                {isIOS() 
                  ? 'Open Settings → Safari → Camera and allow access for this website.'
                  : 'Click the camera icon in the address bar and allow access.'}
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. ID001, ID002, ..."
              placeholderTextColor={COLORS.text.muted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={handleManualSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !manualCode.trim() && styles.submitBtnDisabled]}
            onPress={handleManualSubmit}
            disabled={!manualCode.trim()}
          >
            <Text style={styles.submitBtnText}>Submit Manually</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retryBtn} onPress={handleRetryCamera}>
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // MAIN RENDER - Always include video/canvas elements so refs are available
  // We show/hide content based on state using overlay views
  return (
    <View style={styles.container}>
      {/* Video element - ALWAYS rendered so ref is available */}
      <video 
        ref={videoRef} 
        style={{
          ...styles.video,
          display: cameraState === 'active' ? 'block' : 'none',
        }} 
        playsInline={true}
        muted={true}
        autoPlay={true}
      />
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Idle state overlay */}
      {cameraState === 'idle' && (
        <View style={styles.fullOverlay}>
          <View style={styles.startContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close-circle" size={40} color={COLORS.text.muted} />
            </TouchableOpacity>

            <View style={styles.startContent}>
              <View style={styles.cameraIconWrapper}>
                <Ionicons name="camera" size={80} color={COLORS.primary} />
              </View>

              <Text style={styles.startTitle}>Scan QR Code</Text>
              <Text style={styles.startSubtitle}>
                Tap the button to start the camera and scan the QR code.
              </Text>

              {isIOS() && (
                <View style={styles.iosHint}>
                  <Ionicons name="logo-apple" size={16} color={COLORS.text.muted} />
                  <Text style={styles.iosHintText}>
                    Allow camera access when prompted
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.startButton} onPress={startCamera}>
                <LinearGradient
                  colors={COLORS.gradients.gold}
                  style={styles.startButtonGradient}
                >
                  <Ionicons name="camera" size={24} color={COLORS.text.primary} />
                  <Text style={styles.startButtonText}>Start Camera</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.manualEntryBtn} 
                onPress={() => setShowManualInput(true)}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.text.secondary} />
                <Text style={styles.manualEntryText}>Enter code manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Requesting permission state overlay */}
      {cameraState === 'requesting' && (
        <View style={styles.fullOverlay}>
          <View style={styles.startContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close-circle" size={40} color={COLORS.text.muted} />
            </TouchableOpacity>

            <View style={styles.startContent}>
              <View style={styles.loadingIconWrapper}>
                <Ionicons name="camera" size={60} color={COLORS.primary} />
              </View>
              <Text style={styles.startTitle}>Requesting Camera Access...</Text>
              <Text style={styles.startSubtitle}>
                Please allow camera access in the browser dialog.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Active camera overlay - scanning UI */}
      {cameraState === 'active' && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close-circle" size={48} color="white" />
          </TouchableOpacity>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            <View style={styles.scanLine} />
          </View>

          <Text style={styles.scanText}>Hold QR code in frame</Text>

          {/* Debug info */}
          <Text style={styles.scannerInfo}>
            {('BarcodeDetector' in window) ? 'Native Scanner' : 'jsQR Scanner'}
            {isIOS() ? ' (iOS)' : ''}
          </Text>

          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setShowManualInput(true)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.manualBtnText}>Enter manually</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  canvas: {
    display: 'none',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    zIndex: 10,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: COLORS.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: COLORS.primary,
    top: '50%',
    opacity: 0.8,
  },
  scanText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 40,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scannerInfo: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 8,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manualBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Start screen styles
  startContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  startContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  cameraIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(232,184,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(232,184,74,0.3)',
  },
  loadingIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(232,184,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  startTitle: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  startSubtitle: {
    color: COLORS.text.secondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  iosHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 32,
  },
  iosHintText: {
    color: COLORS.text.muted,
    fontSize: 13,
  },
  startButton: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.glow,
    marginBottom: 20,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  startButtonText: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  manualEntryText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Manual input styles
  manualContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  manualTitle: {
    color: COLORS.text.primary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  manualSubtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    textAlign: 'center',
    letterSpacing: 2,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  permissionHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(232,184,74,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(232,184,74,0.3)',
  },
  permissionHintText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  securityHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(241,196,15,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    maxWidth: 320,
  },
  securityHintText: {
    color: COLORS.warning,
    fontSize: 11,
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UniversalQRScanner;
