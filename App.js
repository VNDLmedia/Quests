import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { GameProvider, useGame } from './src/game';
import { AchievementToast, CardUnlockOverlay } from './src/components';
import LoginScreen from './src/screens/LoginScreen';
import LandingScreen from './src/screens/LandingScreen';
import { COLORS } from './src/theme';

// Main App wrapper with GameProvider
function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [hasSeenLanding, setHasSeenLanding] = useState(null);
  
  const gameContext = useGame();
  const isLoading = gameContext?.isLoading ?? true;
  const user = gameContext?.user;
  const newAchievement = gameContext?.newAchievement;
  const clearNewAchievement = gameContext?.clearNewAchievement || (() => {});
  const updateLocation = gameContext?.updateLocation || (() => {});
  const checkAchievements = gameContext?.checkAchievements || (() => {});
  const player = gameContext?.player || { xp: 0, level: 1, totalQuestsCompleted: 0 };

  // Check if user has seen landing page
  useEffect(() => {
    const checkLandingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenLanding');
        setHasSeenLanding(value === 'true');
      } catch (e) {
        // If AsyncStorage fails, default to showing landing
        setHasSeenLanding(false);
      }
    };
    checkLandingStatus();
  }, []);

  // Set Android navigation bar color to match app background
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#FFFFFF');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  // Handle "Start your path" button press
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenLanding', 'true');
      setHasSeenLanding(true);
    } catch (e) {
      // Even if storage fails, proceed to login
      setHasSeenLanding(true);
    }
  };

  // Initialize location tracking (only on native)
  useEffect(() => {
    const initLocation = async () => {
      if (Platform.OS === 'web') {
        setIsReady(true);
        return;
      }
      
      try {
        const { LocationService } = await import('./src/game/services');
        const permissions = await LocationService.requestPermissions();
        if (permissions.granted) {
          await LocationService.startTracking();
          
          LocationService.subscribe((event, data) => {
            if (event === 'locationUpdate') {
              updateLocation(data);
            }
          });
        }
      } catch (e) {
        console.log('Location not available');
      }
      setIsReady(true);
    };

    initLocation();

    return () => {
      if (Platform.OS !== 'web') {
        import('./src/game/services').then(({ LocationService }) => {
          LocationService.cleanup();
        }).catch(() => {});
      }
    };
  }, []);

  // Check achievements on player stats change
  useEffect(() => {
    if (player.xp > 0) {
      checkAchievements(player);
    }
  }, [player.xp, player.level, player.totalQuestsCompleted]);

  // Show loading screen while checking authentication or landing status
  if (isLoading || hasSeenLanding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user session, check if they've seen the landing page
  if (!user) {
    // Show landing page if user hasn't clicked "Start your path" yet
    if (!hasSeenLanding) {
      return (
        <SafeAreaView style={styles.authContainer}>
          <LandingScreen onGetStarted={handleGetStarted} />
        </SafeAreaView>
      );
    }

    // User has seen landing, show login screen
    return (
      <SafeAreaView style={styles.authContainer}>
        <LoginScreen />
      </SafeAreaView>
    );
  }

  // User is authenticated - show the full app
  return (
    <View style={styles.container}>
      <AppNavigator />
      
      {/* Global Achievement Toast */}
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onDismiss={clearNewAchievement}
        />
      )}

      {/* Global Card Unlock Overlay */}
      <CardUnlockOverlay />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
});
