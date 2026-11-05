// AI-assisted: see docs/AI_LOG.md #5
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DriverRegistrationProvider } from './src/context/DriverRegistrationContext';
import RegistrationNavigator from './src/navigation/RegistrationNavigator';
import { colors } from './src/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <DriverRegistrationProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="dark" />
          <RegistrationNavigator />
        </NavigationContainer>
      </DriverRegistrationProvider>
    </SafeAreaProvider>
  );
}
