import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import FieldMessage, { FieldLabel } from './FieldMessage';
import { colors, radius, spacing, typography } from '../../theme';

export default function FormInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  helperText,
  required = false,
  editable = true,
  ...inputProps
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        editable={editable}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...inputProps}
      />
      <FieldMessage error={error} helperText={helperText} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    ...typography.body,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  inputDisabled: {
    backgroundColor: colors.disabled,
    color: colors.disabledText,
  },
});

