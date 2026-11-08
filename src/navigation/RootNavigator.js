import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import useDriverRegistration from '../hooks/useDriverRegistration.js';
import RegistrationNavigator from './RegistrationNavigator.js';
import MainDrawerNavigator from './MainDrawerNavigator.js';
import { colors, spacing, typography } from '../theme/index.js';

export default function RootNavigator() {
  const { registrationStatus, isLoadingSession } = useDriverRegistration();

  if (isLoadingSession) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando estado del conductor...</Text>
      </View>
    );
  }

  // If approved in Firestore, show the full Main Drawer application.
  // Otherwise (draft, pending_approval, rejected or empty), show Registration Navigator.
  if (registrationStatus === 'approved') {
    return <MainDrawerNavigator />;
  }

  return <RegistrationNavigator />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

