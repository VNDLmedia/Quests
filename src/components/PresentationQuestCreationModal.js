// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Point of Interest Creation Modal (Admin)
// ═══════════════════════════════════════════════════════════════════════════
// Modal for admins to create new Points of Interest on the static presentation map
// with crosshair position selection

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS } from '../theme';
import { TEAMS, TEAM_LIST } from '../config/teams';

// Safe imports for QR Scanner
let UniversalQRScanner = null;
try {
  if (Platform.OS === 'web') {
    UniversalQRScanner = require('./UniversalQRScanner').default;
  }
} catch (error) {
  console.error('Error loading UniversalQRScanner:', error);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICON_OPTIONS = [
  { icon: 'compass', label: 'Compass' },
  { icon: 'star', label: 'Star' },
  { icon: 'flag', label: 'Flag' },
  { icon: 'diamond', label: 'Diamond' },
  { icon: 'trophy', label: 'Trophy' },
  { icon: 'heart', label: 'Heart' },
  { icon: 'flash', label: 'Flash' },
  { icon: 'location', label: 'Location' },
  { icon: 'bulb', label: 'Bulb' },
  { icon: 'ribbon', label: 'Ribbon' },
  { icon: 'game-controller', label: 'Game' },
  { icon: 'search', label: 'Search' },
];

const PresentationQuestCreationModal = ({
  visible,
  mapImageUrl, // The static map image URL for position selection
  onClose,
  onSave,
  userId,
}) => {
  const insets = useSafeAreaInsets();
  
  // Steps: 1 = Position Selection, 2 = QR Code, 3 = POI Details
  const [step, setStep] = useState(1);
  
  // Position state
  const [position, setPosition] = useState(null);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 50, y: 50 });
  
  // QR Code state
  const [qrCodeId, setQrCodeId] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  
  // Quest details state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('compass');
  const [selectedTeam, setSelectedTeam] = useState('blue');
  const [xpReward, setXpReward] = useState('100');
  const [gemReward, setGemReward] = useState('50');
  const [infoTitle, setInfoTitle] = useState('');
  const [infoText, setInfoText] = useState('');
  const [infoImageUrl, setInfoImageUrl] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setStep(1);
      setPosition(null);
      setCrosshairPosition({ x: 50, y: 50 });
      setQrCodeId('');
      setTitle('');
      setDescription('');
      setSelectedIcon('compass');
      setSelectedTeam('blue');
      setXpReward('100');
      setGemReward('50');
      setInfoTitle('');
      setInfoText('');
      setInfoImageUrl('');
      setIsSaving(false);
    }
  }, [visible]);

  const mapContainerRef = useRef(null);

  const handleImageLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
  };

  const handleImagePress = (event) => {
    // For web, we need to calculate position differently
    if (Platform.OS === 'web') {
      const rect = event.target.getBoundingClientRect();
      const x = event.nativeEvent.pageX - rect.left;
      const y = event.nativeEvent.pageY - rect.top;
      const posX = (x / rect.width) * 100;
      const posY = (y / rect.height) * 100;
      // Clamp values to 0-100
      setCrosshairPosition({ 
        x: Math.max(0, Math.min(100, posX)), 
        y: Math.max(0, Math.min(100, posY)) 
      });
    } else {
      // Native
      const { locationX, locationY } = event.nativeEvent;
      const posX = (locationX / imageLayout.width) * 100;
      const posY = (locationY / imageLayout.height) * 100;
      setCrosshairPosition({ x: posX, y: posY });
    }
  };

  const handleConfirmPosition = () => {
    setPosition({
      positionX: crosshairPosition.x,
      positionY: crosshairPosition.y,
    });
    setStep(2);
  };

  const handleQRScanned = ({ data }) => {
    if (data) {
      const cleanedData = data.trim().toUpperCase();
      setQrCodeId(cleanedData);
      setQrScanning(false);
      // Auto-advance to step 3
      setTimeout(() => setStep(3), 300);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!qrCodeId.trim()) {
      Alert.alert('Error', 'Please enter a QR code ID');
      return;
    }
    if (!position) {
      Alert.alert('Error', 'Please select a position on the map');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      console.error('[PresentationQuestCreationModal] userId is missing!');
      return;
    }

    setIsSaving(true);

    try {
      // Build info content if provided
      let infoContent = null;
      if (infoTitle.trim() || infoText.trim() || infoImageUrl.trim()) {
        infoContent = {
          title: infoTitle.trim() || 'Info',
          text: infoText.trim(),
          imageUrl: infoImageUrl.trim() || null,
        };
      }

      await onSave({
        title: title.trim(),
        description: description.trim(),
        icon: selectedIcon,
        category: selectedTeam,
        xpReward: parseInt(xpReward) || 100,
        gemReward: parseInt(gemReward) || 50,
        qrCodeId: qrCodeId.trim().toUpperCase(),
        positionX: position.positionX,
        positionY: position.positionY,
        infoContent,
        adminId: userId,
        isPresentationQuest: true, // Flag for presentation mode quests
      });
      onClose();
    } catch (error) {
      console.error('Error saving quest:', error);
      Alert.alert('Error', error.message || 'Quest could not be saved');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  // Step 1: Position Selection with Crosshair
  const renderPositionSelection = () => (
    <View style={styles.positionContainer}>
      <View style={styles.positionHeader}>
        <Text style={styles.positionTitle}>Select Position</Text>
        <Text style={styles.positionSubtitle}>
          Tap on the map to set the POI position
        </Text>
      </View>

      <View style={styles.mapPreviewContainer} onLayout={handleImageLayout}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleImagePress}
          style={styles.mapTouchable}
        >
          <Image
            source={{ uri: mapImageUrl }}
            style={styles.mapPreview}
            resizeMode="contain"
          />
          
          {/* Crosshair */}
          <View
            style={[
              styles.crosshairContainer,
              {
                left: `${crosshairPosition.x}%`,
                top: `${crosshairPosition.y}%`,
              },
            ]}
          >
            <View style={styles.crosshairVertical} />
            <View style={styles.crosshairHorizontal} />
            <View style={styles.crosshairCenter} />
            <View style={styles.crosshairPulse} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.positionInfo}>
        <Ionicons name="locate" size={16} color="#5DADE2" />
        <Text style={styles.positionText}>
          X: {crosshairPosition.x.toFixed(1)}% | Y: {crosshairPosition.y.toFixed(1)}%
        </Text>
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPosition}>
        <LinearGradient
          colors={COLORS.gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.confirmGradient}
        >
          <Ionicons name="checkmark-circle" size={22} color={COLORS.text.primary} />
          <Text style={styles.confirmText}>Confirm Position</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Step 2: QR Code Scan
  const renderQRCodeStep = () => (
    <View style={styles.qrContainer}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Assign QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.qrContent}>
        {qrScanning && UniversalQRScanner ? (
          <View style={styles.scannerContainer}>
            <UniversalQRScanner
              onScan={handleQRScanned}
              onClose={() => setQrScanning(false)}
            />
          </View>
        ) : (
          <>
            <View style={styles.qrInputContainer}>
              <Text style={styles.label}>QR-Code ID *</Text>
              <TextInput
                style={styles.input}
                value={qrCodeId}
                onChangeText={setQrCodeId}
                placeholder="z.B. QUEST001"
                placeholderTextColor={COLORS.text.muted}
                autoCapitalize="characters"
              />
            </View>

            {Platform.OS === 'web' && UniversalQRScanner && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setQrScanning(true)}
              >
                <Ionicons name="qr-code" size={24} color={COLORS.primary} />
                <Text style={styles.scanButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, !qrCodeId.trim() && styles.confirmButtonDisabled]}
              onPress={() => qrCodeId.trim() && setStep(3)}
              disabled={!qrCodeId.trim()}
            >
              <LinearGradient
                colors={qrCodeId.trim() ? COLORS.gradients.gold : ['#555', '#444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                <Text style={styles.confirmText}>Continue</Text>
                <Ionicons name="arrow-forward" size={22} color={COLORS.text.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  // Step 3: POI Details Form
  const renderPOIDetails = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <View style={styles.formContainer}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.stepTitle}>POI Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Position & QR Info */}
        <View style={styles.infoBar}>
          <View style={styles.infoBadge}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.infoBadgeText}>
              {position?.positionX.toFixed(0)}%, {position?.positionY.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.infoBadge}>
            <Ionicons name="qr-code" size={14} color={COLORS.primary} />
            <Text style={styles.infoBadgeText}>{qrCodeId}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="POI Name"
            placeholderTextColor={COLORS.text.muted}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What is there to discover here?"
            placeholderTextColor={COLORS.text.muted}
            multiline
            numberOfLines={3}
          />

          {/* Icon Selection */}
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.icon}
                style={[
                  styles.iconOption,
                  selectedIcon === option.icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(option.icon)}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={selectedIcon === option.icon ? COLORS.primary : COLORS.text.secondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Team/Category Selection */}
          <Text style={styles.label}>Team/Category</Text>
          <View style={styles.teamGrid}>
            {TEAM_LIST.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.teamOption,
                  { borderColor: team.color },
                  selectedTeam === team.id && { backgroundColor: team.color + '30' },
                ]}
                onPress={() => setSelectedTeam(team.id)}
              >
                <Ionicons
                  name={team.icon}
                  size={20}
                  color={selectedTeam === team.id ? team.color : COLORS.text.muted}
                />
                <Text
                  style={[
                    styles.teamText,
                    selectedTeam === team.id && { color: team.color },
                  ]}
                >
                  {team.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rewards */}
          <View style={styles.rewardsRow}>
            <View style={styles.rewardInput}>
              <Text style={styles.label}>XP Reward</Text>
              <TextInput
                style={styles.input}
                value={xpReward}
                onChangeText={setXpReward}
                placeholder="100"
                placeholderTextColor={COLORS.text.muted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rewardInput}>
              <Text style={styles.label}>Gem Reward</Text>
              <TextInput
                style={styles.input}
                value={gemReward}
                onChangeText={setGemReward}
                placeholder="50"
                placeholderTextColor={COLORS.text.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Info Content Section */}
          <Text style={[styles.label, styles.sectionLabel]}>
            Info after Scan (optional)
          </Text>

          <Text style={styles.label}>Info Title</Text>
          <TextInput
            style={styles.input}
            value={infoTitle}
            onChangeText={setInfoTitle}
            placeholder="Headline..."
            placeholderTextColor={COLORS.text.muted}
          />

          <Text style={styles.label}>Info Text</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={infoText}
            onChangeText={setInfoText}
            placeholder="Detailed text after scan..."
            placeholderTextColor={COLORS.text.muted}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Info Bild URL</Text>
          <TextInput
            style={styles.input}
            value={infoImageUrl}
            onChangeText={setInfoImageUrl}
            placeholder="https://..."
            placeholderTextColor={COLORS.text.muted}
            autoCapitalize="none"
            keyboardType="url"
          />

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={COLORS.gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.text.primary} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.text.primary} />
                  <Text style={styles.saveText}>Create POI</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Neuer Point of Interest</Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{step}/3</Text>
          </View>
        </View>

        {/* Step Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>

        {/* Content based on step */}
        {step === 1 && renderPositionSelection()}
        {step === 2 && renderQRCodeStep()}
        {step === 3 && renderPOIDetails()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  stepIndicator: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.md,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.surface,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },

  // Step Header (shared)
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 32,
  },

  // Position Selection (Step 1)
  positionContainer: {
    flex: 1,
    padding: 16,
  },
  positionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  positionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  positionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  mapPreviewContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mapTouchable: {
    flex: 1,
    position: 'relative',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  crosshairContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    transform: [{ translateX: -30 }, { translateY: -30 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: '#5DADE2',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#5DADE2',
  },
  crosshairCenter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#5DADE2',
    backgroundColor: 'rgba(93,173,226,0.3)',
  },
  crosshairPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#5DADE2',
    opacity: 0.4,
  },
  positionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: 'rgba(93,173,226,0.15)',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(93,173,226,0.3)',
  },
  positionText: {
    fontSize: 14,
    color: '#5DADE2',
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: 16,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // QR Code Step (Step 2)
  qrContainer: {
    flex: 1,
  },
  qrContent: {
    flex: 1,
    padding: 20,
  },
  qrInputContainer: {
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 1,
    borderRadius: RADII.lg,
    overflow: 'hidden',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: RADII.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // POI Details (Step 3)
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  infoBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232,184,74,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.sm,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionLabel: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: 'rgba(232,184,74,0.15)',
    borderColor: COLORS.primary,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
  },
  teamText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardInput: {
    flex: 1,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  saveButton: {
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});

export default PresentationQuestCreationModal;
