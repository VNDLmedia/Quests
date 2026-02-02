// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Challenge Creation Modal (Admin Only)
// Multi-step wizard for creating challenges including questline challenges
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, RADII, SHADOWS } from '../theme';
import {
  createChallenge,
  getAvailableChallengeIcons,
  getProgressKeys,
  getAvailableCards,
  fetchAvailableQuests,
} from '../game/services/ChallengeCreationService';
import { CHALLENGE_TIERS, CHALLENGE_TYPES, CHALLENGE_MODES } from '../game/config/challenges';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

const { width } = Dimensions.get('window');

const GRADIENT_PRESETS = [
  { name: 'Gold', colors: ['#FFD700', '#FFA500'] },
  { name: 'Silver', colors: ['#C0C0C0', '#808080'] },
  { name: 'Bronze', colors: ['#CD7F32', '#8B4513'] },
  { name: 'Purple', colors: ['#8B5CF6', '#7C3AED'] },
  { name: 'Pink', colors: ['#EC4899', '#F472B6'] },
  { name: 'Green', colors: ['#10B981', '#059669'] },
  { name: 'Blue', colors: ['#3B82F6', '#2563EB'] },
  { name: 'Red', colors: ['#EF4444', '#DC2626'] },
  { name: 'Cyan', colors: ['#06B6D4', '#0891B2'] },
];

const ChallengeCreationModal = ({ visible, onClose, userId, onChallengeCreated }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('trophy');
  const [selectedTier, setSelectedTier] = useState('bronze');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].colors);

  // Step 2: Challenge Mode
  const [challengeMode, setChallengeMode] = useState('progress');
  const [progressKey, setProgressKey] = useState('completedQuests');
  const [targetValue, setTargetValue] = useState('5');
  const [challengeType, setChallengeType] = useState('quest_count');

  // Step 3: Quest Selection (for questline mode)
  const [availableQuests, setAvailableQuests] = useState([]);
  const [selectedQuests, setSelectedQuests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingQuests, setLoadingQuests] = useState(false);

  // Step 4: Rewards
  const [xpReward, setXpReward] = useState('100');
  const [selectedCard, setSelectedCard] = useState(null);
  const [claimLocation, setClaimLocation] = useState('Info-Stand Halle A');
  const [availableCards, setAvailableCards] = useState([]);

  // Load available quests when entering questline mode
  useEffect(() => {
    if (challengeMode === 'questline' && availableQuests.length === 0) {
      loadAvailableQuests();
    }
  }, [challengeMode]);

  // Load available cards
  useEffect(() => {
    loadAvailableCards();
  }, []);

  const loadAvailableQuests = async () => {
    setLoadingQuests(true);
    try {
      const result = await fetchAvailableQuests();
      if (result.success) {
        setAvailableQuests(result.quests);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoadingQuests(false);
    }
  };

  const loadAvailableCards = async () => {
    try {
      const cards = await getAvailableCards();
      setAvailableCards(cards);
      if (cards.length > 0) {
        setSelectedCard(cards[0]);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleAddQuest = (quest) => {
    if (!selectedQuests.find(q => q.id === quest.id)) {
      setSelectedQuests([...selectedQuests, { ...quest, isRequired: true, bonusXp: 0 }]);
    }
  };

  const handleRemoveQuest = (questId) => {
    setSelectedQuests(selectedQuests.filter(q => q.id !== questId));
  };

  const handleMoveQuest = (index, direction) => {
    const newQuests = [...selectedQuests];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newQuests.length) {
      [newQuests[index], newQuests[targetIndex]] = [newQuests[targetIndex], newQuests[index]];
      setSelectedQuests(newQuests);
    }
  };

  const handleNext = () => {
    // Validate current step
    if (step === 1) {
      if (!title.trim()) {
        Alert.alert('Missing Information', 'Please enter a challenge title');
        return;
      }
      if (!description.trim()) {
        Alert.alert('Missing Information', 'Please enter a description');
        return;
      }
    }
    
    if (step === 2) {
      if (challengeMode === 'progress') {
        const target = parseInt(targetValue);
        if (isNaN(target) || target < 1) {
          Alert.alert('Invalid Target', 'Target value must be at least 1');
          return;
        }
      }
    }
    
    if (step === 3 && challengeMode === 'questline') {
      if (selectedQuests.length === 0) {
        Alert.alert('No Quests Selected', 'Please select at least one quest for the questline');
        return;
      }
    }
    
    // Handle step navigation
    if (step === 2 && challengeMode === 'progress') {
      // Skip step 3 for progress-based challenges
      setStep(4);
    } else if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 4 && challengeMode === 'progress') {
      // Skip step 3 when going back for progress-based challenges
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const challengeData = {
        title,
        description,
        longDescription,
        icon: selectedIcon,
        tier: selectedTier,
        gradient: selectedGradient,
        type: challengeType,
        challengeMode,
        xpReward: parseInt(xpReward) || 100,
        reward: {
          type: 'physical_card',
          cardId: selectedCard?.id || 'marcus',
          imagePath: selectedCard?.imagePath,
          claimLocation,
        },
      };

      if (challengeMode === 'progress') {
        challengeData.progressKey = progressKey;
        challengeData.target = parseInt(targetValue) || 5;
      } else {
        challengeData.quests = selectedQuests.map(q => ({
          questId: q.id,
          isRequired: q.isRequired !== false,
          bonusXp: q.bonusXp || 0,
        }));
        challengeData.target = selectedQuests.length;
      }

      const result = await createChallenge(challengeData, userId);

      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert('Challenge created successfully!');
        } else {
          Alert.alert('Success', 'Challenge created successfully!');
        }
        onChallengeCreated?.(result.challenge);
        resetForm();
        onClose();
      } else {
        const errorMsg = result.errors?.join('\n') || result.error || 'Failed to create challenge';
        if (Platform.OS === 'web') {
          window.alert('Error: ' + errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = error.message || 'Unknown error occurred';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setLongDescription('');
    setSelectedIcon('trophy');
    setSelectedTier('bronze');
    setSelectedGradient(GRADIENT_PRESETS[0].colors);
    setChallengeMode('progress');
    setProgressKey('completedQuests');
    setTargetValue('5');
    setChallengeType('quest_count');
    setSelectedQuests([]);
    setSearchQuery('');
    setXpReward('100');
    setClaimLocation('Info-Stand Halle A');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredQuests = availableQuests.filter(quest => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      quest.title?.toLowerCase().includes(query) ||
      quest.description?.toLowerCase().includes(query) ||
      quest.category?.toLowerCase().includes(query)
    );
  });

  const icons = getAvailableChallengeIcons();
  const progressKeys = getProgressKeys();
  const tiers = Object.entries(CHALLENGE_TIERS);
  const types = Object.entries(CHALLENGE_TYPES);

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
          <Text style={styles.headerTitle}>Create Challenge</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                step >= s && styles.progressDotActive,
                // Hide step 3 indicator for progress mode
                (s === 3 && challengeMode === 'progress') && styles.progressDotHidden,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Basic Information</Text>
              <Text style={styles.stepDescription}>
                Enter the challenge details
              </Text>

              <Text style={styles.inputLabel}>Challenge Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter challenge name..."
                placeholderTextColor={COLORS.text.muted}
                maxLength={50}
              />

              <Text style={styles.inputLabel}>Short Description *</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description..."
                placeholderTextColor={COLORS.text.muted}
                maxLength={100}
              />

              <Text style={styles.inputLabel}>Long Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={longDescription}
                onChangeText={setLongDescription}
                placeholder="Detailed description (optional)..."
                placeholderTextColor={COLORS.text.muted}
                multiline
                numberOfLines={3}
                maxLength={500}
              />

              <Text style={styles.inputLabel}>Icon *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScrollView}>
                <View style={styles.iconRow}>
                  {icons.map((iconItem) => (
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
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Tier *</Text>
              <View style={styles.tierGrid}>
                {tiers.map(([key, tier]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.tierOption,
                      { borderColor: tier.color },
                      selectedTier === key && { backgroundColor: tier.bgColor },
                    ]}
                    onPress={() => setSelectedTier(key)}
                  >
                    <Ionicons name={tier.icon} size={20} color={tier.color} />
                    <Text style={[styles.tierOptionText, { color: tier.color }]}>
                      {tier.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Gradient Colors</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gradientRow}>
                  {GRADIENT_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={[
                        styles.gradientOption,
                        selectedGradient[0] === preset.colors[0] && styles.gradientOptionSelected,
                      ]}
                      onPress={() => setSelectedGradient(preset.colors)}
                    >
                      <LinearGradient
                        colors={preset.colors}
                        style={styles.gradientPreview}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <Text style={styles.gradientName}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* STEP 2: Challenge Mode */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Challenge Type</Text>
              <Text style={styles.stepDescription}>
                Choose how progress is tracked
              </Text>

              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    challengeMode === 'progress' && styles.modeOptionSelected,
                  ]}
                  onPress={() => setChallengeMode('progress')}
                >
                  <Ionicons
                    name="trending-up"
                    size={32}
                    color={challengeMode === 'progress' ? COLORS.primary : COLORS.text.secondary}
                  />
                  <Text style={[
                    styles.modeTitle,
                    challengeMode === 'progress' && styles.modeTitleSelected,
                  ]}>
                    Progress-Based
                  </Text>
                  <Text style={styles.modeDescription}>
                    Track automatic progress like quest count, friends, etc.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    challengeMode === 'questline' && styles.modeOptionSelected,
                  ]}
                  onPress={() => setChallengeMode('questline')}
                >
                  <Ionicons
                    name="git-branch"
                    size={32}
                    color={challengeMode === 'questline' ? COLORS.primary : COLORS.text.secondary}
                  />
                  <Text style={[
                    styles.modeTitle,
                    challengeMode === 'questline' && styles.modeTitleSelected,
                  ]}>
                    Quest Line
                  </Text>
                  <Text style={styles.modeDescription}>
                    A sequence of specific quests to complete in order
                  </Text>
                </TouchableOpacity>
              </View>

              {challengeMode === 'progress' && (
                <>
                  <Text style={styles.inputLabel}>Challenge Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.typeRow}>
                      {types.map(([key, type]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.typeOption,
                            { borderColor: type.color },
                            challengeType === key && { backgroundColor: `${type.color}20` },
                          ]}
                          onPress={() => setChallengeType(key)}
                        >
                          <Ionicons name={type.icon} size={20} color={type.color} />
                          <Text style={[styles.typeOptionText, { color: type.color }]}>
                            {type.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={styles.inputLabel}>Progress Metric *</Text>
                  <View style={styles.progressKeyList}>
                    {progressKeys.map((pk) => (
                      <TouchableOpacity
                        key={pk.key}
                        style={[
                          styles.progressKeyOption,
                          progressKey === pk.key && styles.progressKeySelected,
                        ]}
                        onPress={() => setProgressKey(pk.key)}
                      >
                        <Text style={[
                          styles.progressKeyName,
                          progressKey === pk.key && styles.progressKeyNameSelected,
                        ]}>
                          {pk.name}
                        </Text>
                        <Text style={styles.progressKeyDesc}>{pk.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Target Value *</Text>
                  <TextInput
                    style={styles.input}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="numeric"
                    placeholder="e.g., 5"
                    placeholderTextColor={COLORS.text.muted}
                  />
                </>
              )}
            </View>
          )}

          {/* STEP 3: Quest Selection (Questline Mode Only) */}
          {step === 3 && challengeMode === 'questline' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Quests</Text>
              <Text style={styles.stepDescription}>
                Choose and order quests for the quest line
              </Text>

              {/* Selected Quests */}
              {selectedQuests.length > 0 && (
                <View style={styles.selectedQuestsSection}>
                  <Text style={styles.sectionTitle}>
                    Quest Sequence ({selectedQuests.length})
                  </Text>
                  {selectedQuests.map((quest, index) => (
                    <View key={quest.id} style={styles.selectedQuestItem}>
                      <View style={styles.questOrder}>
                        <Text style={styles.questOrderText}>{index + 1}</Text>
                      </View>
                      <View style={styles.questInfo}>
                        <Text style={styles.questTitle}>{quest.title}</Text>
                        <Text style={styles.questCategory}>{quest.category}</Text>
                      </View>
                      <View style={styles.questActions}>
                        <TouchableOpacity
                          onPress={() => handleMoveQuest(index, 'up')}
                          disabled={index === 0}
                          style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                        >
                          <Ionicons name="chevron-up" size={20} color={index === 0 ? COLORS.text.muted : COLORS.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleMoveQuest(index, 'down')}
                          disabled={index === selectedQuests.length - 1}
                          style={[styles.moveButton, index === selectedQuests.length - 1 && styles.moveButtonDisabled]}
                        >
                          <Ionicons name="chevron-down" size={20} color={index === selectedQuests.length - 1 ? COLORS.text.muted : COLORS.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveQuest(quest.id)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close-circle" size={24} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Available Quests */}
              <View style={styles.availableQuestsSection}>
                <Text style={styles.sectionTitle}>Available Quests</Text>
                
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search quests..."
                  placeholderTextColor={COLORS.text.muted}
                />

                {loadingQuests ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                ) : (
                  <View style={styles.questList}>
                    {filteredQuests.map((quest) => {
                      const isSelected = selectedQuests.some(q => q.id === quest.id);
                      return (
                        <TouchableOpacity
                          key={quest.id}
                          style={[
                            styles.availableQuestItem,
                            isSelected && styles.availableQuestItemSelected,
                          ]}
                          onPress={() => !isSelected && handleAddQuest(quest)}
                          disabled={isSelected}
                        >
                          <Ionicons
                            name={quest.icon || 'compass'}
                            size={20}
                            color={isSelected ? COLORS.text.muted : COLORS.primary}
                          />
                          <View style={styles.availableQuestInfo}>
                            <Text style={[
                              styles.availableQuestTitle,
                              isSelected && styles.availableQuestTitleSelected,
                            ]}>
                              {quest.title}
                            </Text>
                            <Text style={styles.availableQuestCategory}>
                              {quest.category} • {quest.xp_reward || quest.xpReward} XP
                            </Text>
                          </View>
                          {isSelected ? (
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                          ) : (
                            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    {filteredQuests.length === 0 && (
                      <Text style={styles.noQuestsText}>No quests found</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* STEP 4: Rewards */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Rewards</Text>
              <Text style={styles.stepDescription}>
                Configure the challenge reward
              </Text>

              <Text style={styles.inputLabel}>XP Reward *</Text>
              <TextInput
                style={styles.input}
                value={xpReward}
                onChangeText={setXpReward}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={COLORS.text.muted}
              />

              <Text style={styles.inputLabel}>Physical Card Reward *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.cardRow}>
                  {availableCards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.cardOption,
                        selectedCard?.id === card.id && styles.cardOptionSelected,
                      ]}
                      onPress={() => setSelectedCard(card)}
                    >
                      <View style={styles.cardPreview}>
                        <Ionicons name="card" size={32} color={selectedCard?.id === card.id ? COLORS.primary : COLORS.text.secondary} />
                      </View>
                      <Text style={[
                        styles.cardName,
                        selectedCard?.id === card.id && styles.cardNameSelected,
                      ]}>
                        {card.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Claim Location *</Text>
              <TextInput
                style={styles.input}
                value={claimLocation}
                onChangeText={setClaimLocation}
                placeholder="e.g., Info-Stand Halle A"
                placeholderTextColor={COLORS.text.muted}
                maxLength={100}
              />
            </View>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Review & Confirm</Text>
              <Text style={styles.stepDescription}>
                Review your challenge before creating
              </Text>

              <GlassCard style={styles.reviewCard} variant="dark">
                <View style={styles.reviewHeader}>
                  <LinearGradient
                    colors={selectedGradient}
                    style={styles.reviewGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={selectedIcon} size={32} color="#FFF" />
                  </LinearGradient>
                  <View style={styles.reviewHeaderText}>
                    <Text style={styles.reviewTitle}>{title}</Text>
                    <Text style={styles.reviewTier}>
                      {CHALLENGE_TIERS[selectedTier]?.name} Tier
                    </Text>
                  </View>
                </View>

                <View style={styles.reviewDivider} />

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Description:</Text>
                  <Text style={styles.reviewValue}>{description}</Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Mode:</Text>
                  <Text style={styles.reviewValue}>
                    {challengeMode === 'questline' ? 'Quest Line' : 'Progress-Based'}
                  </Text>
                </View>

                {challengeMode === 'progress' ? (
                  <>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Progress Key:</Text>
                      <Text style={styles.reviewValue}>{progressKey}</Text>
                    </View>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Target:</Text>
                      <Text style={styles.reviewValue}>{targetValue}</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Quests:</Text>
                    <Text style={styles.reviewValue}>{selectedQuests.length} quests in sequence</Text>
                  </View>
                )}

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>XP Reward:</Text>
                  <Text style={styles.reviewValue}>{xpReward} XP</Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Card Reward:</Text>
                  <Text style={styles.reviewValue}>{selectedCard?.name || 'None'}</Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Claim Location:</Text>
                  <Text style={styles.reviewValue}>{claimLocation}</Text>
                </View>
              </GlassCard>

              <GlassButton
                title={saving ? "Creating Challenge..." : "Create Challenge"}
                onPress={handleSave}
                variant="gradient"
                gradient={selectedGradient}
                icon={<Ionicons name="checkmark-circle" size={22} color={COLORS.text.primary} />}
                loading={saving}
                disabled={saving}
              />
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        {step > 1 && step < 5 && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity style={styles.navButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.navSpacer} />
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View style={styles.navigationContainer}>
            <View style={styles.navSpacer} />
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
        )}

        {step === 5 && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity style={styles.navButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.navSpacer} />
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
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surface,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotHidden: {
    opacity: 0.3,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 24,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    marginTop: 8,
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
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 12,
    color: COLORS.text.primary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
  },
  iconScrollView: {
    marginBottom: 8,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  iconOption: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.md,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  tierOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gradientRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  gradientOption: {
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.md,
    padding: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientOptionSelected: {
    borderColor: COLORS.primary,
  },
  gradientPreview: {
    width: 50,
    height: 50,
    borderRadius: RADII.md,
  },
  gradientName: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  modeOption: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  modeTitleSelected: {
    color: COLORS.primary,
  },
  modeDescription: {
    fontSize: 11,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.md,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressKeyList: {
    gap: 8,
  },
  progressKeyOption: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  progressKeySelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  progressKeyName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  progressKeyNameSelected: {
    color: COLORS.primary,
  },
  progressKeyDesc: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  selectedQuestsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  selectedQuestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  questOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  questCategory: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  questActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moveButton: {
    padding: 4,
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  removeButton: {
    padding: 4,
  },
  availableQuestsSection: {
    flex: 1,
  },
  questList: {
    gap: 8,
  },
  availableQuestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 12,
    gap: 12,
  },
  availableQuestItemSelected: {
    opacity: 0.5,
  },
  availableQuestInfo: {
    flex: 1,
  },
  availableQuestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  availableQuestTitleSelected: {
    color: COLORS.text.muted,
  },
  availableQuestCategory: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  noQuestsText: {
    textAlign: 'center',
    color: COLORS.text.muted,
    padding: 20,
  },
  loader: {
    padding: 40,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  cardOption: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
  },
  cardOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  cardPreview: {
    width: 60,
    height: 80,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: RADII.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  cardNameSelected: {
    color: COLORS.primary,
  },
  reviewCard: {
    padding: 20,
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  reviewGradient: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  reviewTier: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  reviewLabel: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontWeight: '600',
    flex: 0.4,
  },
  reviewValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
    flex: 0.6,
    textAlign: 'right',
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
});

export default ChallengeCreationModal;
