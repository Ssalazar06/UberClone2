import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { calculateFare } from '../../utils/calculateFare.js';
import { formatCOP } from '../../utils/routeUtils.js';
import { PAYMENT_METHOD_LABELS } from '../../constants/tripStatus.js';
import { getOptionLabel, VEHICLE_CATEGORY_OPTIONS } from '../../data/registrationOptions.js';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

export default function IncomingRequestCard({
  request,
  secondsLeft,
  totalSeconds = 15,
  isProcessing,
  onAccept,
  onReject,
}) {
  const estimate = useMemo(() => {
    if (!request) return { fare: 0, driverEarnings: 0 };
    return calculateFare({
      distanceKm: request.distanceKm || 0,
      durationMin: request.durationMin || 0,
      category: request.category || 'economy',
      tip: request.tip || 0,
    });
  }, [request]);

  if (!request) return null;

  const progressRatio = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const categoryLabel =
    getOptionLabel(VEHICLE_CATEGORY_OPTIONS, request.category) || request.category;
  const paymentLabel =
    PAYMENT_METHOD_LABELS[request.paymentMethod] || request.paymentMethod || 'Efectivo';

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.card}>
        {/* Countdown Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressRatio * 100}%` },
              secondsLeft <= 5 && styles.progressBarUrgent,
            ]}
          />
        </View>

        {/* Header: Title + Timer Circle */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{categoryLabel}</Text>
            </View>
            <Text style={styles.headerTitle}>Nueva solicitud de viaje</Text>
            <Text style={styles.passengerText}>
              Pasajero: {request.passengerName || 'Pasajero'}
            </Text>
          </View>

          <View
            style={[
              styles.timerCircle,
              secondsLeft <= 5 && styles.timerCircleUrgent,
            ]}
          >
            <Text
              style={[
                styles.timerText,
                secondsLeft <= 5 && styles.timerTextUrgent,
              ]}
            >
              {secondsLeft}s
            </Text>
          </View>
        </View>

        {/* Earnings Highlight */}
        <View style={styles.fareBox}>
          <View style={styles.fareColumn}>
            <Text style={styles.fareLabel}>Tu ganancia neta estimada</Text>
            <Text style={styles.earningsValue}>{formatCOP(estimate.driverEarnings)}</Text>
            <Text style={styles.fareSubtext}>
              Tarifa total: {formatCOP(estimate.fare)}
              {request.tip > 0 ? ` (+ ${formatCOP(request.tip)} propina)` : ''}
            </Text>
          </View>
          <View style={styles.paymentChip}>
            <Ionicons
              name={request.paymentMethod === 'cash' ? 'cash-outline' : 'card-outline'}
              size={16}
              color={colors.primary}
            />
            <Text style={styles.paymentChipText}>{paymentLabel}</Text>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <Ionicons name="radio-button-on" size={16} color={colors.success} />
            <View style={styles.routeTexts}>
              <Text style={styles.routeLabel}>Recogida</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {request.origin?.name ? `${request.origin.name} — ` : ''}
                {request.origin?.address || 'Origen'}
              </Text>
            </View>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routeRow}>
            <Ionicons name="location" size={16} color={colors.error} />
            <View style={styles.routeTexts}>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>
                {request.destination?.name ? `${request.destination.name} — ` : ''}
                {request.destination?.address || 'Destino'}
              </Text>
            </View>
          </View>
        </View>

        {/* Distance & Duration */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metricText}>{request.distanceKm} km</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metricText}>{request.durationMin} min aprox.</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.button, styles.rejectButton]}
            onPress={onReject}
            disabled={isProcessing}
          >
            <Text style={styles.rejectButtonText}>Rechazar</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.acceptButton]}
            onPress={onAccept}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <Text style={styles.acceptButtonText}>Aceptar viaje</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    zIndex: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    overflow: 'hidden',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: colors.disabled,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressBarUrgent: {
    backgroundColor: colors.error,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 4,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  passengerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  timerCircleUrgent: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  timerText: {
    ...typography.label,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  timerTextUrgent: {
    color: colors.error,
  },
  fareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  fareColumn: {
    flex: 1,
  },
  fareLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  earningsValue: {
    ...typography.title,
    color: colors.primary,
  },
  fareSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  routeContainer: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDivider: {
    width: 2,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 7,
    marginVertical: 2,
  },
  routeTexts: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  routeLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  routeAddress: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectButtonText: {
    ...typography.button,
    color: colors.error,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
});
