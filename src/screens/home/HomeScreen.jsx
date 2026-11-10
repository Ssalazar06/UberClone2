import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import useActiveTrip from '../../hooks/useActiveTrip.js';
import useDriverLocation from '../../hooks/useDriverLocation.js';
import useDriverRegistration from '../../hooks/useDriverRegistration.js';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

export default function HomeScreen({ navigation }) {
  const mapRef = useRef(null);
  const { registrationStatus, vehicleInfo } = useDriverRegistration();
  const {
    isAvailable,
    setAvailability,
    incomingTrips,
    activeTrip,
    tripError,
  } = useActiveTrip();

  const isApproved = registrationStatus === 'approved';
  const {
    location,
    region,
    errorMsg: locationError,
    isTracking,
  } = useDriverLocation(isAvailable);

  const handleToggleAvailability = (newValue) => {
    if (!isApproved) return;
    setAvailability(newValue);
  };

  const handleCenterUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        600
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Interactive Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={false}
        showsCompass={false}
      >
        {location ? (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Tu ubicación"
            description={
              vehicleInfo?.licensePlate
                ? `Placa: ${vehicleInfo.licensePlate}`
                : 'Conductor'
            }
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.carMarkerContainer}>
              <View
                style={[
                  styles.markerPulse,
                  isAvailable ? styles.pulseAvailable : styles.pulseUnavailable,
                ]}
              />
              <View
                style={[
                  styles.carIconCircle,
                  isAvailable ? styles.carAvailable : styles.carUnavailable,
                ]}
              >
                <Ionicons name="car" size={20} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        ) : null}
      </MapView>

      {/* Top Header Card: Availability Switcher */}
      <View style={styles.topCard}>
        <View style={styles.topCardContent}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusHeaderLabel}>Estado del conductor</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  isAvailable ? styles.indicatorOn : styles.indicatorOff,
                ]}
              />
              <Text
                style={[
                  styles.statusTitle,
                  isAvailable ? styles.statusTitleOn : styles.statusTitleOff,
                ]}
              >
                {isAvailable ? 'Disponible' : 'No disponible'}
              </Text>
            </View>
            <Text style={styles.statusDescription}>
              {isAvailable
                ? isTracking
                  ? 'Buscando solicitudes en tu zona (GPS activo)'
                  : 'Activando geolocalización...'
                : 'Conéctate para recibir solicitudes de viaje'}
            </Text>
          </View>

          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            disabled={!isApproved}
            trackColor={{ false: colors.border, true: colors.successLight }}
            thumbColor={isAvailable ? colors.primary : colors.textMuted}
            style={styles.switch}
          />
        </View>

        {locationError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        ) : null}

        {tripError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{tripError}</Text>
          </View>
        ) : null}
      </View>

      {/* Floating Center Location Button */}
      {location ? (
        <Pressable
          style={styles.centerButton}
          onPress={handleCenterUserLocation}
          android_ripple={{ color: colors.border, borderless: true }}
        >
          <Ionicons name="locate" size={24} color={colors.primary} />
        </Pressable>
      ) : null}

      {/* Bottom Floating Bar: Active Trip or Incoming Requests Counter */}
      {incomingTrips.length > 0 && isAvailable ? (
        <View style={styles.incomingBadge}>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.badgeSpinner} />
          <Text style={styles.incomingBadgeText}>
            {incomingTrips.length === 1
              ? '1 solicitud de viaje disponible'
              : `${incomingTrips.length} solicitudes de viaje disponibles`}
          </Text>
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topCard: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  statusHeaderLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  indicatorOn: {
    backgroundColor: colors.success,
  },
  indicatorOff: {
    backgroundColor: colors.textMuted,
  },
  statusTitle: {
    ...typography.h3,
  },
  statusTitleOn: {
    color: colors.primary,
  },
  statusTitleOff: {
    color: colors.textSecondary,
  },
  statusDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: 6,
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  carMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
  },
  pulseAvailable: {
    backgroundColor: colors.success,
  },
  pulseUnavailable: {
    backgroundColor: colors.textMuted,
  },
  carIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  carAvailable: {
    backgroundColor: colors.primary,
  },
  carUnavailable: {
    backgroundColor: colors.textSecondary,
  },
  incomingBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: 80,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    ...shadows.md,
  },
  badgeSpinner: {
    marginRight: spacing.sm,
  },
  incomingBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
});

