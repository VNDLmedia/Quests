import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, Dimensions, Animated, Pressable, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassButton } from '../components';
import { useGame } from '../game/GameProvider';
import { CARDS, RARITY, getCollectionCompletion, getRarityDistribution } from '../game/config/cards';
import { COLORS, SHADOWS } from '../theme';
import Card3D from '../components/Card3D';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_WIDTH = (width - 60) / COLUMN_COUNT;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// QR Code Feature Types
const FEATURE_TYPES = [
  { id: 'reward', label: 'Belohnung', icon: 'gift' },
  { id: 'gems', label: 'Gems', icon: 'diamond' },
  { id: 'xp', label: 'XP', icon: 'flash' },
  { id: 'pack', label: 'Pack', icon: 'cube' },
  { id: 'quest', label: 'Quest', icon: 'compass' },
  { id: 'event', label: 'Event', icon: 'calendar' },
  { id: 'location', label: 'Location', icon: 'location' },
  { id: 'custom', label: 'Custom', icon: 'code' },
];

// Tabs for profile page - Admin tab für Admin-User
const TABS = [
  { id: 'profile', label: 'Profil', icon: 'person' },
  { id: 'collection', label: 'Sammlung', icon: 'albums' },
  { id: 'admin', label: 'Admin', icon: 'settings' },
];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { player, collection, uniqueCards, user, addGems, addXP } = useGame();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState('player'); // 'player' oder 'register'
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedCard, setSelectedCard] = useState(null);
  const [rarityFilter, setRarityFilter] = useState('all');
  const cardScale = useRef(new Animated.Value(1)).current;
  
  // Admin State
  const [registeredQRCodes, setRegisteredQRCodes] = useState([]);
  const [loadingQRCodes, setLoadingQRCodes] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newQRCode, setNewQRCode] = useState({
    qr_code_id: '',
    name: '',
    feature_type: 'gems',
    feature_value: { amount: 50 },
    single_use: true,
  });
  const [scanResult, setScanResult] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scanTimeoutRef = useRef(null);
  const lastScannedRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // QR CODE MANAGEMENT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Lade registrierte QR-Codes
  const loadRegisteredQRCodes = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoadingQRCodes(true);
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .order('registered_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setRegisteredQRCodes(data || []);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setLoadingQRCodes(false);
    }
  }, []);

  // Lade QR-Codes wenn Admin-Tab aktiv wird
  useEffect(() => {
    if (activeTab === 'admin') {
      loadRegisteredQRCodes();
    }
  }, [activeTab, loadRegisteredQRCodes]);

  // Registriere einen neuen QR-Code
  const registerQRCode = async (qrCodeId, options = {}) => {
    if (!isSupabaseConfigured() || !user) {
      Alert.alert('Fehler', 'Nicht angemeldet');
      return { error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          qr_code_id: qrCodeId,
          name: options.name || `QR-Code ${qrCodeId.slice(0, 8)}`,
          feature_type: options.feature_type || 'gems',
          feature_value: options.feature_value || { amount: 50 },
          single_use: options.single_use !== false,
          registered_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Bereits registriert', 'Dieser QR-Code ist bereits registriert.');
        } else {
          Alert.alert('Fehler', error.message);
        }
        return { error };
      }

      Alert.alert('Erfolg!', `QR-Code "${qrCodeId}" wurde registriert.`);
      loadRegisteredQRCodes();
      return { data };
    } catch (error) {
      Alert.alert('Fehler', error.message);
      return { error };
    }
  };

  // Prüfe und verarbeite einen gescannten QR-Code
  const processScannedQRCode = async (scannedData) => {
    if (!isSupabaseConfigured() || !user) return null;

    try {
      // Suche den QR-Code in der Datenbank
      const { data: qrCode, error: findError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('qr_code_id', scannedData)
        .single();

      if (findError || !qrCode) {
        return { found: false, message: 'QR-Code nicht registriert' };
      }

      // Prüfe ob aktiv
      if (!qrCode.is_active) {
        return { found: true, valid: false, message: 'QR-Code ist nicht mehr aktiv' };
      }

      // Prüfe Gültigkeit
      if (qrCode.valid_until && new Date(qrCode.valid_until) < new Date()) {
        return { found: true, valid: false, message: 'QR-Code ist abgelaufen' };
      }

      // Prüfe ob User schon gescannt hat
      const { data: existingScan } = await supabase
        .from('qr_code_scans')
        .select('id')
        .eq('qr_code_id', qrCode.id)
        .eq('user_id', user.id)
        .single();

      if (existingScan) {
        return { found: true, valid: false, message: 'Du hast diesen Code bereits gescannt' };
      }

      // Prüfe max uses
      if (qrCode.single_use && qrCode.current_uses >= 1) {
        return { found: true, valid: false, message: 'QR-Code wurde bereits verwendet' };
      }

      if (qrCode.max_uses && qrCode.current_uses >= qrCode.max_uses) {
        return { found: true, valid: false, message: 'QR-Code hat maximale Nutzungen erreicht' };
      }

      // Verarbeite die Belohnung
      let rewardGiven = {};
      const featureValue = qrCode.feature_value || {};

      switch (qrCode.feature_type) {
        case 'gems':
          const gemAmount = featureValue.amount || 50;
          addGems(gemAmount);
          rewardGiven = { gems: gemAmount };
          break;
        case 'xp':
          const xpAmount = featureValue.amount || 100;
          addXP(xpAmount);
          rewardGiven = { xp: xpAmount };
          break;
        case 'reward':
          if (featureValue.gems) addGems(featureValue.gems);
          if (featureValue.xp) addXP(featureValue.xp);
          rewardGiven = featureValue;
          break;
        default:
          rewardGiven = { type: qrCode.feature_type, value: featureValue };
      }

      // Speichere den Scan
      await supabase.from('qr_code_scans').insert({
        qr_code_id: qrCode.id,
        user_id: user.id,
        reward_given: rewardGiven,
      });

      // Erhöhe current_uses
      await supabase
        .from('qr_codes')
        .update({ current_uses: qrCode.current_uses + 1 })
        .eq('id', qrCode.id);

      return { 
        found: true, 
        valid: true, 
        qrCode, 
        reward: rewardGiven,
        message: `Belohnung erhalten!`
      };
    } catch (error) {
      console.error('Error processing QR code:', error);
      return { error: error.message };
    }
  };

  // Lösche einen QR-Code
  const deleteQRCode = async (id) => {
    if (!isSupabaseConfigured()) return;
    
    Alert.alert(
      'QR-Code löschen',
      'Bist du sicher, dass du diesen QR-Code löschen möchtest?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('qr_codes')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              loadRegisteredQRCodes();
            } catch (error) {
              Alert.alert('Fehler', error.message);
            }
          },
        },
      ]
    );
  };

  // Calculate Progress
  const xpProgress = (player.xpInCurrentLevel / player.xpNeededForNext) * 100;
  
  // Collection Stats using new helper functions
  const collectionStats = getCollectionCompletion(uniqueCards || []);
  const rarityStats = getRarityDistribution(uniqueCards || []);
  const unlockedCards = CARDS.filter(c => (uniqueCards || []).includes(c.id));
  const totalPower = unlockedCards.reduce((sum, c) => sum + c.power, 0);
  
  // Filtered Cards
  const filteredCards = rarityFilter === 'all' 
    ? CARDS 
    : CARDS.filter(c => c.rarity.id === rarityFilter);

  const openCardDetail = (card) => {
    setSelectedCard(card);
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const closeCardDetail = () => {
    Animated.timing(cardScale, {
      toValue: 0.8,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setSelectedCard(null));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPROVED CAMERA & SCANNING FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const startScan = async (mode = 'player') => {
    // Reset states
    setCameraReady(false);
    setCameraError(null);
    setScanResult(null);
    lastScannedRef.current = null;
    setScanMode(mode);
    
    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    // Request camera permission
    if (!permission?.granted) {
      try {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert(
            'Kamera-Berechtigung benötigt',
            'Bitte erlaube den Kamera-Zugriff in den Einstellungen, um QR-Codes zu scannen.',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        console.error('Permission error:', error);
        setCameraError('Kamera-Berechtigung konnte nicht angefragt werden');
        return;
      }
    }
    
    setIsScanning(true);
    
    // Auto-close after 60 seconds if nothing scanned
    scanTimeoutRef.current = setTimeout(() => {
      if (isScanning) {
        setIsScanning(false);
        Alert.alert('Timeout', 'Kein QR-Code erkannt. Bitte versuche es erneut.');
      }
    }, 60000);
  };

  const handleBarCodeScanned = async ({ data, type }) => {
    // Prevent duplicate scans
    if (lastScannedRef.current === data) return;
    lastScannedRef.current = data;
    
    // Clear timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    console.log('Scanned QR Code:', data, 'Type:', type);
    
    if (scanMode === 'register') {
      // Admin mode: Registriere den QR-Code
      setIsScanning(false);
      setNewQRCode(prev => ({ ...prev, qr_code_id: data }));
      setShowRegisterModal(true);
    } else {
      // Normal mode: Verarbeite den QR-Code
      const result = await processScannedQRCode(data);
      setScanResult(result);
      
      // Zeige Ergebnis
      setTimeout(() => {
        setIsScanning(false);
        
        if (result?.valid) {
          // Erfolg!
          const rewardText = result.reward?.gems 
            ? `+${result.reward.gems} Gems!` 
            : result.reward?.xp 
              ? `+${result.reward.xp} XP!`
              : 'Belohnung erhalten!';
          Alert.alert('Erfolg! 🎉', rewardText);
        } else if (result?.found === false) {
          // Unbekannter Code - könnte ein Player sein
          if (data.startsWith('USER:')) {
            Alert.alert('Spieler gefunden', `Player ID: ${data.replace('USER:', '')}`);
          } else {
            Alert.alert('Unbekannt', `Code "${data}" ist nicht registriert.`);
          }
        } else {
          Alert.alert('Info', result?.message || 'QR-Code konnte nicht verarbeitet werden');
        }
      }, 500);
    }
  };

  const onCameraReady = () => {
    setCameraReady(true);
    setCameraError(null);
  };

  const onCameraError = (error) => {
    console.error('Camera error:', error);
    setCameraError('Kamera konnte nicht gestartet werden');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const renderCollectionItem = (card) => {
    const isUnlocked = (uniqueCards || []).includes(card.id);
    const duplicateCount = (collection || []).filter(id => id === card.id).length;

    return (
      <Pressable 
        key={card.id} 
        style={styles.cardWrapper}
        onPress={() => isUnlocked && openCardDetail(card)}
      >
        <View style={[styles.cardItem, !isUnlocked && styles.cardLocked]}>
          {isUnlocked ? (
            <LinearGradient
              colors={card.rarity.color}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardShine} />
              <Ionicons name={card.icon} size={28} color="white" />
              <View style={styles.powerBadge}>
                <Ionicons name="flash" size={10} color="#fbbf24" />
                <Text style={styles.powerText}>{card.power}</Text>
              </View>
              {duplicateCount > 1 && (
                <View style={styles.duplicateBadge}>
                  <Text style={styles.duplicateText}>x{duplicateCount}</Text>
                </View>
              )}
              <View style={styles.rarityIndicator}>
                <View style={[styles.rarityDot, { backgroundColor: card.rarity.color[1] }]} />
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.lockedContent}>
              <View style={styles.lockCircle}>
                <Ionicons name="lock-closed" size={20} color={COLORS.text.muted} />
              </View>
              <Text style={styles.levelReq}>Pack</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardName, !isUnlocked && styles.textLocked]} numberOfLines={1}>
          {card.name}
        </Text>
      </Pressable>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER ADMIN TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderAdminTab = () => {
    return (
      <View style={styles.adminTab}>
        {/* Admin Header */}
        <View style={styles.adminHeader}>
          <Text style={styles.adminTitle}>QR-Code Verwaltung</Text>
          <Text style={styles.adminSubtitle}>Registriere und verwalte deine QR-Codes</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.adminActions}>
          <TouchableOpacity 
            style={styles.adminActionBtn}
            onPress={() => startScan('register')}
          >
            <LinearGradient 
              colors={COLORS.gradients.primary} 
              style={styles.adminActionGradient}
            >
              <Ionicons name="qr-code" size={28} color="white" />
              <Text style={styles.adminActionText}>QR-Code Scannen</Text>
              <Text style={styles.adminActionDesc}>Zum Registrieren</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminActionBtn}
            onPress={() => setShowRegisterModal(true)}
          >
            <LinearGradient 
              colors={['#10b981', '#34d399']} 
              style={styles.adminActionGradient}
            >
              <Ionicons name="add-circle" size={28} color="white" />
              <Text style={styles.adminActionText}>Manuell Eingeben</Text>
              <Text style={styles.adminActionDesc}>ID direkt eingeben</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.adminStats}>
          <View style={styles.adminStatBox}>
            <Text style={styles.adminStatNumber}>{registeredQRCodes.length}</Text>
            <Text style={styles.adminStatLabel}>Registriert</Text>
          </View>
          <View style={styles.adminStatBox}>
            <Text style={styles.adminStatNumber}>
              {registeredQRCodes.filter(qr => qr.is_active).length}
            </Text>
            <Text style={styles.adminStatLabel}>Aktiv</Text>
          </View>
          <View style={styles.adminStatBox}>
            <Text style={styles.adminStatNumber}>
              {registeredQRCodes.reduce((sum, qr) => sum + (qr.current_uses || 0), 0)}
            </Text>
            <Text style={styles.adminStatLabel}>Scans</Text>
          </View>
        </View>

        {/* Registered QR Codes List */}
        <Text style={styles.sectionTitle}>Registrierte QR-Codes</Text>
        
        {loadingQRCodes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Lade QR-Codes...</Text>
          </View>
        ) : registeredQRCodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="qr-code-outline" size={48} color={COLORS.text.muted} />
            <Text style={styles.emptyStateText}>Noch keine QR-Codes registriert</Text>
            <Text style={styles.emptyStateSubtext}>Scanne oder gib einen QR-Code ein</Text>
          </View>
        ) : (
          <View style={styles.qrCodesList}>
            {registeredQRCodes.map((qrCode) => (
              <View key={qrCode.id} style={styles.qrCodeItem}>
                <View style={styles.qrCodeIcon}>
                  <Ionicons 
                    name={FEATURE_TYPES.find(f => f.id === qrCode.feature_type)?.icon || 'qr-code'} 
                    size={24} 
                    color={qrCode.is_active ? COLORS.primary : COLORS.text.muted} 
                  />
                </View>
                <View style={styles.qrCodeInfo}>
                  <Text style={styles.qrCodeId}>{qrCode.qr_code_id}</Text>
                  <Text style={styles.qrCodeName}>{qrCode.name || 'Kein Name'}</Text>
                  <View style={styles.qrCodeMeta}>
                    <Text style={styles.qrCodeType}>
                      {FEATURE_TYPES.find(f => f.id === qrCode.feature_type)?.label}
                    </Text>
                    <Text style={styles.qrCodeUses}>
                      {qrCode.current_uses || 0} Scans
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.qrCodeDeleteBtn}
                  onPress={() => deleteQRCode(qrCode.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render Tab Content
  const renderTabContent = () => {
    if (activeTab === 'admin') {
      return renderAdminTab();
    }
    
    if (activeTab === 'collection') {
      return (
        <View style={styles.collectionTab}>
          {/* Collection Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <LinearGradient colors={['#3b82f6', '#60a5fa']} style={styles.statGradient}>
                <Ionicons name="albums" size={20} color="white" />
                <Text style={styles.statNumber}>{collectionStats.owned}/{collectionStats.total}</Text>
                <Text style={styles.statLabel}>Cards</Text>
              </LinearGradient>
            </View>
            <View style={styles.statBox}>
              <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.statGradient}>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.statNumber}>{totalPower}</Text>
                <Text style={styles.statLabel}>Power</Text>
              </LinearGradient>
            </View>
            <View style={styles.statBox}>
              <LinearGradient colors={['#8b5cf6', '#a78bfa']} style={styles.statGradient}>
                <Ionicons name="diamond" size={20} color="white" />
                <Text style={styles.statNumber}>{(rarityStats.legendary || 0) + (rarityStats.epic || 0)}</Text>
                <Text style={styles.statLabel}>Rare</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Rarity Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, rarityFilter === 'all' && styles.filterChipActive]}
              onPress={() => setRarityFilter('all')}
            >
              <Text style={[styles.filterText, rarityFilter === 'all' && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {Object.entries(RARITY).map(([key, rarity]) => (
              <TouchableOpacity 
                key={key}
                style={[
                  styles.filterChip, 
                  rarityFilter === rarity.id && styles.filterChipActive,
                  rarityFilter === rarity.id && { borderColor: rarity.color[0] }
                ]}
                onPress={() => setRarityFilter(rarity.id)}
              >
                <View style={[styles.filterDot, { backgroundColor: rarity.color[0] }]} />
                <Text style={[
                  styles.filterText, 
                  rarityFilter === rarity.id && styles.filterTextActive
                ]}>{rarity.name}</Text>
                <Text style={styles.filterCount}>({
                  CARDS.filter(c => c.rarity.id === rarity.id).filter(c => (uniqueCards || []).includes(c.id)).length
                })</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cards Grid */}
          <Text style={styles.sectionTitle}>
            {rarityFilter === 'all' ? 'All Cards' : RARITY[rarityFilter.toUpperCase()]?.name || 'Cards'}
          </Text>
          <View style={styles.grid}>
            {filteredCards.map(renderCollectionItem)}
          </View>
        </View>
      );
    }

    // Profile Tab
    return (
      <>
        {/* PLAYER HEADER CARD */}
        <View style={styles.profileCard}>
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={COLORS.gradients.primary}
                style={styles.avatarBorder}
              >
                 <Ionicons name="person" size={36} color="white" />
              </LinearGradient>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{player.level}</Text>
              </View>
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.displayName || player.username}</Text>
              <Text style={styles.playerTitle}>{player.levelTitle?.title || 'Rookie'}</Text>
            </View>
          </View>
          
          {/* XP Bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBarFill, { width: `${xpProgress || 0}%` }]} />
            </View>
            <Text style={styles.xpText}>{Math.floor(player.xpInCurrentLevel || 0)} / {Math.floor(player.xpNeededForNext || 100)} XP</Text>
          </View>
        </View>

        {/* GEMS DISPLAY */}
        <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
          <View style={styles.gemsCard}>
            <View style={styles.gemsContent}>
              <View style={styles.gemsLeft}>
                <View style={styles.gemIconWrapper}>
                  <Ionicons name="diamond" size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.gemsLabel}>Your Gems</Text>
                  <Text style={styles.gemsCount}>{player.gems || 0}</Text>
                </View>
              </View>
              <View style={styles.shopButton}>
                <Text style={styles.shopButtonText}>Shop</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Collection Preview */}
        <TouchableOpacity onPress={() => setActiveTab('collection')}>
          <View style={styles.collectionPreview}>
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionTitle}>My Collection</Text>
              <View style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.previewCards}>
              {unlockedCards.slice(0, 4).map(card => (
                <LinearGradient
                  key={card.id}
                  colors={card.rarity.color}
                  style={styles.previewCard}
                >
                  <Ionicons name={card.icon} size={18} color="white" />
                </LinearGradient>
              ))}
              {unlockedCards.length > 4 && (
                <View style={styles.moreCards}>
                  <Text style={styles.moreText}>+{unlockedCards.length - 4}</Text>
                </View>
              )}
              {unlockedCards.length === 0 && (
                <View style={styles.emptyPreview}>
                  <Ionicons name="gift-outline" size={24} color={COLORS.text.muted} />
                  <Text style={styles.emptyText}>Open packs in the shop!</Text>
                </View>
              )}
            </View>
            <View style={styles.collectionProgress}>
              <View style={[styles.collectionBar, { width: `${collectionStats.percentage}%` }]} />
            </View>
            <Text style={styles.collectionSubtext}>{collectionStats.owned} of {collectionStats.total} cards collected</Text>
          </View>
        </TouchableOpacity>

        {/* ACTIONS */}
        <View style={styles.actionCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowQR(true)}>
            <View style={styles.actionIcon}>
              <Ionicons name="qr-code" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>My Quest Code</Text>
              <Text style={styles.actionDesc}>Show your code to other players</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text.muted} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.actionRow} onPress={startScan}>
             <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="scan" size={22} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Scan Players</Text>
              <Text style={styles.actionDesc}>Find NPCs or friends</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.id ? COLORS.primary : COLORS.text.muted} 
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {renderTabContent()}
      </ScrollView>

      {/* CARD DETAIL MODAL */}
      <Modal visible={!!selectedCard} transparent animationType="fade" onRequestClose={closeCardDetail}>
        <Pressable style={styles.cardModalOverlay} onPress={closeCardDetail}>
          <Animated.View style={[styles.cardDetailContainer, { transform: [{ scale: cardScale }] }]}>
            {selectedCard && (
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Card3D card={selectedCard} size="large" interactive={true} />
                <TouchableOpacity style={styles.cardCloseBtn} onPress={closeCardDetail}>
                  <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </Pressable>
            )}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* QR MODAL */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.qrCard}>
             <Text style={styles.qrTitle}>Your Code</Text>
             <View style={styles.qrWrapper}>
               <QRCode value={`USER:${player.id || 'GUEST'}`} size={200} />
             </View>
             <TouchableOpacity style={styles.qrCloseBtn} onPress={() => setShowQR(false)}>
               <Text style={styles.qrCloseBtnText}>Close</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* IMPROVED SCANNER MODAL */}
      <Modal visible={isScanning} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraContainer}>
          {cameraError ? (
            <View style={styles.cameraErrorContainer}>
              <Ionicons name="camera-outline" size={64} color={COLORS.text.muted} />
              <Text style={styles.cameraErrorText}>{cameraError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => startScan(scanMode)}
              >
                <Text style={styles.retryButtonText}>Erneut versuchen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsScanning(false)}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
              barcodeScannerSettings={{ 
                barcodeTypes: ["qr", "aztec", "ean13", "ean8", "pdf417", "upc_e", "datamatrix", "code39", "code93", "itf14", "codabar", "code128", "upc_a"] 
              }}
              onCameraReady={onCameraReady}
              onMountError={onCameraError}
            >
              <View style={styles.cameraOverlay}>
                {/* Header */}
                <View style={styles.scannerHeader}>
                  <TouchableOpacity 
                    style={styles.scannerCloseBtn} 
                    onPress={() => {
                      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                      setIsScanning(false);
                    }}
                  >
                    <Ionicons name="close" size={28} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.scannerTitle}>
                    {scanMode === 'register' ? 'QR-Code registrieren' : 'QR-Code scannen'}
                  </Text>
                  <View style={{ width: 40 }} />
                </View>
                
                {/* Scan Frame */}
                <View style={styles.scanFrameContainer}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.scanCorner, styles.cornerTopLeft]} />
                    <View style={[styles.scanCorner, styles.cornerTopRight]} />
                    <View style={[styles.scanCorner, styles.cornerBottomLeft]} />
                    <View style={[styles.scanCorner, styles.cornerBottomRight]} />
                  </View>
                  
                  {/* Loading indicator while camera initializes */}
                  {!cameraReady && (
                    <View style={styles.cameraLoadingOverlay}>
                      <ActivityIndicator size="large" color="white" />
                      <Text style={styles.cameraLoadingText}>Kamera wird geladen...</Text>
                    </View>
                  )}
                </View>
                
                {/* Instructions */}
                <View style={styles.scannerFooter}>
                  <Text style={styles.scannerHint}>
                    {scanMode === 'register' 
                      ? 'Halte den QR-Code in den Rahmen zum Registrieren'
                      : 'Halte den QR-Code in den Rahmen'}
                  </Text>
                  
                  {/* Toggle light button for dark environments */}
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity style={styles.flashButton}>
                      <Ionicons name="flashlight-outline" size={24} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </CameraView>
          )}
        </View>
      </Modal>

      {/* QR CODE REGISTRATION MODAL */}
      <Modal visible={showRegisterModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.registerModal}>
            <Text style={styles.registerTitle}>QR-Code registrieren</Text>
            
            {/* QR Code ID */}
            <Text style={styles.inputLabel}>QR-Code ID *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Gescannte oder manuelle ID"
              placeholderTextColor={COLORS.text.muted}
              value={newQRCode.qr_code_id}
              onChangeText={(text) => setNewQRCode(prev => ({ ...prev, qr_code_id: text }))}
            />
            
            {/* Name */}
            <Text style={styles.inputLabel}>Name (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="z.B. 'Willkommens-Bonus'"
              placeholderTextColor={COLORS.text.muted}
              value={newQRCode.name}
              onChangeText={(text) => setNewQRCode(prev => ({ ...prev, name: text }))}
            />
            
            {/* Feature Type */}
            <Text style={styles.inputLabel}>Belohnungstyp</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featureTypeScroll}>
              {FEATURE_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.featureTypeChip,
                    newQRCode.feature_type === type.id && styles.featureTypeChipActive
                  ]}
                  onPress={() => setNewQRCode(prev => ({ ...prev, feature_type: type.id }))}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={16} 
                    color={newQRCode.feature_type === type.id ? 'white' : COLORS.text.secondary} 
                  />
                  <Text style={[
                    styles.featureTypeText,
                    newQRCode.feature_type === type.id && styles.featureTypeTextActive
                  ]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Amount (für gems/xp) */}
            {(newQRCode.feature_type === 'gems' || newQRCode.feature_type === 'xp') && (
              <>
                <Text style={styles.inputLabel}>Menge</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="50"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="numeric"
                  value={String(newQRCode.feature_value?.amount || '')}
                  onChangeText={(text) => setNewQRCode(prev => ({ 
                    ...prev, 
                    feature_value: { ...prev.feature_value, amount: parseInt(text) || 0 }
                  }))}
                />
              </>
            )}
            
            {/* Single Use Toggle */}
            <TouchableOpacity 
              style={styles.toggleRow}
              onPress={() => setNewQRCode(prev => ({ ...prev, single_use: !prev.single_use }))}
            >
              <View>
                <Text style={styles.toggleLabel}>Einmalige Nutzung</Text>
                <Text style={styles.toggleDesc}>Kann nur von einem User verwendet werden</Text>
              </View>
              <View style={[styles.toggle, newQRCode.single_use && styles.toggleActive]}>
                <View style={[styles.toggleKnob, newQRCode.single_use && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
            
            {/* Buttons */}
            <View style={styles.registerButtons}>
              <TouchableOpacity 
                style={styles.registerCancelBtn}
                onPress={() => {
                  setShowRegisterModal(false);
                  setNewQRCode({
                    qr_code_id: '',
                    name: '',
                    feature_type: 'gems',
                    feature_value: { amount: 50 },
                    single_use: true,
                  });
                }}
              >
                <Text style={styles.registerCancelText}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.registerSubmitBtn,
                  !newQRCode.qr_code_id && styles.registerSubmitBtnDisabled
                ]}
                disabled={!newQRCode.qr_code_id}
                onPress={async () => {
                  const result = await registerQRCode(newQRCode.qr_code_id, newQRCode);
                  if (!result.error) {
                    setShowRegisterModal(false);
                    setNewQRCode({
                      qr_code_id: '',
                      name: '',
                      feature_type: 'gems',
                      feature_value: { amount: 50 },
                      single_use: true,
                    });
                  }
                }}
              >
                <Text style={styles.registerSubmitText}>Registrieren</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    color: COLORS.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  // Profile Card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.gold,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  levelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: COLORS.text.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  playerTitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  xpSection: {},
  xpBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  xpText: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  // Gems Card
  gemsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  gemsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gemsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gemsLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  gemsCount: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  shopButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // Collection Preview
  collectionPreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionTitle: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  previewCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    minHeight: 56,
  },
  previewCard: {
    width: 44,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCards: {
    width: 44,
    height: 56,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: COLORS.text.muted,
    fontSize: 13,
  },
  collectionProgress: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  collectionBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  collectionSubtext: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  // Collection Tab
  collectionTab: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  statGradient: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  // Filter
  filterScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  filterCount: {
    color: COLORS.text.muted,
    fontSize: 12,
  },
  // Cards Grid
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 10,
  },
  cardItem: {
    height: CARD_HEIGHT,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLocked: {
    backgroundColor: COLORS.surfaceAlt,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  powerBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  powerText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  duplicateBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  duplicateText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rarityIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedContent: {
    alignItems: 'center',
    opacity: 0.6,
  },
  levelReq: {
    color: COLORS.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  cardName: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  textLocked: {
    color: COLORS.text.muted,
  },
  // Action Card
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTitle: {
    color: COLORS.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  actionDesc: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  // Card Detail Modal
  cardModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 30,
  },
  cardDetailContainer: {
    alignItems: 'center',
  },
  cardCloseBtn: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  // QR Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    alignItems: 'center',
    padding: 30,
    width: '90%',
    ...SHADOWS.lg,
  },
  qrTitle: {
    color: COLORS.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
  },
  qrCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  qrCloseBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Camera - Improved for all devices
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 40,
  },
  cameraErrorText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: COLORS.text.muted,
    fontSize: 14,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  cameraLoadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 14,
  },
  scannerFooter: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Admin Tab Styles
  adminTab: {
    flex: 1,
  },
  adminHeader: {
    marginBottom: 20,
  },
  adminTitle: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  adminSubtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  adminActionBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  adminActionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  adminActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  adminActionDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  adminStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  adminStatBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  adminStatNumber: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  adminStatLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  emptyStateText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: COLORS.text.muted,
    fontSize: 13,
    marginTop: 4,
  },
  qrCodesList: {
    gap: 10,
  },
  qrCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    ...SHADOWS.sm,
  },
  qrCodeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  qrCodeInfo: {
    flex: 1,
  },
  qrCodeId: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qrCodeName: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  qrCodeMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  qrCodeType: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  qrCodeUses: {
    color: COLORS.text.muted,
    fontSize: 11,
  },
  qrCodeDeleteBtn: {
    padding: 8,
  },
  
  // Register Modal Styles
  registerModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  registerTitle: {
    color: COLORS.text.primary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text.primary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureTypeScroll: {
    marginVertical: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  featureTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureTypeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  featureTypeText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  featureTypeTextActive: {
    color: 'white',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  toggleLabel: {
    color: COLORS.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleDesc: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  registerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  registerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  registerCancelText: {
    color: COLORS.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  registerSubmitBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerSubmitBtnDisabled: {
    opacity: 0.5,
  },
  registerSubmitText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
