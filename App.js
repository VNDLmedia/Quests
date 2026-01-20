import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { GameProvider, useGame } from './src/game';
import { AchievementToast, CardUnlockOverlay } from './src/components';
import LoginScreen from './src/screens/LoginScreen';
import { COLORS } from './src/theme';

// Main App wrapper with GameProvider
function AppContent() {
  const [isReady, setIsReady] = useState(false);
  
  const gameContext = useGame();
  const isLoading = gameContext?.isLoading ?? true;
  const user = gameContext?.user;
  const newAchievement = gameContext?.newAchievement;
  const clearNewAchievement = gameContext?.clearNewAchievement || (() => {});
  const updateLocation = gameContext?.updateLocation || (() => {});
  const checkAchievements = gameContext?.checkAchievements || (() => {});
  const player = gameContext?.player || { xp: 0, level: 1, totalQuestsCompleted: 0 };

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

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user session, show only the login screen
  if (!user) {
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
  },
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
});
