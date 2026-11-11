import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useActiveTrip from '../../hooks/useActiveTrip.js';
import useDriverLocation from '../../hooks/useDriverLocation.js';
import {
  SafeMapView,
  SafeMarker,
  SafePolyline,
  PROVIDER_DEFAULT,
} from '../../components/trip/SafeMapView.jsx';
import { TRIP_STATUS, TRIP_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../constants/tripStatus.js';
import { fetchRouteCoordinates, formatCOP } from '../../utils/routeUtils.js';
import { calculateFare } from '../../utils/calculateFare.js';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

/**
 * Active trip screen managing the ride lifecycle:
 * - accepted / driver_arriving: route from driver to pickup point
 * - in_progress: route from pickup point to destination
 * - transitions to TripSummary when completed
 */
export default function ActiveTripScreen() {
  const mapRef = useRef(null);
  const {
    activeTrip,
    tripActionLoading,
    tripError,
    changeTripStatus,
    completeTrip,
  } = useActiveTrip();

  // Keep driver GPS active while on an active trip
  const { location, region } = useDriverLocation(true);

  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const status = activeTrip?.status;
  const isPickingUp =
    status === TRIP_STATUS.ACCEPTED || status === TRIP_STATUS.DRIVER_ARRIVING;
  const isInProgress = status === TRIP_STATUS.IN_PROGRESS;

  // Fetch driving route ONLY when trip phase changes (accepted/arriving -> in_progress)
  useEffect(() => {
    let isMounted = true;

    const loadRoute = async () => {
      if (!activeTrip) return;

      const pickupPoint = activeTrip.origin;
      const dropoffPoint = activeTrip.destination;

      if (!pickupPoint || !dropoffPoint) return;

      setLoadingRoute(true);
      let coords = [];

      if (isPickingUp) {
        // From driver location (or origin fallback) to passenger pickup
        const start = location
          ? { lat: location.latitude, lng: location.longitude }
          : pickupPoint;
        coords = await fetchRouteCoordinates(start, pickupPoint);
      } else if (isInProgress) {
        // From passenger pickup to final destination
        coords = await fetchRouteCoordinates(pickupPoint, dropoffPoint);
      }

      if (isMounted) {
        setRouteCoords(coords);
        setLoadingRoute(false);

        if (coords.length >= 2 && mapRef.current) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 50, bottom: 280, left: 50 },
            animated: true,
          });
        }
      }
    };

    loadRoute();

    return () => {
      isMounted = false;
    };
  }, [status, activeTrip?.id]);

  if (!activeTrip) return null;

  const estimated = calculateFare({
    distanceKm: activeTrip.distanceKm || 0,
    durationMin: activeTrip.durationMin || 0,
    category: activeTrip.category || 'economy',
    tip: activeTrip.tip || 0,
  });

  const handleMarkArriving = () => {
    changeTripStatus(TRIP_STATUS.DRIVER_ARRIVING);
  };

  const handlePassengerBoarded = () => {
    changeTripStatus(TRIP_STATUS.IN_PROGRESS);
  };

  const handleFinishTrip = () => {
    completeTrip({
      distanceKm: activeTrip.distanceKm,
      durationMin: activeTrip.durationMin,
      tip: activeTrip.tip || 0,
      routeCoordinates: routeCoords,
    });
  };

  const handleCancelTrip = () => {
    changeTripStatus(TRIP_STATUS.CANCELLED, { cancelledBy: 'driver' });
  };

  return (
    <View style={styles.container}>
      <SafeMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
      >
        {/* Driver Marker */}
        {location ? (
          <SafeMarker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Tu vehículo"
          >
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={18} color="#FFFFFF" />
            </View>
          </SafeMarker>
        ) : null}

        {/* Origin (Pickup) Marker */}
        {activeTrip.origin ? (
          <SafeMarker
            coordinate={{
              latitude: activeTrip.origin.lat,
              longitude: activeTrip.origin.lng,
            }}
            title="Punto de recogida"
            description={activeTrip.origin.address}
            pinColor={colors.success}
          />
        ) : null}

        {/* Destination Marker */}
        {activeTrip.destination ? (
          <SafeMarker
            coordinate={{
              latitude: activeTrip.destination.lat,
              longitude: activeTrip.destination.lng,
            }}
            title="Destino"
            description={activeTrip.destination.address}
            pinColor={colors.error}
          />
        ) : null}

        {/* Route Polyline */}
        {routeCoords.length >= 2 ? (
          <SafePolyline
            coordinates={routeCoords}
            strokeColor={isInProgress ? colors.primary : colors.secondary}
            strokeWidth={4}
          />
        ) : null}
      </SafeMapView>

      {/* Top Status Pill */}
      <View style={styles.topStatusBar}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>
            {TRIP_STATUS_LABELS[status] || 'Viaje activo'}
          </Text>
          {loadingRoute ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.routeLoader} />
          ) : null}
        </View>
      </View>

      {/* Bottom Action Panel */}
      <View style={styles.bottomCard}>
        <View style={styles.passengerRow}>
          <View style={styles.passengerAvatar}>
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>
              {activeTrip.passengerName || 'Pasajero'}
            </Text>
            <Text style={styles.tripMeta}>
              {activeTrip.distanceKm} km · {activeTrip.durationMin} min ·{' '}
              {PAYMENT_METHOD_LABELS[activeTrip.paymentMethod] || 'Efectivo'}
            </Text>
          </View>
          <Text style={styles.fareTag}>{formatCOP(estimated.fare)}</Text>
        </View>

        <View style={styles.destinationBox}>
          <Ionicons
            name={isPickingUp ? 'radio-button-on' : 'location'}
            size={18}
            color={isPickingUp ? colors.success : colors.error}
          />
          <View style={styles.destTexts}>
            <Text style={styles.destLabel}>
              {isPickingUp ? 'Dirígete al punto de recogida' : 'Dirígete al destino final'}
            </Text>
            <Text style={styles.destAddress} numberOfLines={2}>
              {isPickingUp
                ? `${activeTrip.origin?.name ? `${activeTrip.origin.name} — ` : ''}${activeTrip.origin?.address || ''
                }`
                : `${activeTrip.destination?.name ? `${activeTrip.destination.name} — ` : ''}${activeTrip.destination?.address || ''
                }`}
            </Text>
          </View>
        </View>

        {tripError ? <Text style={styles.errorText}>{tripError}</Text> : null}

        {/* Stage Action Buttons */}
        <View style={styles.actionsColumn}>
          {status === TRIP_STATUS.ACCEPTED ? (
            <Pressable
              style={[styles.primaryButton, styles.secondaryButton]}
              onPress={handleMarkArriving}
              disabled={tripActionLoading}
            >
              {tripActionLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.primaryButtonText}>Llegué al punto de recogida</Text>
              )}
            </Pressable>
          ) : null}

          {isPickingUp ? (
            <Pressable
              style={styles.primaryButton}
              onPress={handlePassengerBoarded}
              disabled={tripActionLoading}
            >
              {tripActionLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.primaryButtonText}>Pasajero a bordo</Text>
              )}
            </Pressable>
          ) : null}

          {isInProgress ? (
            <Pressable
              style={[styles.primaryButton, styles.finishButton]}
              onPress={handleFinishTrip}
              disabled={tripActionLoading}
            >
              {tripActionLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.primaryButtonText}>Finalizar viaje</Text>
              )}
            </Pressable>
          ) : null}

          {isPickingUp ? (
            <Pressable
              style={styles.cancelButton}
              onPress={handleCancelTrip}
              disabled={tripActionLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar viaje</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
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
  driverMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.sm,
  },
  topStatusBar: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  statusPillText: {
    ...typography.label,
    color: colors.text,
  },
  routeLoader: {
    marginLeft: spacing.sm,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  passengerName: {
    ...typography.subtitle,
    color: colors.text,
  },
  tripMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fareTag: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  destTexts: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  destLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  destAddress: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  finishButton: {
    backgroundColor: colors.primaryDark,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.error,
  },
});
