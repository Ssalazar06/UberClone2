
import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FieldMessage, { FieldLabel } from './FieldMessage';
import { colors, radius, shadows, spacing, typography } from '../../theme';

/**
 * Reusable dropdown (modal list) with error message below the field.
 * @param {{ label: string, value: string, options: {label: string, value: string}[],
 *   onChange: (value: string) => void, onBlur?: () => void, error?: string,
 *   placeholder?: string, required?: boolean }} props
 */
export default function FormSelect({
  label,
  value,
  options,
  onChange,
  onBlur,
  error,
  helperText,
  placeholder = 'Selecciona una opción',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const close = useCallback(() => {
    setIsOpen(false);
    onBlur?.();
  }, [onBlur]);

  const handleSelect = useCallback(
    (option) => {
      onChange(option.value);
      close();
    },
    [onChange, close]
  );

  return (
    <View style={styles.container}>
      <FieldLabel label={label} required={required} />

      <Pressable
        style={[styles.field, error && styles.fieldError]}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.value, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>

      <FieldMessage error={error} helperText={helperText} />

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={() => { }}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
            <Pressable style={styles.cancelButton} onPress={close}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  value: {
    ...typography.body,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    maxHeight: '70%',
    ...shadows.md,
  },
  sheetTitle: {
    ...typography.subtitle,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    ...typography.body,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  cancelText: {
    ...typography.label,
    color: colors.textSecondary,
  },
});

