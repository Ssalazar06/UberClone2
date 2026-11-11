// AI-assisted: see docs/AI_LOG.md #10

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useActiveTrip from '../../hooks/useActiveTrip.js';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  TRIP_STATUS,
} from '../../constants/tripStatus.js';
import { formatCOP } from '../../utils/routeUtils.js';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

/**
 * Payment & Trip Summary screen shown once the trip reaches status 'completed' or 'paid'.
 * Displays final fare, platform commission, net driver earnings, payment status,
 * and allows confirming cash payment or waiting for online gateway confirmation.
 */
export default function TripSummaryScreen() {
  const {
    activeTrip,
    tripActionLoading,
    tripError,
    confirmCashPayment,
    clearActiveTrip,
  } = useActiveTrip();

  if (!activeTrip) return null;

  const isPaid = activeTrip.status === TRIP_STATUS.PAID || activeTrip.paymentStatus === PAYMENT_STATUS.APPROVED;
  const isCash = activeTrip.paymentMethod === PAYMENT_METHODS.CASH;

  const paymentStatusLabel = isPaid
    ? isCash
      ? 'Efectivo'
      : 'Aprobado'
    : PAYMENT_STATUS_LABELS[activeTrip.paymentStatus] || 'Pendiente';

  const commissionPercent = Math.round((activeTrip.commissionRate ?? 0.2) * 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerIconContainer}>
        <Ionicons
          name={isPaid ? 'checkmark-circle' : 'time-outline'}
          size={64}
          color={isPaid ? colors.success : colors.warning}
        />
        <Text style={styles.title}>
          {isPaid ? 'Viaje finalizado y pagado' : 'Viaje finalizado'}
        </Text>
        <Text style={styles.subtitle}>
          {isPaid
            ? 'El resumen del viaje ya quedó registrado en tu historial.'
            : isCash
            ? 'Cobra el valor indicado en efectivo al pasajero y confirma el recibo.'
            : 'Esperando confirmación del pago en línea del pasajero...'}
        </Text>
      </View>

      {/* Summary Receipt Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Resumen de cobro</Text>
          <View
            style={[
              styles.statusBadge,
              isPaid ? styles.badgePaid : styles.badgePending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isPaid ? styles.badgePaidText : styles.badgePendingText,
              ]}
            >
              {paymentStatusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pasajero</Text>
          <Text style={styles.detailValue}>{activeTrip.passengerName || 'Pasajero'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Método de pago</Text>
          <Text style={styles.detailValue}>
            {PAYMENT_METHOD_LABELS[activeTrip.paymentMethod] || 'Efectivo'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distancia y duración</Text>
          <Text style={styles.detailValue}>
            {activeTrip.distanceKm} km · {activeTrip.durationMin} min
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tarifa total cobrada</Text>
          <Text style={styles.detailValue}>{formatCOP(activeTrip.fare)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Comisión plataforma ({commissionPercent}%)</Text>
          <Text style={[styles.detailValue, styles.commissionValue]}>
            - {formatCOP(activeTrip.commission)}
          </Text>
        </View>

        {activeTrip.tip > 0 ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Propina (100% tuya)</Text>
            <Text style={[styles.detailValue, styles.tipValue]}>
              + {formatCOP(activeTrip.tip)}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tu ganancia neta</Text>
          <Text style={styles.totalValue}>{formatCOP(activeTrip.driverEarnings)}</Text>
        </View>

        {isCash ? (
          <View style={styles.cashNotice}>
            <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.cashNoticeText}>
              Al ser pago en efectivo, cobras {formatCOP(activeTrip.fare)} completos al pasajero y la comisión de {formatCOP(activeTrip.commission)} se descuenta de tu saldo en la plataforma.
            </Text>
          </View>
        ) : null}
      </View>

      {tripError ? <Text style={styles.errorText}>{tripError}</Text> : null}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {!isPaid && isCash ? (
          <Pressable
            style={styles.primaryButton}
            onPress={confirmCashPayment}
            disabled={tripActionLoading}
          >
            {tripActionLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.primaryButtonText}>Cobro en efectivo recibido</Text>
            )}
          </Pressable>
        ) : null}

        {!isPaid && !isCash ? (
          <View style={styles.waitingGatewayBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.waitingGatewayText}>
              Sincronizando pago con la pasarela...
            </Text>
          </View>
        ) : null}

        {isPaid ? (
          <Pressable style={styles.primaryButton} onPress={clearActiveTrip}>
            <Text style={styles.primaryButtonText}>Volver al mapa</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgePaid: {
    backgroundColor: colors.successLight,
  },
  badgePending: {
    backgroundColor: colors.warningLight,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  badgePaidText: {
    color: colors.success,
  },
  badgePendingText: {
    color: colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.label,
    color: colors.text,
  },
  commissionValue: {
    color: colors.error,
  },
  tipValue: {
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
  cashNotice: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  cashNoticeText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xs,
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
  waitingGatewayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  waitingGatewayText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});
