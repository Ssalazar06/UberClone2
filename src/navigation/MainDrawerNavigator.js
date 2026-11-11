import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import TripStackNavigator from './TripStackNavigator.js';
import PlaceholderScreen from '../screens/common/PlaceholderScreen.jsx';
import useDriverRegistration from '../hooks/useDriverRegistration.js';
import useActiveTrip from '../hooks/useActiveTrip.js';
import { colors, radius, spacing, typography } from '../theme/index.js';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { personalInfo, vehicleInfo, resetRegistration } = useDriverRegistration();
  const { isAvailable } = useActiveTrip();

  return (
    <View style={styles.drawerRoot}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        {/* Header with Driver info */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.primary} />
          </View>
          <Text style={styles.driverName}>
            {personalInfo?.fullName || 'Conductor UberClone'}
          </Text>
          <Text style={styles.vehicleSubtitle}>
            {vehicleInfo?.brand && vehicleInfo?.model
              ? `${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.licensePlate || ''})`
              : 'Vehículo registrado'}
          </Text>
          <View
            style={[
              styles.statusChip,
              isAvailable ? styles.statusAvailable : styles.statusUnavailable,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isAvailable ? styles.dotAvailable : styles.dotUnavailable,
              ]}
            />
            <Text style={styles.statusChipText}>
              {isAvailable ? 'Disponible' : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Drawer items */}
        <View style={styles.drawerItems}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Logout button */}
      <View style={styles.footer}>
        <Pressable
          style={styles.logoutButton}
          onPress={async () => {
            if (resetRegistration) await resetRegistration();
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}
function HistoryScreenWrapper() {
  return (
    <PlaceholderScreen
      title="Historial de Carreras"
      subtitle="Lista de carreras realizadas con filtros por hoy, semana y mes (Fase 5)."
    />
  );
}

function EarningsScreenWrapper() {
  return (
    <PlaceholderScreen
      title="Ganancias"
      subtitle="Resumen de tarifas facturadas, comisiones descontadas y saldo neto (Fase 5)."
    />
  );
}

function ProfileScreenWrapper() {
  return (
    <PlaceholderScreen
      title="Perfil y Configuración"
      subtitle="Información personal, vehículo, documentos e idioma (Fase 5)."
    />
  );
}

export default function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          ...typography.h3,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          ...typography.body,
          marginLeft: -10,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={TripStackNavigator}
        options={{
          title: 'Inicio',
          drawerLabel: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreenWrapper}
        options={{
          title: 'Historial',
          drawerLabel: 'Historial de carreras',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Earnings"
        component={EarningsScreenWrapper}
        options={{
          title: 'Ganancias',
          drawerLabel: 'Ganancias',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreenWrapper}
        options={{
          title: 'Perfil',
          drawerLabel: 'Perfil y configuración',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingTop: 0,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  driverName: {
    ...typography.h3,
    color: colors.text,
  },
  vehicleSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  statusAvailable: {
    backgroundColor: colors.successLight,
  },
  statusUnavailable: {
    backgroundColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotAvailable: {
    backgroundColor: colors.success,
  },
  dotUnavailable: {
    backgroundColor: colors.textMuted,
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  drawerItems: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

