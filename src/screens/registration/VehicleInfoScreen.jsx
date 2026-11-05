import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import useDriverRegistration from '../../hooks/useDriverRegistration';
import { VEHICLE_CATEGORY_OPTIONS, VEHICLE_COLOR_OPTIONS } from '../../data/registrationOptions';
import { VEHICLE_INFO_FIELDS } from '../../data/registrationData';
import FormInput from '../../components/registration/FormInput';
import FormSelect from '../../components/registration/FormSelect';
import ImagePickerField from '../../components/registration/ImagePickerField';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export default function VehicleInfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { vehicleInfo, vehicleInfoErrors, isVehicleInfoValid, touchedFields, updateVehicleInfo, touchField, touchFields } = useDriverRegistration();

  const getFieldError = (field) => (touchedFields[field] ? vehicleInfoErrors[field] : '');

  const handleChangeField = (field, value) => {
    updateVehicleInfo(field, value);
    touchField(field);
  };

  const handleCategoryChange = (categoryValue) => {
    updateVehicleInfo('category', categoryValue);
    touchField('category');
    if (vehicleInfo.passengerCapacity) {
      touchField('passengerCapacity');
    }
  };

  const handleNextTab = () => {
    touchFields(VEHICLE_INFO_FIELDS);
    if (isVehicleInfoValid) {
      navigation.navigate('DocumentsInfo');
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Ionicons name="car-sport-outline" size={18} color={colors.primary} />
            <Text style={styles.stepBadgeText}>Paso 2 de 3</Text>
          </View>
          <Text style={styles.title}>Información del vehículo</Text>
          <Text style={styles.subtitle}>
            Registra las características del vehículo con el que realizarás los viajes.
          </Text>
        </View>

        {/* Specifications */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos técnicos</Text>

          <FormSelect
            label="Categoría del servicio"
            required
            placeholder="Selecciona la categoría"
            options={VEHICLE_CATEGORY_OPTIONS}
            value={vehicleInfo.category}
            onChange={handleCategoryChange}
            onBlur={() => touchField('category')}
            error={getFieldError('category')}
            helperText="Económico (estándar), XL (mínimo 6 pasajeros) o Premium."
          />

          <FormInput
            label="Placa del vehículo"
            required
            placeholder="ABC123"
            value={vehicleInfo.licensePlate}
            onChangeText={(text) =>
              handleChangeField('licensePlate', text.toUpperCase().replace(/\s+/g, ''))
            }
            onBlur={() => touchField('licensePlate')}
            error={getFieldError('licensePlate')}
            helperText="Formato colombiano: 3 letras seguidas de 3 números (ej. ABC123)."
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />

          <FormInput
            label="Marca"
            required
            placeholder="Ej. Chevrolet, Renault, Toyota"
            value={vehicleInfo.brand}
            onChangeText={(text) => handleChangeField('brand', text)}
            onBlur={() => touchField('brand')}
            error={getFieldError('brand')}
            helperText="Máximo 30 caracteres."
            maxLength={30}
            autoCapitalize="words"
          />

          <FormInput
            label="Modelo / Línea"
            required
            placeholder="Ej. Onix, Duster, Corolla"
            value={vehicleInfo.model}
            onChangeText={(text) => handleChangeField('model', text)}
            onBlur={() => touchField('model')}
            error={getFieldError('model')}
            helperText="Máximo 30 caracteres."
            maxLength={30}
            autoCapitalize="words"
          />

          <FormInput
            label="Año (Modelo)"
            required
            placeholder={`Ej. ${currentYear}`}
            value={vehicleInfo.year}
            onChangeText={(text) => handleChangeField('year', text)}
            onBlur={() => touchField('year')}
            error={getFieldError('year')}
            helperText={`4 dígitos numéricos, no mayor a ${currentYear}.`}
            keyboardType="number-pad"
            maxLength={4}
          />

          <FormSelect
            label="Color"
            required
            placeholder="Selecciona el color del vehículo"
            options={VEHICLE_COLOR_OPTIONS}
            value={vehicleInfo.color}
            onChange={(val) => handleChangeField('color', val)}
            onBlur={() => touchField('color')}
            error={getFieldError('color')}
          />

          <FormInput
            label="Capacidad de pasajeros"
            required
            placeholder={vehicleInfo.category === 'xl' ? 'Mínimo 6' : 'Ej. 4'}
            value={vehicleInfo.passengerCapacity}
            onChangeText={(text) => handleChangeField('passengerCapacity', text)}
            onBlur={() => touchField('passengerCapacity')}
            error={getFieldError('passengerCapacity')}
            helperText={
              vehicleInfo.category === 'xl'
                ? 'Para categoría XL se exige una capacidad mínima de 6 pasajeros.'
                : 'Cantidad de pasajeros disponibles sin contar al conductor.'
            }
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        {/* Vehicle Photo */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fotografía del vehículo</Text>
          <ImagePickerField
            label="Foto exterior con placa visible"
            required
            shape="rectangle"
            aspect={[4, 3]}
            value={vehicleInfo.vehiclePhotoUri}
            onChange={(uri) => handleChangeField('vehiclePhotoUri', uri)}
            onBlur={() => touchField('vehiclePhotoUri')}
            error={getFieldError('vehiclePhotoUri')}
            helperText="Asegúrate de que el vehículo completo y la placa se lean con claridad."
          />
        </View>

        {/* Next Tab */}
        <Pressable
          style={[styles.nextButton, isVehicleInfoValid && styles.nextButtonValid]}
          onPress={handleNextTab}
        >
          <Text style={styles.nextButtonText}>
            {isVehicleInfoValid
              ? 'Continuar a documentos y pagos'
              : 'Revisar campos del vehículo'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  stepBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  nextButtonValid: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
});

