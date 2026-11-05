import React, { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import FieldMessage, { FieldLabel } from './FieldMessage';
import { formatDisplayDate, parseLocalDate, toIsoDateString } from '../../utils/dateUtils';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export default function DatePickerField({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  minimumDate,
  maximumDate,
  initialPickerDate,
  placeholder = 'DD/MM/AAAA',
  required = false,
}) {
  const [isIosPickerOpen, setIsIosPickerOpen] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState(new Date());

  const pickerDate = parseLocalDate(value) || initialPickerDate || new Date();

  const openPicker = useCallback(() => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerDate,
        mode: 'date',
        minimumDate,
        maximumDate,
        onValueChange: (_event, date) => {
          onChange(toIsoDateString(date));
          onBlur?.();
        },
        onDismiss: () => onBlur?.(),
      });
      return;
    }
    setIosDraftDate(pickerDate);
    setIsIosPickerOpen(true);
  }, [pickerDate, minimumDate, maximumDate, onChange, onBlur]);

  const closeIosPicker = useCallback(
    (shouldSave) => {
      if (shouldSave) onChange(toIsoDateString(iosDraftDate));
      setIsIosPickerOpen(false);
      onBlur?.();
    },
    [iosDraftDate, onChange, onBlur]
  );

  const displayValue = formatDisplayDate(value);

  return (
    <View style={styles.container}>
      <FieldLabel label={label} required={required} />

      <Pressable
        style={[styles.field, error && styles.fieldError]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.value, !displayValue && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      <FieldMessage error={error} helperText={helperText} />

      {Platform.OS === 'ios' ? (
        <Modal
          visible={isIosPickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => closeIosPicker(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => closeIosPicker(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Text style={styles.sheetTitle}>{label}</Text>
                <Pressable onPress={() => closeIosPicker(true)}>
                  <Text style={styles.doneText}>Listo</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraftDate}
                mode="date"
                display="spinner"
                locale="es-CO"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onValueChange={(_event, date) => setIosDraftDate(date)}
              />
            </View>
          </View>
        </Modal>
      ) : null}
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
  },
  placeholder: {
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
    ...shadows.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    ...typography.label,
  },
  cancelText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  doneText: {
    ...typography.label,
    color: colors.primary,
  },
});

