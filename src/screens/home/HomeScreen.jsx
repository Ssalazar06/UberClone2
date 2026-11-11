import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useActiveTrip from '../../hooks/useActiveTrip.js';
import useDriverLocation from '../../hooks/useDriverLocation.js';
import useDriverRegistration from '../../hooks/useDriverRegistration.js';
import useTripRequests from '../../hooks/useTripRequests.js';
import { createSimulatedTrip } from '../../services/tripService.js';
import IncomingRequestCard from '../../components/trip/IncomingRequestCard.jsx';
import {
  SafeMapView,
  SafeMarker,
  PROVIDER_DEFAULT,
} from '../../components/trip/SafeMapView.jsx';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

export default function HomeScreen() {
  const mapRef = useRef(null);
  const { registrationStatus, vehicleInfo } = useDriverRegistration();
  const {
    isAvailable,
    setAvailability,
    tripError,
  } = useActiveTrip();

  const isApproved = registrationStatus === 'approved';
  const {
    location,
    region,
    errorMsg: locationError,
    isTracking,
  } = useDriverLocation(isAvailable);

  const {
    currentRequest,
    secondsLeft,
    totalSeconds,
    isProcessing,
    handleAccept,
    handleReject,
  } = useTripRequests();

  const [simulating, setSimulating] = useState(false);

  const handleSimulateRequest = async () => {
    if (simulating) return;
    setSimulating(true);
    try {
      await createSimulatedTrip({
        category: vehicleInfo?.category || 'economy',
        paymentMethod: 'cash',
      });
    } catch (err) {
      console.log('Error creating simulated trip:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Fit map to show driver + incoming request pickup/destination markers
  useEffect(() => {
    if (!currentRequest || !mapRef.current) return;

    const coords = [];
    if (location) {
      coords.push({ latitude: location.latitude, longitude: location.longitude });
    }
    if (currentRequest.origin) {
      coords.push({ latitude: currentRequest.origin.lat, longitude: currentRequest.origin.lng });
    }
    if (currentRequest.destination) {
      coords.push({
        latitude: currentRequest.destination.lat,
        longitude: currentRequest.destination.lng,
      });
    }

    if (coords.length >= 2) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 120, right: 50, bottom: 380, left: 50 },
        animated: true,
      });
    }
  }, [currentRequest?.id]);

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
      <SafeMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={false}
        showsCompass={false}
      >
        {location ? (
          <SafeMarker
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
          </SafeMarker>
        ) : null}

        {/* Incoming Request Origin & Destination Markers */}
        {currentRequest?.origin ? (
          <SafeMarker
            coordinate={{
              latitude: currentRequest.origin.lat,
              longitude: currentRequest.origin.lng,
            }}
            title="Recogida"
            description={currentRequest.origin.address}
            pinColor={colors.success}
          />
        ) : null}

        {currentRequest?.destination ? (
          <SafeMarker
            coordinate={{
              latitude: currentRequest.destination.lat,
              longitude: currentRequest.destination.lng,
            }}
            title="Destino"
            description={currentRequest.destination.address}
            pinColor={colors.error}
          />
        ) : null}
      </SafeMapView>

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

      {/* Floating Center Location Button (hidden while incoming request card is open) */}
      {location && !currentRequest ? (
        <Pressable
          style={styles.centerButton}
          onPress={handleCenterUserLocation}
          android_ripple={{ color: colors.border, borderless: true }}
        >
          <Ionicons name="locate" size={24} color={colors.primary} />
        </Pressable>
      ) : null}

      {/* Quick In-App Simulator Button (when available and waiting for requests) */}
      {isAvailable && !currentRequest ? (
        <Pressable
          style={styles.simulateButton}
          onPress={handleSimulateRequest}
          disabled={simulating}
        >
          {simulating ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <>
              <Ionicons name="flash" size={18} color={colors.primaryText} />
              <Text style={styles.simulateButtonText}>Simular solicitud</Text>
            </>
          )}
        </Pressable>
      ) : null}

      {/* Incoming Trip Request Card with 15s Countdown */}
      {currentRequest ? (
        <IncomingRequestCard
          request={currentRequest}
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          isProcessing={isProcessing}
          onAccept={handleAccept}
          onReject={handleReject}
        />
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
    ...typography.subtitle,
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
    backgroundColor: colors.errorLight,
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
  simulateButton: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    ...shadows.md,
    gap: 6,
  },
  simulateButtonText: {
    ...typography.label,
    color: colors.primaryText,
    fontWeight: '700',
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
});
