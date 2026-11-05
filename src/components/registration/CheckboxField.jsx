import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FieldMessage from './FieldMessage';
import { colors, radius, spacing, typography } from '../../theme';

export default function CheckboxField({
  label,
  description,
  checked = false,
  onChange,
  error,
  required = false,
}) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.row,
          checked && styles.rowChecked,
          error && styles.rowError,
        ]}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
      >
        <View style={[styles.box, checked && styles.boxChecked, error && !checked && styles.boxError]}>
          {checked ? (
            <Ionicons name="checkmark" size={16} color={colors.primaryText} />
          ) : null}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </Pressable>

      <FieldMessage error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rowError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  boxError: {
    borderColor: colors.error,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.label,
  },
  required: {
    color: colors.error,
  },
  description: {
    ...typography.caption,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});

