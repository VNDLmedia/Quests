import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { GameProvider, useGame } from './src/game';
import { AchievementToast } from './src/components';

// Main App wrapper with GameProvider
function AppContent() {
  const [isReady, setIsReady] = useState(false);
  
  const gameContext = useGame();
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
    </View>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
