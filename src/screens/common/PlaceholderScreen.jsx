<<<<<<< HEAD
// AI-assisted: see docs/AI_LOG.md #8

=======
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/index.js';

<<<<<<< HEAD
export default function PlaceholderScreen({ title, subtitle }) {
=======
export default function PlaceholderScreen({ title, subtitle, icon }) {
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.badge}>
<<<<<<< HEAD
        <Text style={styles.badgeText}>Fase 5 en desarrollo</Text>
=======
        <Text style={styles.badgeText}>Fase 2 / 5 en desarrollo</Text>
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

