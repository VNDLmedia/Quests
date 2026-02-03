// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - POI Creation Modal (Admin)
// ═══════════════════════════════════════════════════════════════════════════
// Modal for admins to create new Points of Interest on the presentation map

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS } from '../theme';

const ICON_OPTIONS = [
  { icon: 'location', label: 'Location' },
  { icon: 'star', label: 'Star' },
  { icon: 'flag', label: 'Flag' },
  { icon: 'diamond', label: 'Diamond' },
  { icon: 'trophy', label: 'Trophy' },
  { icon: 'heart', label: 'Heart' },
  { icon: 'flash', label: 'Flash' },
  { icon: 'compass', label: 'Compass' },
  { icon: 'bulb', label: 'Bulb' },
  { icon: 'ribbon', label: 'Ribbon' },
];

const COLOR_OPTIONS = [
  { color: '#E8B84A', label: 'Gold' },
  { color: '#5DADE2', label: 'Blue' },
  { color: '#2ECC71', label: 'Green' },
  { color: '#E74C3C', label: 'Red' },
  { color: '#9B59B6', label: 'Purple' },
  { color: '#F39C12', label: 'Orange' },
];

const POICreationModal = ({
  visible,
  position, // { positionX, positionY } - 0-100%
  onClose,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [qrCodeId, setQrCodeId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [infoTitle, setInfoTitle] = useState('');
  const [infoText, setInfoText] = useState('');
  const [infoImageUrl, setInfoImageUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('location');
  const [selectedColor, setSelectedColor] = useState('#E8B84A');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setName('');
      setDescription('');
      setQrCodeId('');
      setVideoUrl('');
      setInfoTitle('');
      setInfoText('');
      setInfoImageUrl('');
      setSelectedIcon('location');
      setSelectedColor('#E8B84A');
      setIsSaving(false);
    }
  }, [visible]);

  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!qrCodeId.trim()) {
      Alert.alert('Error', 'Please enter a QR code ID');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        positionX: position?.positionX || 50,
        positionY: position?.positionY || 50,
        icon: selectedIcon,
        iconColor: selectedColor,
        qrCodeId: qrCodeId.trim().toUpperCase(),
        videoUrl: videoUrl.trim() || null,
        infoTitle: infoTitle.trim() || null,
        infoText: infoText.trim() || null,
        infoImageUrl: infoImageUrl.trim() || null,
      });
      onClose();
    } catch (error) {
      console.error('Error saving POI:', error);
      Alert.alert('Error', 'POI could not be saved');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.modal,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text.muted} />
              </TouchableOpacity>
              <Text style={styles.title}>New POI</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Position Info */}
            {position && (
              <View style={styles.positionInfo}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={styles.positionText}>
                  Position: {position.positionX.toFixed(1)}%, {position.positionY.toFixed(1)}%
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name */}
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="z.B. Station 1"
                placeholderTextColor={COLORS.text.muted}
              />

              {/* QR Code ID */}
              <Text style={styles.label}>QR-Code ID *</Text>
              <TextInput
                style={styles.input}
                value={qrCodeId}
                onChangeText={setQrCodeId}
                placeholder="z.B. POI001"
                placeholderTextColor={COLORS.text.muted}
                autoCapitalize="characters"
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Short description..."
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
                      selectedIcon === option.icon && { borderColor: selectedColor },
                    ]}
                    onPress={() => setSelectedIcon(option.icon)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={selectedIcon === option.icon ? selectedColor : COLORS.text.secondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Selection */}
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: option.color },
                      selectedColor === option.color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(option.color)}
                  >
                    {selectedColor === option.color && (
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Video URL */}
              <Text style={styles.label}>Video URL (optional)</Text>
              <TextInput
                style={styles.input}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://..."
                placeholderTextColor={COLORS.text.muted}
                autoCapitalize="none"
                keyboardType="url"
              />

              {/* Info Title */}
              <Text style={styles.label}>Info Title</Text>
              <TextInput
                style={styles.input}
                value={infoTitle}
                onChangeText={setInfoTitle}
                placeholder="Headline after video..."
                placeholderTextColor={COLORS.text.muted}
              />

              {/* Info Text */}
              <Text style={styles.label}>Info Text</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={infoText}
                onChangeText={setInfoText}
                placeholder="Detailed text..."
                placeholderTextColor={COLORS.text.muted}
                multiline
                numberOfLines={4}
              />

              {/* Info Image Filename */}
              <Text style={styles.label}>Fullscreen Image (optional)</Text>
              <TextInput
                style={styles.input}
                value={infoImageUrl}
                onChangeText={setInfoImageUrl}
                placeholder="example.jpg"
                placeholderTextColor={COLORS.text.muted}
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                z.B. "@public/img/Ramy.jpeg" oder "filename.jpg" (aus /public/img/)
              </Text>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Save Button */}
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
                  <Text style={styles.saveText}>Saving...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.text.primary} />
                    <Text style={styles.saveText}>Create POI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 32,
  },
  positionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(232,184,74,0.1)',
  },
  positionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: 'rgba(232,184,74,0.1)',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFF',
    ...SHADOWS.md,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 16,
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
  helperText: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});

export default POICreationModal;
