import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import useDriverRegistration from '../../hooks/useDriverRegistration';
import useKeyboardPadding from '../../hooks/useKeyboardPadding';
import { GENDER_OPTIONS, MIN_DRIVER_AGE } from '../../data/registrationOptions';
import { PERSONAL_INFO_FIELDS } from '../../data/registrationData';
import { subtractYears } from '../../utils/dateUtils';
import FormInput from '../../components/registration/FormInput';
import FormSelect from '../../components/registration/FormSelect';
import DatePickerField from '../../components/registration/DatePickerField';
import ImagePickerField from '../../components/registration/ImagePickerField';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export default function PersonalInfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { bottomPadding } = useKeyboardPadding(spacing.xxl);
  const { personalInfo, personalInfoErrors, isPersonalInfoValid, touchedFields, updatePersonalInfo, touchField, touchFields, } = useDriverRegistration();

  const getFieldError = (field) => (touchedFields[field] ? personalInfoErrors[field] : '');

  const handleChangeField = (field, value) => {
    updatePersonalInfo(field, value);
    touchField(field);
  };

  const handleNextTab = () => {
    touchFields(PERSONAL_INFO_FIELDS);
    if (isPersonalInfoValid) {
      navigation.navigate('VehicleInfo');
    }
  };

  // Maximum date
  const today = new Date();
  const defaultPickerDate = subtractYears(today, MIN_DRIVER_AGE);
  const minimumBirthDate = subtractYears(today, 100);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.stepBadgeText}>Paso 1 de 3</Text>
          </View>
          <Text style={styles.title}>Datos personales</Text>
          <Text style={styles.subtitle}>
            Ingresa tu información personal tal como aparece en tu documento de identidad.
          </Text>
        </View>

        {/* Profile Photo */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Foto de perfil</Text>
          <ImagePickerField
            label="Fotografía del rostro"
            required
            shape="circle"
            aspect={[1, 1]}
            value={personalInfo.profilePhotoUri}
            onChange={(uri) => handleChangeField('profilePhotoUri', uri)}
            onBlur={() => touchField('profilePhotoUri')}
            error={getFieldError('profilePhotoUri')}
            helperText="Toma una foto clara de frente, sin gafas oscuras ni gorra."
          />
        </View>

        {/* Personal Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identificación y contacto</Text>

          <FormInput
            label="Nombre completo"
            required
            placeholder="Ej. Santiago Salazar Atehortúa"
            value={personalInfo.fullName}
            onChangeText={(text) => handleChangeField('fullName', text)}
            onBlur={() => touchField('fullName')}
            error={getFieldError('fullName')}
            helperText="Máximo 50 caracteres. Solo letras y espacios (se permiten tildes)."
            maxLength={50}
            autoCapitalize="words"
          />

          <FormInput
            label="Documento de identidad"
            required
            placeholder="Ej. 1020304050"
            value={personalInfo.documentId}
            onChangeText={(text) => handleChangeField('documentId', text)}
            onBlur={() => touchField('documentId')}
            error={getFieldError('documentId')}
            helperText="Solo números del 0 al 9 (entre 6 y 10 dígitos)."
            keyboardType="number-pad"
            maxLength={10}
          />

          <FormInput
            label="Número de celular"
            required
            placeholder="Ej. 3001234567"
            value={personalInfo.phoneNumber}
            onChangeText={(text) => handleChangeField('phoneNumber', text)}
            onBlur={() => touchField('phoneNumber')}
            error={getFieldError('phoneNumber')}
            helperText="Solo números del 0 al 9 (exactamente 10 dígitos)."
            keyboardType="phone-pad"
            maxLength={10}
          />

          <DatePickerField
            label="Fecha de nacimiento"
            required
            value={personalInfo.birthDate}
            onChange={(dateStr) => handleChangeField('birthDate', dateStr)}
            onBlur={() => touchField('birthDate')}
            error={getFieldError('birthDate')}
            helperText="Debes ser mayor de 18 años para registrarte como conductor."
            minimumDate={minimumBirthDate}
            maximumDate={today}
            initialPickerDate={defaultPickerDate}
          />

          <FormSelect
            label="Género"
            required
            placeholder="Selecciona tu género"
            options={GENDER_OPTIONS}
            value={personalInfo.gender}
            onChange={(val) => handleChangeField('gender', val)}
            onBlur={() => touchField('gender')}
            error={getFieldError('gender')}
          />

          <FormInput
            label="Correo electrónico"
            required
            placeholder="conductor@correo.com"
            value={personalInfo.email}
            onChangeText={(text) => handleChangeField('email', text)}
            onBlur={() => touchField('email')}
            error={getFieldError('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Next */}
        <Pressable
          style={[styles.nextButton, isPersonalInfoValid && styles.nextButtonValid]}
          onPress={handleNextTab}
        >
          <Text style={styles.nextButtonText}>
            {isPersonalInfoValid
              ? 'Continuar a datos del vehículo'
              : 'Revisar campos de esta pestaña'}
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

