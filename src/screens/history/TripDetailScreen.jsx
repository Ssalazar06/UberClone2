import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  SafeMapView,
  SafeMarker,
  SafePolyline,
  PROVIDER_DEFAULT,
} from '../../components/trip/SafeMapView.jsx';
import { resolveTripDate } from '../../hooks/useEarnings.js';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  TRIP_STATUS_LABELS,
} from '../../constants/tripStatus.js';
import { VEHICLE_CATEGORY_OPTIONS, getOptionLabel } from '../../data/registrationOptions.js';
import { fetchRouteCoordinates, formatCOP } from '../../utils/routeUtils.js';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

export default function TripDetailScreen({ route }) {
  const mapRef = useRef(null);
  const trip = route?.params?.trip || {};

  const initialPolyline = useMemo(() => {
    if (Array.isArray(trip.routeCoordinates) && trip.routeCoordinates.length >= 2) {
      return trip.routeCoordinates
        .map((pt) => ({
          latitude: Number(pt.latitude ?? pt.lat),
          longitude: Number(pt.longitude ?? pt.lng),
        }))
        .filter((pt) => Number.isFinite(pt.latitude) && Number.isFinite(pt.longitude));
    }
    return [];
  }, [trip.routeCoordinates]);

  const [polylineCoords, setPolylineCoords] = useState(initialPolyline);

  useEffect(() => {
    let isMounted = true;
    if (initialPolyline.length >= 2) {
      setPolylineCoords(initialPolyline);
      return undefined;
    }
    if (trip.origin && trip.destination) {
      fetchRouteCoordinates(trip.origin, trip.destination).then((coords) => {
        if (isMounted && coords.length >= 2) {
          setPolylineCoords(coords);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialPolyline, trip.origin, trip.destination]);

  const initialRegion = useMemo(() => {
    const lat = Number(trip.origin?.lat ?? 6.2442);
    const lng = Number(trip.origin?.lng ?? -75.5812);
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [trip.origin]);

  const tripDate = resolveTripDate(trip);
  const formattedDate = tripDate
    ? tripDate.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Fecha no disponible';

  const categoryLabel =
    getOptionLabel(VEHICLE_CATEGORY_OPTIONS, trip.category) || 'Económico';
  const commissionPercent = Math.round((trip.commissionRate ?? 0.2) * 100);
  const ratingValue = Number(trip.rating) || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.mapContainer}>
        <SafeMapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          onMapReady={() => {
            if (polylineCoords.length >= 2 && mapRef.current?.fitToCoordinates) {
              mapRef.current.fitToCoordinates(polylineCoords, {
                edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                animated: false,
              });
            }
          }}
        >
          {trip.origin ? (
            <SafeMarker
              coordinate={{
                latitude: Number(trip.origin.lat),
                longitude: Number(trip.origin.lng),
              }}
              title="Recogida"
              description={trip.origin.address || trip.origin.name}
              pinColor={colors.success}
            />
          ) : null}

          {trip.destination ? (
            <SafeMarker
              coordinate={{
                latitude: Number(trip.destination.lat),
                longitude: Number(trip.destination.lng),
              }}
              title="Destino"
              description={trip.destination.address || trip.destination.name}
              pinColor={colors.error}
            />
          ) : null}

          {polylineCoords.length >= 2 ? (
            <SafePolyline
              coordinates={polylineCoords}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          ) : null}
        </SafeMapView>
      </View>

      <View style={styles.card}>
        <Text style={styles.dateTitle}>{formattedDate}</Text>
        <Text style={styles.tripIdText}>ID: {trip.id || trip.tripId}</Text>

        <View style={styles.divider} />

        <View style={styles.routeBlock}>
          <View style={styles.routeItem}>
            <Ionicons name="radio-button-on" size={18} color={colors.success} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>Punto de recogida</Text>
              <Text style={styles.routeValue}>
                {trip.origin?.name || 'Origen'} — {trip.origin?.address || ''}
              </Text>
            </View>
          </View>

          <View style={styles.routeItem}>
            <Ionicons name="location" size={18} color={colors.error} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>Destino final</Text>
              <Text style={styles.routeValue}>
                {trip.destination?.name || 'Destino'} — {trip.destination?.address || ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            <Text style={styles.metricValue}>{trip.distanceKm ?? 0} km</Text>
            <Text style={styles.metricLabel}>Distancia</Text>
          </View>
          <View style={styles.metricBox}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.metricValue}>{trip.durationMin ?? 0} min</Text>
            <Text style={styles.metricLabel}>Duración</Text>
          </View>
          <View style={styles.metricBox}>
            <Ionicons name="car-sport-outline" size={18} color={colors.primary} />
            <Text style={styles.metricValue}>{categoryLabel}</Text>
            <Text style={styles.metricLabel}>Categoría</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pasajero y calificación</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pasajero</Text>
          <Text style={styles.detailValue}>{trip.passengerName || 'Pasajero'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estado del viaje</Text>
          <Text style={styles.detailValue}>
            {TRIP_STATUS_LABELS[trip.status] || trip.status}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Calificación recibida</Text>
          {ratingValue > 0 ? (
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= ratingValue ? 'star' : 'star-outline'}
                  size={16}
                  color="#F59E0B"
                />
              ))}
              <Text style={styles.ratingNumber}>{ratingValue}.0</Text>
            </View>
          ) : (
            <Text style={styles.detailValue}>Sin calificar</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Desglose financiero</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Método de pago</Text>
          <Text style={styles.detailValue}>
            {PAYMENT_METHOD_LABELS[trip.paymentMethod] || 'Efectivo'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estado del pago</Text>
          <Text style={styles.detailValue}>
            {PAYMENT_STATUS_LABELS[trip.paymentStatus] || 'Pendiente'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tarifa base cobrada</Text>
          <Text style={styles.detailValue}>{formatCOP(trip.fare || 0)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Comisión plataforma ({commissionPercent}%)
          </Text>
          <Text style={[styles.detailValue, styles.negativeText]}>
            - {formatCOP(trip.commission || 0)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Propina (100% conductor)</Text>
          <Text style={[styles.detailValue, styles.positiveText]}>
            + {formatCOP(trip.tip || 0)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Ganancia neta del viaje</Text>
          <Text style={styles.totalValue}>
            {formatCOP(trip.driverEarnings ?? trip.fare ?? 0)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  mapContainer: {
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  dateTitle: {
    ...typography.subtitle,
    color: colors.text,
    textTransform: 'capitalize',
  },
  tripIdText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  routeBlock: {
    gap: spacing.md,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  routeValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    ...typography.label,
    color: colors.text,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.label,
    color: colors.text,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNumber: {
    ...typography.label,
    color: '#B45309',
    marginLeft: spacing.xs,
  },
  negativeText: {
    color: colors.error,
  },
  positiveText: {
    color: colors.success,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.subtitle,
    color: colors.text,
  },
  totalValue: {
    ...typography.title,
    color: colors.primary,
  },
});

