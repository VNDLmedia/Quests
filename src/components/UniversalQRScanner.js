// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Universal QR Scanner Component
// Works in Web, PWA, and Native environments with fallback support
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

/**
 * Universal QR Scanner that works across all platforms
 * @param {Function} onScan - Callback when QR code is scanned: ({ data }) => void
 * @param {Function} onClose - Callback when scanner is closed
 */
const UniversalQRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [detectorSupported, setDetectorSupported] = useState(true);
  const hasScannedRef = useRef(false);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Check if BarcodeDetector is supported
    if (Platform.OS === 'web' && !('BarcodeDetector' in window)) {
      // console.warn('[UniversalQRScanner] BarcodeDetector not supported - showing manual input');
      setDetectorSupported(false);
      setShowManualInput(true);
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scanQRCode();
        }
      } catch (err) {
        console.error('[UniversalQRScanner] Camera error:', err);
        setHasCamera(false);
        setShowManualInput(true);
      }
    };

    const scanQRCode = () => {
      if (!scanning || hasScannedRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if ('BarcodeDetector' in window) {
          const barcodeDetector = new BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
          });

          barcodeDetector
            .detect(canvas)
            .then((barcodes) => {
              if (barcodes.length > 0 && !hasScannedRef.current) {
                const code = barcodes[0].rawValue;
                // console.log('[UniversalQRScanner] QR code detected:', code);
                hasScannedRef.current = true;
                setScanning(false);

                // Haptic feedback on web (if supported)
                if (navigator.vibrate) {
                  navigator.vibrate(200);
                }

                // Clean up before calling onScan
                cleanup();

                // Call onScan with slight delay to ensure cleanup
                setTimeout(() => {
                  onScan({ data: code });
                }, 50);
              }
            })
            .catch((err) => {
              // console.log('[UniversalQRScanner] Detection error:', err)
            });
        }
      }

      if (scanning && !hasScannedRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanQRCode);
      }
    };

    const cleanup = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    if (Platform.OS === 'web' && detectorSupported) {
      startCamera();
    }

    return cleanup;
  }, [scanning, onScan, detectorSupported]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      // console.log('[UniversalQRScanner] Manual code entered:', manualCode);
      onScan({ data: manualCode.trim() });
    }
  };

  const handleClose = () => {
    // Stop camera before closing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  // Manual input fallback (for browsers without BarcodeDetector or camera issues)
  if (showManualInput || !hasCamera || !detectorSupported) {
    return (
      <View style={styles.container}>
        <View style={styles.manualContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close-circle" size={40} color={COLORS.text.muted} />
          </TouchableOpacity>

          <Ionicons
            name={!detectorSupported ? 'qr-code-outline' : 'camera-off'}
            size={64}
            color={COLORS.text.muted}
          />

          <Text style={styles.manualTitle}>
            {!detectorSupported
              ? 'QR scanner not available'
              : !hasCamera
              ? 'Camera not available'
              : 'Manual Entry'}
          </Text>

          <Text style={styles.manualSubtitle}>
            {!detectorSupported
              ? 'Your browser does not support QR scanning. Please enter the code ID manually.'
              : 'Bitte gib die Code-ID manuell ein (z.B. ID001, ID002, ...)'}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="z.B. ID001, ID002, ..."
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
            <Text style={styles.submitBtnText}>Scannen</Text>
          </TouchableOpacity>

          {!detectorSupported && (
            <View style={styles.browserHint}>
              <Ionicons name="information-circle" size={16} color={COLORS.text.muted} />
              <Text style={styles.browserHintText}>
                Tip: For QR scanning use Chrome or Edge
              </Text>
            </View>
          )}

          {detectorSupported && !hasCamera && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setHasCamera(true);
                setShowManualInput(false);
              }}
            >
              <Text style={styles.retryBtnText}>Kamera erneut versuchen</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Camera scanner view
  return (
    <View style={styles.container}>
      <video ref={videoRef} style={styles.video} playsInline muted />
      <canvas ref={canvasRef} style={styles.canvas} />

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

        <Text style={styles.scanText}>Hold QR code in the frame</Text>

        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => setShowManualInput(true)}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.manualBtnText}>Manual Entry</Text>
        </TouchableOpacity>
      </View>
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
  browserHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
  },
  browserHintText: {
    color: COLORS.text.muted,
    fontSize: 12,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UniversalQRScanner;
