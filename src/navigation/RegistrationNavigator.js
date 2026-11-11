import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import useDriverRegistration from '../hooks/useDriverRegistration';
import useKeyboardPadding from '../hooks/useKeyboardPadding';
import PersonalInfoScreen from '../screens/registration/PersonalInfoScreen';
import VehicleInfoScreen from '../screens/registration/VehicleInfoScreen';
import DocumentsInfoScreen from '../screens/registration/DocumentsInfoScreen';
import { colors, radius, shadows, spacing, typography } from '../theme';

const Tab = createBottomTabNavigator();

function TabBarIcon({ routeName, focused, color, size, isValid }) {
  let iconName = focused ? 'list' : 'list-outline';

  if (routeName === 'PersonalInfo') {
    iconName = focused ? 'person' : 'person-outline';
  } else if (routeName === 'VehicleInfo') {
    iconName = focused ? 'car' : 'car-outline';
  } else if (routeName === 'DocumentsInfo') {
    iconName = focused ? 'document-text' : 'document-text-outline';
  }

  return (
    <View style={styles.iconContainer}>
      <Ionicons name={iconName} size={size || 24} color={color || colors.text} />
      {isValid ? (
        <View style={styles.validBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
        </View>
      ) : null}
    </View>
  );
}

export default function RegistrationNavigator() {
  const {
    isPersonalInfoValid,
    isVehicleInfoValid,
    isDocumentsInfoValid,
    isRegistrationValid,
    isSaving,
    savingAction,
    saveError,
    submitRegistration,
    loginAsApprovedDemoDriver,
    registrationStatus,
    isLoadingSession,
  } = useDriverRegistration();
  const { isKeyboardVisible } = useKeyboardPadding();

  if (isLoadingSession) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando información del conductor...</Text>
      </View>
    );
  }

  const getTabValidity = (routeName) => {
    if (routeName === 'PersonalInfo') return isPersonalInfoValid;
    if (routeName === 'VehicleInfo') return isVehicleInfoValid;
    if (routeName === 'DocumentsInfo') return isDocumentsInfoValid;
    return false;
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="PersonalInfo"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              routeName={route.name}
              focused={focused}
              color={color}
              size={size}
              isValid={getTabValidity(route.name)}
            />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        })}
      >
        <Tab.Screen
          name="PersonalInfo"
          component={PersonalInfoScreen}
          options={{
            title: 'Datos personales',
            tabBarLabel: 'Personales',
          }}
        />
        <Tab.Screen
          name="VehicleInfo"
          component={VehicleInfoScreen}
          options={{
            title: 'Vehículo',
            tabBarLabel: 'Vehículo',
          }}
        />
        <Tab.Screen
          name="DocumentsInfo"
          component={DocumentsInfoScreen}
          options={{
            title: 'Documentos',
            tabBarLabel: 'Documentos',
          }}
        />
      </Tab.Navigator>

      {/* Footer "Enviar registro" (hidden while keyboard is open so inputs have full scroll room) */}
      {!isKeyboardVisible ? (
        <View style={styles.footer}>
          {registrationStatus === 'approved' ? (
            <View style={styles.approvedStatusContainer}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.success}
                style={styles.pendingIcon}
              />
              <View style={styles.pendingTextContainer}>
                <Text style={styles.approvedTitle}>Estado: Aprobado</Text>
                <Text style={styles.approvedSubtitle}>
                  Tu cuenta de conductor fue aprobada. Ya puedes conectarte como Disponible.
                </Text>
              </View>
            </View>
          ) : registrationStatus === 'pending_approval' ? (
            <View style={styles.pendingStatusContainer}>
              <Ionicons
                name="time-outline"
                size={24}
                color="#92400E"
                style={styles.pendingIcon}
              />
              <View style={styles.pendingTextContainer}>
                <Text style={styles.pendingTitle}>Estado: Pendiente de aprobación</Text>
                <Text style={styles.pendingSubtitle}>
                  Tu registro fue enviado y está siendo revisado. No podrás ponerte Disponible
                  hasta que tu estado cambie a Aprobado en la base de datos.
                </Text>
              </View>
            </View>
          ) : (
            <View>
              {saveError ? (
                <Text style={styles.footerErrorText}>{saveError}</Text>
              ) : null}

              <Pressable
                style={[
                  styles.submitButton,
                  (!isRegistrationValid || isSaving) && styles.submitButtonDisabled,
                ]}
                disabled={!isRegistrationValid || isSaving}
                onPress={submitRegistration}
              >
                {savingAction === 'submit' ? (
                  <ActivityIndicator color={colors.primaryText} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      !isRegistrationValid && styles.submitButtonTextDisabled,
                    ]}
                  >
                    Enviar registro
                  </Text>
                )}
              </Pressable>

              {!isRegistrationValid ? (
                <Text style={styles.disabledReason}>
                  Completa y valida las 3 pestañas para habilitar el envío
                </Text>
              ) : null}
            </View>
          )}

          {registrationStatus !== 'approved' ? (
            <Pressable
              style={styles.demoApproveButton}
              onPress={loginAsApprovedDemoDriver}
              disabled={isSaving}
            >
              <Ionicons name="flash-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.demoApproveButtonText}>
                Modo Pruebas: Entrar como Conductor Aprobado
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  iconContainer: {
    position: 'relative',
  },
  validBadge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 62,
    paddingBottom: 6,
    paddingTop: 6,
    ...shadows.sm,
  },
  tabBarLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerErrorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
  submitButtonTextDisabled: {
    color: colors.disabledText,
  },
  disabledReason: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  pendingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  approvedStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  pendingIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  pendingTextContainer: {
    flex: 1,
  },
  pendingTitle: {
    ...typography.label,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingSubtitle: {
    ...typography.caption,
    color: '#B45309',
    marginTop: 2,
  },
  approvedTitle: {
    ...typography.label,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  approvedSubtitle: {
    ...typography.caption,
    color: colors.success,
    marginTop: 2,
  },
  demoApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderFocus,
    gap: 6,
  },
  demoApproveButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
