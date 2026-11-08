<<<<<<< HEAD

=======
// AI-assisted: see docs/AI_LOG.md #8
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DriverRegistrationProvider } from './src/context/DriverRegistrationContext.js';
import { ActiveTripProvider } from './src/context/ActiveTripContext.js';
import RootNavigator from './src/navigation/RootNavigator.js';
import { colors } from './src/theme/index.js';

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
        <ActiveTripProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </ActiveTripProvider>
      </DriverRegistrationProvider>
    </SafeAreaProvider>
  );
}
