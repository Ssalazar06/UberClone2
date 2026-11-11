
import React from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import useDriverRegistration from '../../hooks/useDriverRegistration';
import useKeyboardPadding from '../../hooks/useKeyboardPadding';
import { PLATFORM_COMMISSION_PERCENT } from '../../config/pricing';
import { MECHANICAL_INSPECTION_MIN_VEHICLE_AGE } from '../../data/registrationOptions';
import { DOCUMENTS_INFO_FIELDS } from '../../data/registrationData';
import { addYears, getTomorrowDate } from '../../utils/dateUtils';
import FormInput from '../../components/registration/FormInput';
import DatePickerField from '../../components/registration/DatePickerField';
import ImagePickerField from '../../components/registration/ImagePickerField';
import CheckboxField from '../../components/registration/CheckboxField';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export default function DocumentsInfoScreen() {
  const insets = useSafeAreaInsets();
  const { bottomPadding } = useKeyboardPadding(spacing.xxl);
  const { personalInfo, vehicleInfo, documentsInfo, documentsInfoErrors, isPersonalInfoValid, isVehicleInfoValid, isDocumentsInfoValid, requiresMechanicalInspection,
    touchedFields, updateDocumentsInfo, touchField, touchFields, canSaveDraft, savingAction, saveError, lastSavedAt, driverId,
    saveDraft, resetRegistration } = useDriverRegistration();

  const getFieldError = (field) => (touchedFields[field] ? documentsInfoErrors[field] : '');

  const handleChangeField = (field, value) => {
    updateDocumentsInfo(field, value);
    touchField(field);
  };

  const handleValidateAllDocuments = () => {
    touchFields(DOCUMENTS_INFO_FIELDS);
  };

  const tomorrow = getTomorrowDate();
  const maxExpiryDate = addYears(tomorrow, 15);
  const isSavingDraft = savingAction === 'draft';

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
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.stepBadgeText}>Paso 3 de 3</Text>
          </View>
          <Text style={styles.title}>Documentos y pagos</Text>
          <Text style={styles.subtitle}>
            Adjunta tus documentos legales vigentes y configura tu cuenta para recibir ganancias.
          </Text>
        </View>

        {/* License */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Licencia de conducción</Text>
          </View>

          <FormInput
            label="Número de licencia"
            required
            placeholder="Ej. 1020304050"
            value={documentsInfo.driverLicenseNumber}
            onChangeText={(text) => handleChangeField('driverLicenseNumber', text)}
            onBlur={() => touchField('driverLicenseNumber')}
            error={getFieldError('driverLicenseNumber')}
            helperText="Solo números del 0 al 9 (entre 6 y 12 dígitos)."
            keyboardType="number-pad"
            maxLength={12}
          />

          {personalInfo.documentId &&
            documentsInfo.driverLicenseNumber !== personalInfo.documentId ? (
            <Pressable
              style={styles.quickFillButton}
              onPress={() =>
                handleChangeField('driverLicenseNumber', personalInfo.documentId)
              }
            >
              <Ionicons name="copy-outline" size={14} color={colors.primary} />
              <Text style={styles.quickFillText}>
                Usar mi número de documento ({personalInfo.documentId})
              </Text>
            </Pressable>
          ) : null}

          <ImagePickerField
            label="Foto de la licencia de conducción"
            required
            shape="rectangle"
            aspect={[4, 3]}
            value={documentsInfo.driverLicensePhotoUri}
            onChange={(uri) => handleChangeField('driverLicensePhotoUri', uri)}
            onBlur={() => touchField('driverLicensePhotoUri')}
            error={getFieldError('driverLicensePhotoUri')}
            helperText="Asegúrate de que el número y la fecha de vencimiento sean legibles."
          />

          <DatePickerField
            label="Fecha de vencimiento de la licencia"
            required
            value={documentsInfo.driverLicenseExpiryDate}
            onChange={(dateStr) => handleChangeField('driverLicenseExpiryDate', dateStr)}
            onBlur={() => touchField('driverLicenseExpiryDate')}
            error={getFieldError('driverLicenseExpiryDate')}
            helperText="Debe ser una fecha posterior al día de hoy."
            minimumDate={tomorrow}
            maximumDate={maxExpiryDate}
            initialPickerDate={tomorrow}
          />
        </View>

        {/* SOAT */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>SOAT (Seguro Obligatorio)</Text>
          </View>

          <ImagePickerField
            label="Foto de la póliza SOAT"
            required
            shape="rectangle"
            aspect={[4, 3]}
            value={documentsInfo.soatPhotoUri}
            onChange={(uri) => handleChangeField('soatPhotoUri', uri)}
            onBlur={() => touchField('soatPhotoUri')}
            error={getFieldError('soatPhotoUri')}
            helperText="Adjunta una imagen clara del SOAT vigente del vehículo."
          />

          <DatePickerField
            label="Fecha de vencimiento del SOAT"
            required
            value={documentsInfo.soatExpiryDate}
            onChange={(dateStr) => handleChangeField('soatExpiryDate', dateStr)}
            onBlur={() => touchField('soatExpiryDate')}
            error={getFieldError('soatExpiryDate')}
            helperText="Debe ser una fecha posterior al día de hoy."
            minimumDate={tomorrow}
            maximumDate={maxExpiryDate}
            initialPickerDate={tomorrow}
          />
        </View>

        {/* Mechanical Inspection */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="build-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Revisión técnico-mecánica</Text>
          </View>

          <View
            style={[
              styles.ruleBanner,
              requiresMechanicalInspection
                ? styles.ruleBannerRequired
                : styles.ruleBannerExempt,
            ]}
          >
            <Ionicons
              name={
                requiresMechanicalInspection
                  ? 'information-circle-outline'
                  : 'checkmark-circle-outline'
              }
              size={18}
              color={requiresMechanicalInspection ? colors.warning : colors.success}
            />
            <Text
              style={[
                styles.ruleBannerText,
                requiresMechanicalInspection
                  ? styles.ruleBannerTextRequired
                  : styles.ruleBannerTextExempt,
              ]}
            >
              {requiresMechanicalInspection
                ? vehicleInfo.year
                  ? `Obligatoria para tu vehículo modelo ${vehicleInfo.year} (${MECHANICAL_INSPECTION_MIN_VEHICLE_AGE} o más años de antigüedad).`
                  : `Obligatoria para vehículos con ${MECHANICAL_INSPECTION_MIN_VEHICLE_AGE} o más años de antigüedad.`
                : `Tu vehículo modelo ${vehicleInfo.year} tiene menos de ${MECHANICAL_INSPECTION_MIN_VEHICLE_AGE} años y está exento. Puedes adjuntarla opcionalmente.`}
            </Text>
          </View>

          <ImagePickerField
            label="Foto del certificado técnico-mecánico"
            required={requiresMechanicalInspection}
            shape="rectangle"
            aspect={[4, 3]}
            value={documentsInfo.mechanicalInspectionPhotoUri}
            onChange={(uri) => handleChangeField('mechanicalInspectionPhotoUri', uri)}
            onBlur={() => touchField('mechanicalInspectionPhotoUri')}
            error={getFieldError('mechanicalInspectionPhotoUri')}
            helperText={
              requiresMechanicalInspection
                ? 'Certificado RUNT de revisión técnico-mecánica y de emisiones vigente.'
                : 'Opcional para vehículos de modelo reciente.'
            }
          />

          <DatePickerField
            label="Fecha de vencimiento técnico-mecánica"
            required={requiresMechanicalInspection}
            value={documentsInfo.mechanicalInspectionExpiryDate}
            onChange={(dateStr) =>
              handleChangeField('mechanicalInspectionExpiryDate', dateStr)
            }
            onBlur={() => touchField('mechanicalInspectionExpiryDate')}
            error={getFieldError('mechanicalInspectionExpiryDate')}
            helperText={
              requiresMechanicalInspection
                ? 'Debe ser una fecha posterior al día de hoy.'
                : 'Si la ingresas, debe ser posterior a hoy.'
            }
            minimumDate={tomorrow}
            maximumDate={maxExpiryDate}
            initialPickerDate={tomorrow}
          />
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Cuenta de pagos y términos</Text>
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
            <Text style={styles.securityNoteText}>
              Por seguridad, la aplicación nunca solicita ni almacena números de tarjeta ni
              claves bancarias. Tus ganancias se dispersan a través de Mercado Pago.
            </Text>
          </View>

          <FormInput
            label="Correo de la cuenta de Mercado Pago"
            required
            placeholder="pagos.conductor@correo.com"
            value={documentsInfo.mercadoPagoEmail}
            onChangeText={(text) => handleChangeField('mercadoPagoEmail', text)}
            onBlur={() => touchField('mercadoPagoEmail')}
            error={getFieldError('mercadoPagoEmail')}
            helperText="Correo electrónico asociado a tu cuenta de Mercado Pago donde recibirás tus pagos."
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {personalInfo.email &&
            documentsInfo.mercadoPagoEmail !== personalInfo.email ? (
            <Pressable
              style={styles.quickFillButton}
              onPress={() => handleChangeField('mercadoPagoEmail', personalInfo.email)}
            >
              <Ionicons name="copy-outline" size={14} color={colors.primary} />
              <Text style={styles.quickFillText}>
                Usar mi correo personal ({personalInfo.email})
              </Text>
            </Pressable>
          ) : null}

          <CheckboxField
            label={`Acepto los términos y condiciones y la comisión del ${PLATFORM_COMMISSION_PERCENT} %`}
            required
            description={`Entiendo que la plataforma retiene una comisión del ${PLATFORM_COMMISSION_PERCENT} % sobre la tarifa de cada viaje y que el 100 % de las propinas son para el conductor.`}
            checked={Boolean(documentsInfo.termsAccepted)}
            onChange={(checked) => handleChangeField('termsAccepted', checked)}
            error={getFieldError('termsAccepted')}
          />
        </View>

        {/* Status Checklist & Draft Save */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen del registro</Text>

          <View style={styles.statusItem}>
            <Ionicons
              name={isPersonalInfoValid ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={isPersonalInfoValid ? colors.success : colors.error}
            />
            <Text style={styles.statusItemText}>
              Pestaña 1 — Datos personales:{' '}
              <Text style={styles.statusBold}>
                {isPersonalInfoValid ? 'Completa y válida' : 'Incompleta'}
              </Text>
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons
              name={isVehicleInfoValid ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={isVehicleInfoValid ? colors.success : colors.error}
            />
            <Text style={styles.statusItemText}>
              Pestaña 2 — Vehículo:{' '}
              <Text style={styles.statusBold}>
                {isVehicleInfoValid ? 'Completa y válida' : 'Incompleta'}
              </Text>
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons
              name={isDocumentsInfoValid ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={isDocumentsInfoValid ? colors.success : colors.error}
            />
            <Text style={styles.statusItemText}>
              Pestaña 3 — Documentos y pagos:{' '}
              <Text style={styles.statusBold}>
                {isDocumentsInfoValid ? 'Completa y válida' : 'Incompleta'}
              </Text>
            </Text>
          </View>

          {!isDocumentsInfoValid ? (
            <Pressable
              style={styles.verifyButton}
              onPress={handleValidateAllDocuments}
            >
              <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
              <Text style={styles.verifyButtonText}>
                Verificar campos faltantes de esta pestaña
              </Text>
            </Pressable>
          ) : null}

          {saveError ? (
            <View style={styles.feedbackError}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.feedbackErrorText}>{saveError}</Text>
            </View>
          ) : null}

          {lastSavedAt ? (
            <View style={styles.feedbackSuccess}>
              <Ionicons name="cloud-done-outline" size={18} color={colors.success} />
              <Text style={styles.feedbackSuccessText}>
                Guardado en Firebase (ID: {driverId}) a las{' '}
                {lastSavedAt.toLocaleTimeString('es-CO')}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.saveDraftButton,
              (!canSaveDraft || isSavingDraft) && styles.saveDraftButtonDisabled,
            ]}
            onPress={saveDraft}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                <Text style={styles.saveDraftButtonText}>Guardar borrador en Firebase</Text>
              </>
            )}
          </Pressable>

          {driverId ? (
            <Pressable style={styles.resetButton} onPress={resetRegistration}>
              <Ionicons name="refresh-outline" size={16} color={colors.error} />
              <Text style={styles.resetButtonText}>Limpiar sesión local para nuevo registro</Text>
            </Pressable>
          ) : null}
        </View>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  quickFillText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  ruleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  ruleBannerRequired: {
    backgroundColor: colors.warningLight,
  },
  ruleBannerExempt: {
    backgroundColor: colors.successLight,
  },
  ruleBannerText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  ruleBannerTextRequired: {
    color: '#6E4500',
  },
  ruleBannerTextExempt: {
    color: colors.primaryDark,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  securityNoteText: {
    ...typography.caption,
    color: colors.primaryDark,
    flex: 1,
    lineHeight: 18,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusItemText: {
    ...typography.body,
    flex: 1,
  },
  statusBold: {
    fontWeight: '700',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  verifyButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  feedbackError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  feedbackErrorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  feedbackSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  feedbackSuccessText: {
    ...typography.caption,
    color: colors.success,
    flex: 1,
  },
  saveDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  saveDraftButtonDisabled: {
    opacity: 0.5,
  },
  saveDraftButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  resetButtonText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
});
