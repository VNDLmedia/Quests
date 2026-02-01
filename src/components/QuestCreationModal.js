// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Quest Creation Modal (Admin Only)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, RADII, SHADOWS } from '../theme';
import { TEAMS, TEAM_LIST } from '../config/teams';
import {
  getCurrentLocation,
  validateQRCode,
  createQuest,
  getAvailableIcons,
} from '../game/services/QuestCreationService';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

// Dynamischer Import nur für Web - verhindert Crash auf Native
let UniversalQRScanner = null;
if (Platform.OS === 'web') {
  UniversalQRScanner = require('./UniversalQRScanner').default;
}

const { width } = Dimensions.get('window');

const QuestCreationModal = ({ visible, onClose, userId }) => {
  const [renderError, setRenderError] = useState(null);
  
  // Wrap the entire component in error handling
  try {
    return <QuestCreationModalContent visible={visible} onClose={onClose} userId={userId} />;
  } catch (error) {
    console.error('QuestCreationModal render error:', error);
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
            Error Loading Modal
          </Text>
          <Text style={{ color: '#AAA', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
            {error?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#333', borderRadius: 8 }}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }
};

const QuestCreationModalContent = ({ visible, onClose, userId }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1); // 1: Location, 2: QR, 3: Form, 4: Confirm
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Debug: Log step changes
  useEffect(() => {
    console.log('===> Current step:', step);
  }, [step]);

  // Auto-advance from step 2 to step 3 when QR code is set
  useEffect(() => {
    if (step === 2 && qrCodeId && !qrScanning) {
      console.log('🔄 useEffect detected: step=2, qrCodeId set, not scanning');
      console.log('🔄 Auto-advancing to step 3 in 150ms');
      const timer = setTimeout(() => {
        console.log('🚀 AUTO-ADVANCE: setStep(3)');
        setStep(3);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step, qrCodeId, qrScanning]);

  // Step 1: Location
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Step 2: QR Code
  const [qrCodeId, setQrCodeId] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  const [CameraView, setCameraView] = useState(null);

  // Step 3: Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('compass');
  const [xpReward, setXpReward] = useState('100');
  const [gemReward, setGemReward] = useState('50');
  const [selectedTeam, setSelectedTeam] = useState('blue');

  // Load native camera
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const loadCamera = async () => {
        try {
          const camera = await import('expo-camera');
          setCameraView(() => camera.CameraView);
        } catch (e) {
          console.log('Camera not available');
        }
      };
      loadCamera();
    }
  }, []);

  const handleCaptureLocation = async () => {
    console.log('Capturing location...');
    setLoading(true);
    setLocationError(null);

    try {
      const loc = await getCurrentLocation();
      console.log('Location captured:', loc);
      setLocation(loc);
      setStep(2);
    } catch (error) {
      console.error('Location capture error:', error);
      const errorMessage = error?.message || 'Failed to get location';
      setLocationError(errorMessage);
      Alert.alert('Location Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanned = async ({ data }) => {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  QR SCAN EVENT TRIGGERED                                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('RAW DATA:', data);
    console.log('DATA TYPE:', typeof data);
    console.log('DATA LENGTH:', data?.length);
    console.log('CURRENT STEP:', step);
    console.log('CURRENT qrCodeId:', qrCodeId);
    console.log('CURRENT qrScanning:', qrScanning);
    
    // Immediate validation
    if (!data || data.trim() === '') {
      console.log('❌ Empty QR code, ignoring');
      return;
    }

    const trimmedData = data.trim();
    console.log('TRIMMED DATA:', trimmedData);
    
    // Close scanner immediately to prevent multiple scans
    console.log('🔒 Closing scanner (setQrScanning(false))');
    setQrScanning(false);
    
    console.log('⏳ Setting loading to true');
    setLoading(true);

    try {
      console.log('📞 Calling validateQRCode with:', trimmedData);
      const validation = await validateQRCode(trimmedData);
      console.log('✅ Validation returned:', JSON.stringify(validation, null, 2));
      
      if (!validation.valid && validation.error) {
        console.log('⚠️ QR code already in use');
        setLoading(false);
        
        if (Platform.OS === 'web') {
          // On web, use window.confirm instead of Alert
          const useAnyway = window.confirm(
            `${validation.error}\n\nDo you want to use it anyway?`
          );
          
          if (useAnyway) {
            console.log('✓ User wants to use anyway');
            console.log('📝 Setting qrCodeId to:', trimmedData);
            setQrCodeId(trimmedData);
            console.log('⏰ Scheduling step change to 3 in 100ms');
            setTimeout(() => {
              console.log('🚀 EXECUTING setStep(3)');
              setStep(3);
            }, 100);
          } else {
            console.log('❌ User cancelled');
            setQrScanning(true);
          }
        } else {
          Alert.alert(
            'QR Code Already Used',
            validation.error,
            [
              { 
                text: 'Scan Again', 
                onPress: () => {
                  console.log('🔄 User chose to scan again');
                  setQrScanning(true);
                }
              },
              { 
                text: 'Use Anyway', 
                onPress: () => {
                  console.log('✓ User chose to use anyway');
                  console.log('📝 Setting qrCodeId to:', trimmedData);
                  setQrCodeId(trimmedData);
                  console.log('⏰ Scheduling step change to 3 in 100ms');
                  setTimeout(() => {
                    console.log('🚀 EXECUTING setStep(3)');
                    setStep(3);
                  }, 100);
                }
              },
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => console.log('❌ User cancelled')
              },
            ]
          );
        }
        return;
      }
      
      // QR code is valid - accept it
      console.log('✅ QR code is valid and available');
      console.log('📝 Setting qrCodeId to:', trimmedData);
      setQrCodeId(trimmedData);
      
      console.log('⏳ Setting loading to false');
      setLoading(false);
      
      console.log('⏰ Scheduling step change to 3 in 100ms');
      setTimeout(() => {
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║  🚀 EXECUTING setStep(3) NOW                             ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        setStep(3);
      }, 100);
      
    } catch (error) {
      console.error('╔══════════════════════════════════════════════════════════╗');
      console.error('║  ❌ ERROR IN handleQRScanned                             ║');
      console.error('╚══════════════════════════════════════════════════════════╝');
      console.error(error);
      setLoading(false);
      
      if (Platform.OS === 'web') {
        window.alert(`Error: ${error.message || 'Failed to process QR code'}`);
      } else {
        Alert.alert('Error', error.message || 'Failed to process QR code');
      }
    }
  };

  const handleNext = () => {
    if (step === 3) {
      // Validate form
      if (!title.trim()) {
        Alert.alert('Missing Information', 'Please enter a quest title');
        return;
      }
      const xp = parseInt(xpReward);
      const gems = parseInt(gemReward);
      
      if (isNaN(xp) || xp < 50 || xp > 1000) {
        Alert.alert('Invalid XP', 'XP reward must be between 50 and 1000');
        return;
      }
      if (isNaN(gems) || gems < 10 || gems > 500) {
        Alert.alert('Invalid Gems', 'Gem reward must be between 10 and 500');
        return;
      }
      
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setQrScanning(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const result = await createQuest({
        title,
        description,
        icon: selectedIcon,
        xpReward: parseInt(xpReward),
        gemReward: parseInt(gemReward),
        category: selectedTeam,
        location: {
          latitude: location.latitude,
          lng: location.longitude,
        },
        qrCodeId,
        adminId: userId,
      });

      if (result.success) {
        Alert.alert('Success', 'Quest created successfully!', [
          { text: 'OK', onPress: () => {
            resetForm();
            onClose();
          }}
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create quest');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setLocation(null);
    setLocationError(null);
    setQrCodeId('');
    setTitle('');
    setDescription('');
    setSelectedIcon('compass');
    setXpReward('100');
    setGemReward('50');
    setSelectedTeam('blue');
    setQrScanning(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Render QR Scanner (Step 2)
  if (step === 2 && qrScanning) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        {Platform.OS === 'web' && UniversalQRScanner ? (
          <UniversalQRScanner onScan={handleQRScanned} onClose={() => setQrScanning(false)} />
        ) : CameraView ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={handleQRScanned}
            />
            <TouchableOpacity
              style={styles.cameraClose}
              onPress={() => setQrScanning(false)}
            >
              <Ionicons name="close-circle" size={48} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <View style={styles.scannerError}>
              <Ionicons name="camera-off" size={48} color={COLORS.text.muted} />
              <Text style={styles.scannerErrorText}>Kamera nicht verfügbar</Text>
              <TouchableOpacity style={styles.scannerCloseBtn} onPress={() => setQrScanning(false)}>
                <Text style={styles.scannerCloseBtnText}>Schließen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    );
  }

  const availableIcons = getAvailableIcons();

  // Error boundary fallback
  if (hasError) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={[styles.stepTitle, { marginTop: 20 }]}>Something went wrong</Text>
          <Text style={styles.stepDescription}>Please close and try again</Text>
          <GlassButton
            title="Close"
            onPress={handleClose}
            variant="gradient"
            gradient={COLORS.gradients.gold}
            style={{ marginTop: 20 }}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={COLORS.gradients.hero}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Quest (Step {step}/4)</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                step >= s && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Location */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>📍 Capture Location</Text>
              <Text style={styles.stepDescription}>
                Get the current GPS coordinates where the quest will be located
              </Text>

              {location ? (
                <GlassCard style={styles.locationCard} variant="dark">
                  <View style={styles.locationRow}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>Latitude</Text>
                      <Text style={styles.locationValue}>{location.latitude.toFixed(6)}</Text>
                    </View>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={24} color={COLORS.primary} />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>Longitude</Text>
                      <Text style={styles.locationValue}>{location.longitude.toFixed(6)}</Text>
                    </View>
                  </View>
                  {location.accuracy && (
                    <Text style={styles.locationAccuracy}>
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </Text>
                  )}
                  <TouchableOpacity 
                    style={styles.recaptureButton}
                    onPress={() => setLocation(null)}
                  >
                    <Text style={styles.recaptureText}>Capture Again</Text>
                  </TouchableOpacity>
                </GlassCard>
              ) : (
                <>
                  <GlassButton
                    title={loading ? "Getting Location..." : "Capture Current Location"}
                    onPress={handleCaptureLocation}
                    variant="gradient"
                    gradient={COLORS.gradients.gold}
                    icon={<Ionicons name="navigate" size={22} color={COLORS.text.primary} />}
                    loading={loading}
                    disabled={loading}
                  />
                  {locationError && (
                    <>
                      <Text style={styles.errorText}>{locationError}</Text>
                      <Text style={styles.errorHint}>
                        Check console for details. You can also skip to manual entry.
                      </Text>
                      <GlassButton
                        title="Skip & Enter Location Manually"
                        onPress={() => {
                          // Use a default location (you can change this)
                          setLocation({
                            latitude: 47.8224,
                            longitude: 13.0456,
                            accuracy: 0,
                          });
                        }}
                        variant="outline"
                        style={{ marginTop: 12 }}
                      />
                    </>
                  )}
                </>
              )}
            </View>
          )}

          {/* STEP 2: QR Code */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>📷 Scan QR Code</Text>
              <Text style={styles.stepDescription}>
                Scan the QR code that users will need to complete this quest
              </Text>

              {/* Debug Status Display */}
              {__DEV__ && (
                <View style={styles.debugPanel}>
                  <Text style={styles.debugText}>🐛 DEBUG INFO:</Text>
                  <Text style={styles.debugText}>Step: {step}</Text>
                  <Text style={styles.debugText}>QR ID: {qrCodeId || 'none'}</Text>
                  <Text style={styles.debugText}>Scanning: {qrScanning ? 'YES' : 'NO'}</Text>
                  <Text style={styles.debugText}>Loading: {loading ? 'YES' : 'NO'}</Text>
                </View>
              )}

              {qrCodeId ? (
                <GlassCard style={styles.qrCard} variant="dark">
                  <Ionicons name="qr-code" size={48} color={COLORS.primary} />
                  <Text style={styles.qrLabel}>QR Code ID</Text>
                  <Text style={styles.qrValue}>{qrCodeId}</Text>
                  <TouchableOpacity onPress={() => {
                    setQrCodeId('');
                    setQrScanning(true);
                  }}>
                    <Text style={styles.qrRescan}>Scan Different Code</Text>
                  </TouchableOpacity>
                </GlassCard>
              ) : (
                <>
                  <GlassButton
                    title="Scan QR Code"
                    onPress={() => setQrScanning(true)}
                    variant="gradient"
                    gradient={COLORS.gradients.gold}
                    icon={<Ionicons name="qr-code" size={22} color={COLORS.text.primary} />}
                  />
                  
                  <View style={styles.orDivider}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.orLine} />
                  </View>

                  <Text style={styles.inputLabel}>Enter QR Code ID Manually</Text>
                  <View style={styles.manualInputContainer}>
                    <TextInput
                      style={styles.manualInput}
                      value={qrCodeId}
                      onChangeText={setQrCodeId}
                      placeholder="e.g., 001, 002, 003..."
                      placeholderTextColor={COLORS.text.muted}
                      maxLength={10}
                      autoCapitalize="none"
                      returnKeyType="done"
                    />
                  </View>
                  <Text style={styles.qrHint}>
                    Enter ID and click "Next" below to continue
                  </Text>
                </>
              )}
            </View>
          )}

          {/* STEP 3: Quest Form */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>✏️ Quest Details</Text>
              <Text style={styles.stepDescription}>
                Fill in the quest information
              </Text>

              {/* Title */}
              <Text style={styles.inputLabel}>Quest Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter quest name..."
                placeholderTextColor={COLORS.text.muted}
                maxLength={50}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Quest description (optional)..."
                placeholderTextColor={COLORS.text.muted}
                multiline
                numberOfLines={3}
                maxLength={200}
              />

              {/* Icon Selector */}
              <Text style={styles.inputLabel}>Icon *</Text>
              <View style={styles.iconGrid}>
                {availableIcons.map((iconItem) => (
                  <TouchableOpacity
                    key={iconItem.icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === iconItem.icon && styles.iconOptionSelected,
                    ]}
                    onPress={() => setSelectedIcon(iconItem.icon)}
                  >
                    <Ionicons
                      name={iconItem.icon}
                      size={24}
                      color={selectedIcon === iconItem.icon ? COLORS.primary : COLORS.text.secondary}
                    />
                    <Text style={[
                      styles.iconOptionText,
                      selectedIcon === iconItem.icon && styles.iconOptionTextSelected,
                    ]}>
                      {iconItem.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rewards */}
              <View style={styles.rewardRow}>
                <View style={styles.rewardInput}>
                  <Text style={styles.inputLabel}>XP Reward *</Text>
                  <TextInput
                    style={styles.input}
                    value={xpReward}
                    onChangeText={setXpReward}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor={COLORS.text.muted}
                  />
                </View>
                <View style={styles.rewardInput}>
                  <Text style={styles.inputLabel}>Gem Reward *</Text>
                  <TextInput
                    style={styles.input}
                    value={gemReward}
                    onChangeText={setGemReward}
                    keyboardType="numeric"
                    placeholder="50"
                    placeholderTextColor={COLORS.text.muted}
                  />
                </View>
              </View>

              {/* Team Category */}
              <Text style={styles.inputLabel}>Team Category *</Text>
              <View style={styles.teamGrid}>
                {TEAM_LIST.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.teamOption,
                      { borderColor: team.color },
                      selectedTeam === team.id && { backgroundColor: team.bgColor },
                    ]}
                    onPress={() => setSelectedTeam(team.id)}
                  >
                    <Ionicons
                      name={team.icon}
                      size={24}
                      color={team.color}
                    />
                    <Text style={[styles.teamOptionText, { color: team.color }]}>
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 4: Confirmation */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>✅ Review & Confirm</Text>
              <Text style={styles.stepDescription}>
                Please review your quest before creating it
              </Text>

              <GlassCard style={styles.reviewCard} variant="dark">
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Title:</Text>
                  <Text style={styles.reviewValue}>{title}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Description:</Text>
                  <Text style={styles.reviewValue}>{description || 'None'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Icon:</Text>
                  <Ionicons name={selectedIcon} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>XP Reward:</Text>
                  <Text style={styles.reviewValue}>{xpReward} XP</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Gem Reward:</Text>
                  <Text style={styles.reviewValue}>{gemReward} Gems</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Team:</Text>
                  <View style={styles.reviewTeam}>
                    <Ionicons
                      name={TEAMS[selectedTeam].icon}
                      size={20}
                      color={TEAMS[selectedTeam].color}
                    />
                    <Text style={[styles.reviewValue, { color: TEAMS[selectedTeam].color }]}>
                      {TEAMS[selectedTeam].name}
                    </Text>
                  </View>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Location:</Text>
                  <Text style={styles.reviewValue}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>QR Code:</Text>
                  <Text style={styles.reviewValue}>{qrCodeId}</Text>
                </View>
              </GlassCard>

              <GlassButton
                title={saving ? "Creating Quest..." : "Create Quest"}
                onPress={handleSave}
                variant="gradient"
                gradient={COLORS.gradients.gold}
                icon={<Ionicons name="checkmark-circle" size={22} color={COLORS.text.primary} />}
                loading={saving}
                disabled={saving}
              />
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        {step > 1 && step < 4 && (
          <View style={styles.navigationContainer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                <Text style={styles.navButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <View style={styles.navSpacer} />
            {((step === 2 && qrCodeId) || (step === 3 && title.trim())) && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={step === 2 ? () => setStep(3) : handleNext}
              >
                <Text style={styles.navButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 1 && location && (
          <View style={styles.navigationContainer}>
            <View style={styles.navSpacer} />
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setStep(2)}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surface,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  stepDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  locationCard: {
    padding: 20,
    gap: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  locationAccuracy: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 12,
  },
  errorHint: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  recaptureButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recaptureText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  qrCard: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  qrValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  qrRescan: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 8,
  },
  qrHint: {
    fontSize: 12,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  debugPanel: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: 'magenta',
  },
  debugText: {
    color: 'magenta',
    fontSize: 12,
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  orText: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 14,
    color: COLORS.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 14,
    color: COLORS.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: (width - 60) / 4,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  iconOptionText: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  iconOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardInput: {
    flex: 1,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  teamOption: {
    width: (width - 52) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: RADII.md,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  teamOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCard: {
    padding: 20,
    gap: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontWeight: '600',
  },
  reviewValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  reviewTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  navSpacer: {
    flex: 1,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  scannerCanvas: {
    display: 'none',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCloseButton: {
    position: 'absolute',
    top: 60,
    right: 30,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
  },
  scannerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 40,
  },
  scannerError: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  scannerErrorText: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  scannerErrorHint: {
    color: COLORS.text.muted,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scannerCloseBtn: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scannerCloseBtnText: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraClose: {
    position: 'absolute',
    top: 60,
    right: 30,
  },
});

export default QuestCreationModal;
