import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

import MapScreen from '../screens/VibeMapScreen';
import AdventuresScreen from '../screens/TrendingScreen';
import ClubPassScreen from '../screens/VibePassScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.text.muted,
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color }) => {
            let iconName;
            if (route.name === 'Map') iconName = focused ? 'compass' : 'compass-outline';
            else if (route.name === 'Adventures') iconName = focused ? 'layers' : 'layers-outline';
            else if (route.name === 'Club') iconName = focused ? 'wallet' : 'wallet-outline';
            
            return (
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={26} color={color} />
                {focused && <View style={styles.activeDot} />}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Adventures" component={AdventuresScreen} />
        <Tab.Screen name="Club" component={ClubPassScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceAlt,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  }
});

export default AppNavigator;
