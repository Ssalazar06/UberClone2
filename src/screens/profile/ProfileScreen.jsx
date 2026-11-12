import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useDriverRegistration from '../../hooks/useDriverRegistration.js';
import useKeyboardPadding from '../../hooks/useKeyboardPadding.js';
import {
  GENDER_OPTIONS,
  MIN_DRIVER_AGE,
  REGISTRATION_STATUS_LABELS,
  VEHICLE_CATEGORY_OPTIONS,
  VEHICLE_COLOR_OPTIONS,
} from '../../data/registrationOptions.js';
import { addYears, getTomorrowDate, subtractYears } from '../../utils/dateUtils.js';
import FormInput from '../../components/registration/FormInput.jsx';
import FormSelect from '../../components/registration/FormSelect.jsx';
import DatePickerField from '../../components/registration/DatePickerField.jsx';
import ImagePickerField from '../../components/registration/ImagePickerField.jsx';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

const SECTIONS = [
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'vehicle', label: 'Vehículo', icon: 'car-sport-outline' },
  { key: 'documents', label: 'Documentos', icon: 'document-text-outline' },
];

export default function ProfileScreen() {
  const { bottomPadding } = useKeyboardPadding(spacing.xxl);
  const {
    personalInfo,
    vehicleInfo,
    documentsInfo,
    personalInfoErrors,
    vehicleInfoErrors,
    documentsInfoErrors,
    requiresMechanicalInspection,
    touchedFields,
    driverId,
    registrationStatus,
    isSaving,
    saveError,
    updatePersonalInfo,
    updateVehicleInfo,
    updateDocumentsInfo,
    touchField,
    updateApprovedProfile,
    resetRegistration,
  } = useDriverRegistration();

  const [activeSection, setActiveSection] = useState('personal');
  const [statusMessage, setStatusMessage] = useState('');

  const getPersonalError = (field) => (touchedFields[field] ? personalInfoErrors[field] : '');
  const getVehicleError = (field) => (touchedFields[field] ? vehicleInfoErrors[field] : '');
  const getDocumentError = (field) => (touchedFields[field] ? documentsInfoErrors[field] : '');

  const handlePersonalChange = (field, value) => {
    setStatusMessage('');
    updatePersonalInfo(field, value);
    touchField(field);
  };

  const handleVehicleChange = (field, value) => {
    setStatusMessage('');
    updateVehicleInfo(field, value);
    touchField(field);
  };

  const handleDocumentChange = (field, value) => {
    setStatusMessage('');
    updateDocumentsInfo(field, value);
    touchField(field);
  };

  const handleSaveProfile = async () => {
    setStatusMessage('');
    const result = await updateApprovedProfile();
    if (result?.ok) {
      setStatusMessage('Cambios guardados correctamente en tu perfil.');
    }
  };

  const today = new Date();
  const defaultBirthDate = subtractYears(today, MIN_DRIVER_AGE);
  const minBirthDate = subtractYears(today, 100);
  const tomorrow = getTomorrowDate();
  const maxExpiryDate = addYears(tomorrow, 15);
  const currentYear = today.getFullYear();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.driverName}>
              {personalInfo.fullName || 'Conductor'}
            </Text>
            <Text style={styles.driverMeta}>
              ID: {driverId || personalInfo.documentId || 'N/A'} ·{' '}
              {vehicleInfo.brand} {vehicleInfo.model} ({vehicleInfo.licensePlate})
            </Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>
                {REGISTRATION_STATUS_LABELS[registrationStatus] || 'Aprobado'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionTabs}>
          {SECTIONS.map((sec) => {
            const active = activeSection === sec.key;
            return (
              <Pressable
                key={sec.key}
                style={[styles.sectionTab, active && styles.sectionTabActive]}
                onPress={() => setActiveSection(sec.key)}
              >
                <Ionicons
                  name={sec.icon}
                  size={16}
                  color={active ? colors.primaryText : colors.textSecondary}
                />
                <Text
                  style={[styles.sectionTabText, active && styles.sectionTabTextActive]}
                >
                  {sec.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeSection === 'personal' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos personales</Text>

            <ImagePickerField
              label="Foto de perfil"
              required
              shape="circle"
              aspect={[1, 1]}
              value={personalInfo.profilePhotoUri}
              onChange={(uri) => handlePersonalChange('profilePhotoUri', uri)}
              onBlur={() => touchField('profilePhotoUri')}
              error={getPersonalError('profilePhotoUri')}
            />

            <FormInput
              label="Nombre completo"
              required
              value={personalInfo.fullName}
              onChangeText={(val) => handlePersonalChange('fullName', val)}
              onBlur={() => touchField('fullName')}
              error={getPersonalError('fullName')}
              maxLength={50}
              autoCapitalize="words"
            />

            <FormInput
              label="Documento de identidad"
              required
              value={personalInfo.documentId}
              editable={false}
              helperText="El documento de identidad es tu identificador único de conductor."
            />

            <FormInput
              label="Número de celular"
              required
              value={personalInfo.phoneNumber}
              onChangeText={(val) => handlePersonalChange('phoneNumber', val)}
              onBlur={() => touchField('phoneNumber')}
              error={getPersonalError('phoneNumber')}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <DatePickerField
              label="Fecha de nacimiento"
              required
              value={personalInfo.birthDate}
              onChange={(val) => handlePersonalChange('birthDate', val)}
              onBlur={() => touchField('birthDate')}
              error={getPersonalError('birthDate')}
              minimumDate={minBirthDate}
              maximumDate={today}
              initialPickerDate={defaultBirthDate}
            />

            <FormSelect
              label="Género"
              required
              options={GENDER_OPTIONS}
              value={personalInfo.gender}
              onChange={(val) => handlePersonalChange('gender', val)}
              onBlur={() => touchField('gender')}
              error={getPersonalError('gender')}
            />

            <FormInput
              label="Correo electrónico"
              required
              value={personalInfo.email}
              onChangeText={(val) => handlePersonalChange('email', val)}
              onBlur={() => touchField('email')}
              error={getPersonalError('email')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        ) : null}

        {activeSection === 'vehicle' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vehículo registrado</Text>

            <FormSelect
              label="Categoría del servicio"
              required
              options={VEHICLE_CATEGORY_OPTIONS}
              value={vehicleInfo.category}
              onChange={(val) => handleVehicleChange('category', val)}
              onBlur={() => touchField('category')}
              error={getVehicleError('category')}
            />

            <FormInput
              label="Placa del vehículo"
              required
              value={vehicleInfo.licensePlate}
              onChangeText={(val) =>
                handleVehicleChange('licensePlate', val.toUpperCase().replace(/\s+/g, ''))
              }
              onBlur={() => touchField('licensePlate')}
              error={getVehicleError('licensePlate')}
              autoCapitalize="characters"
              maxLength={6}
            />

            <FormInput
              label="Marca"
              required
              value={vehicleInfo.brand}
              onChangeText={(val) => handleVehicleChange('brand', val)}
              onBlur={() => touchField('brand')}
              error={getVehicleError('brand')}
              maxLength={30}
            />

            <FormInput
              label="Modelo / Línea"
              required
              value={vehicleInfo.model}
              onChangeText={(val) => handleVehicleChange('model', val)}
              onBlur={() => touchField('model')}
              error={getVehicleError('model')}
              maxLength={30}
            />

            <FormInput
              label="Año (Modelo)"
              required
              value={vehicleInfo.year}
              onChangeText={(val) => handleVehicleChange('year', val)}
              onBlur={() => touchField('year')}
              error={getVehicleError('year')}
              keyboardType="number-pad"
              maxLength={4}
              helperText={`Entre 1990 y ${currentYear}.`}
            />

            <FormSelect
              label="Color"
              required
              options={VEHICLE_COLOR_OPTIONS}
              value={vehicleInfo.color}
              onChange={(val) => handleVehicleChange('color', val)}
              onBlur={() => touchField('color')}
              error={getVehicleError('color')}
            />

            <FormInput
              label="Capacidad de pasajeros"
              required
              value={vehicleInfo.passengerCapacity}
              onChangeText={(val) => handleVehicleChange('passengerCapacity', val)}
              onBlur={() => touchField('passengerCapacity')}
              error={getVehicleError('passengerCapacity')}
              keyboardType="number-pad"
              maxLength={2}
            />

            <ImagePickerField
              label="Fotografía del vehículo"
              required
              shape="rectangle"
              aspect={[4, 3]}
              value={vehicleInfo.vehiclePhotoUri}
              onChange={(uri) => handleVehicleChange('vehiclePhotoUri', uri)}
              onBlur={() => touchField('vehiclePhotoUri')}
              error={getVehicleError('vehiclePhotoUri')}
            />
          </View>
        ) : null}

        {activeSection === 'documents' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Documentos y cuenta de pagos</Text>

            <FormInput
              label="Número de licencia de conducción"
              required
              value={documentsInfo.driverLicenseNumber}
              onChangeText={(val) => handleDocumentChange('driverLicenseNumber', val)}
              onBlur={() => touchField('driverLicenseNumber')}
              error={getDocumentError('driverLicenseNumber')}
              keyboardType="number-pad"
              maxLength={12}
            />

            <ImagePickerField
              label="Foto de la licencia"
              required
              shape="rectangle"
              aspect={[4, 3]}
              value={documentsInfo.driverLicensePhotoUri}
              onChange={(uri) => handleDocumentChange('driverLicensePhotoUri', uri)}
              onBlur={() => touchField('driverLicensePhotoUri')}
              error={getDocumentError('driverLicensePhotoUri')}
            />

            <DatePickerField
              label="Vencimiento de la licencia"
              required
              value={documentsInfo.driverLicenseExpiryDate}
              onChange={(val) => handleDocumentChange('driverLicenseExpiryDate', val)}
              onBlur={() => touchField('driverLicenseExpiryDate')}
              error={getDocumentError('driverLicenseExpiryDate')}
              minimumDate={tomorrow}
              maximumDate={maxExpiryDate}
              initialPickerDate={tomorrow}
            />

            <ImagePickerField
              label="Foto del SOAT"
              required
              shape="rectangle"
              aspect={[4, 3]}
              value={documentsInfo.soatPhotoUri}
              onChange={(uri) => handleDocumentChange('soatPhotoUri', uri)}
              onBlur={() => touchField('soatPhotoUri')}
              error={getDocumentError('soatPhotoUri')}
            />

            <DatePickerField
              label="Vencimiento del SOAT"
              required
              value={documentsInfo.soatExpiryDate}
              onChange={(val) => handleDocumentChange('soatExpiryDate', val)}
              onBlur={() => touchField('soatExpiryDate')}
              error={getDocumentError('soatExpiryDate')}
              minimumDate={tomorrow}
              maximumDate={maxExpiryDate}
              initialPickerDate={tomorrow}
            />

            {requiresMechanicalInspection ? (
              <>
                <ImagePickerField
                  label="Foto técnico-mecánica"
                  required
                  shape="rectangle"
                  aspect={[4, 3]}
                  value={documentsInfo.mechanicalInspectionPhotoUri}
                  onChange={(uri) =>
                    handleDocumentChange('mechanicalInspectionPhotoUri', uri)
                  }
                  onBlur={() => touchField('mechanicalInspectionPhotoUri')}
                  error={getDocumentError('mechanicalInspectionPhotoUri')}
                />

                <DatePickerField
                  label="Vencimiento técnico-mecánica"
                  required
                  value={documentsInfo.mechanicalInspectionExpiryDate}
                  onChange={(val) =>
                    handleDocumentChange('mechanicalInspectionExpiryDate', val)
                  }
                  onBlur={() => touchField('mechanicalInspectionExpiryDate')}
                  error={getDocumentError('mechanicalInspectionExpiryDate')}
                  minimumDate={tomorrow}
                  maximumDate={maxExpiryDate}
                  initialPickerDate={tomorrow}
                />
              </>
            ) : null}

            <FormInput
              label="Correo de Mercado Pago"
              required
              value={documentsInfo.mercadoPagoEmail}
              onChangeText={(val) => handleDocumentChange('mercadoPagoEmail', val)}
              onBlur={() => touchField('mercadoPagoEmail')}
              error={getDocumentError('mercadoPagoEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        ) : null}

        {saveError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}

        {statusMessage ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={styles.successText}>{statusMessage}</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={colors.primaryText} />
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.logoutButton}
          onPress={resetRegistration}
          disabled={isSaving}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
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
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    ...typography.subtitle,
    color: colors.text,
  },
  driverMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.success,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  sectionTabActive: {
    backgroundColor: colors.primary,
  },
  sectionTabText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  sectionTabTextActive: {
    color: colors.primaryText,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.error,
  },
});

