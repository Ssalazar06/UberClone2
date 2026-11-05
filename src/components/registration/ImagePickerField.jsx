import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import FieldMessage, { FieldLabel } from './FieldMessage';
import { colors, radius, spacing, typography } from '../../theme';

const SOURCES = {
  camera: {
    requestPermission: ImagePicker.requestCameraPermissionsAsync,
    launch: ImagePicker.launchCameraAsync,
    deniedMessage: 'Debes permitir el acceso a la cámara para tomar la foto.',
  },
  gallery: {
    requestPermission: ImagePicker.requestMediaLibraryPermissionsAsync,
    launch: ImagePicker.launchImageLibraryAsync,
    deniedMessage: 'Debes permitir el acceso a la galería para elegir la foto.',
  },
};

export default function ImagePickerField({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  aspect = [4, 3],
  shape = 'rectangle',
  required = false,
}) {
  const [pickerError, setPickerError] = useState('');
  const [isPicking, setIsPicking] = useState(false);

  const pickImage = useCallback(
    async (sourceKey) => {
      const source = SOURCES[sourceKey];
      setPickerError('');
      setIsPicking(true);
      try {
        const permission = await source.requestPermission();
        if (!permission.granted) {
          setPickerError(source.deniedMessage);
          return;
        }

        const result = await source.launch({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect,
          quality: 0.6,
        });

        if (!result.canceled && result.assets?.length) {
          onChange(result.assets[0].uri);
        }
      } catch (pickError) {
        console.log('Error picking image:', pickError);
        setPickerError('No fue posible obtener la foto. Intenta de nuevo.');
      } finally {
        setIsPicking(false);
        onBlur?.();
      }
    },
    [aspect, onChange, onBlur]
  );

  const isCircle = shape === 'circle';
  const displayedError = pickerError || error;

  return (
    <View style={styles.container}>
      <FieldLabel label={label} required={required} />

      <View style={[styles.previewWrapper, isCircle && styles.previewWrapperCircle]}>
        <View
          style={[
            styles.preview,
            isCircle ? styles.previewCircle : { aspectRatio: aspect[0] / aspect[1] },
            displayedError && styles.previewError,
          ]}
        >
          {isPicking ? (
            <ActivityIndicator color={colors.primary} />
          ) : value ? (
            <Image source={{ uri: value }} style={styles.image} accessibilityLabel={label} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name={isCircle ? 'person-outline' : 'image-outline'} size={36} color={colors.textMuted} />
              <Text style={styles.emptyText}>Sin foto</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => pickImage('camera')}
          disabled={isPicking}
          accessibilityRole="button"
        >
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Cámara</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => pickImage('gallery')}
          disabled={isPicking}
          accessibilityRole="button"
        >
          <Ionicons name="images-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Galería</Text>
        </Pressable>
      </View>

      <FieldMessage error={displayedError} helperText={helperText} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  previewWrapper: {
    width: '100%',
  },
  previewWrapperCircle: {
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  previewError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  actionText: {
    ...typography.label,
    color: colors.primary,
  },
});

