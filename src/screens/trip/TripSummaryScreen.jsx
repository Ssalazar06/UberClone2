// AI-assisted: see docs/AI_LOG.md #5

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
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
 * Listens in real time via onSnapshot (from ActiveTripContext), displays fare breakdown,
 * payment status (Aprobado / Pendiente / Rechazado / Efectivo), Mercado Pago Checkout Pro
 * preference generation, cash confirmation, and the driver's live platform balance.
 */
export default function TripSummaryScreen() {
  const {
    activeTrip,
    driverBalance,
    balanceBreakdown,
    paymentPreference,
    tripActionLoading,
    tripError,
    confirmCashPayment,
    requestMercadoPagoPreference,
    verifyMercadoPagoPayment,
    paymentVerifying,
    paymentCheckMessage,
    switchToCashPayment,
    changeTripStatus,
    clearActiveTrip,
  } = useActiveTrip();

  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [openError, setOpenError] = useState(null);
  const appStateRef = useRef(AppState.currentState);

  const tripIsPaid =
    activeTrip?.status === TRIP_STATUS.PAID ||
    activeTrip?.paymentStatus === PAYMENT_STATUS.APPROVED;

  // When the driver returns from Checkout Pro (browser) to the app, actively verify payment
  useEffect(() => {
    if (!checkoutOpened || tripIsPaid) return undefined;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        verifyMercadoPagoPayment({ silent: true });
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [checkoutOpened, tripIsPaid, verifyMercadoPagoPayment]);

  // Periodic fallback polling every 8 s while waiting for the webhook
  useEffect(() => {
    if (!checkoutOpened || tripIsPaid) return undefined;
    const intervalId = setInterval(() => {
      verifyMercadoPagoPayment({ silent: true });
    }, 8000);
    return () => clearInterval(intervalId);
  }, [checkoutOpened, tripIsPaid, verifyMercadoPagoPayment]);

  if (!activeTrip) return null;

  const isPaid =
    activeTrip.status === TRIP_STATUS.PAID ||
    activeTrip.paymentStatus === PAYMENT_STATUS.APPROVED;
  const isCash = activeTrip.paymentMethod === PAYMENT_METHODS.CASH;
  const isRejected = activeTrip.paymentStatus === PAYMENT_STATUS.REJECTED;

  const paymentStatusLabel = isPaid
    ? isCash
      ? 'Efectivo'
      : 'Aprobado'
    : isRejected
    ? 'Rechazado'
    : PAYMENT_STATUS_LABELS[activeTrip.paymentStatus] || 'Pendiente';

  const commissionPercent = Math.round((activeTrip.commissionRate ?? 0.2) * 100);
  const balanceIsNegative = driverBalance < 0;

  const handleOpenCheckoutPro = async () => {
    setOpenError(null);
    const pref = paymentPreference || (await requestMercadoPagoPreference());
    if (!pref) return; // tripError already set by context
    const url = pref.checkoutUrl || pref.initPoint || pref.sandboxInitPoint;
    if (!url) {
      setOpenError('El servidor no devolvió un enlace de Checkout Pro válido.');
      return;
    }
    try {
      await Linking.openURL(url);
      setCheckoutOpened(true);
    } catch (err) {
      console.log('Error opening Checkout Pro URL:', err);
      setOpenError(`No se pudo abrir el navegador para Checkout Pro: ${url}`);
    }
  };

  const visibleError = openError || tripError;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Status */}
      <View style={styles.headerIconContainer}>
        <Ionicons
          name={
            isPaid
              ? 'checkmark-circle'
              : isRejected
              ? 'close-circle'
              : 'time-outline'
          }
          size={64}
          color={
            isPaid
              ? colors.success
              : isRejected
              ? colors.error
              : colors.warning
          }
        />
        <Text style={styles.title}>
          {isPaid
            ? 'Viaje finalizado y pagado'
            : isRejected
            ? 'Pago rechazado'
            : 'Viaje finalizado'}
        </Text>
        <Text style={styles.subtitle}>
          {isPaid
            ? 'El resumen del viaje ya quedó registrado en tu historial.'
            : isCash
            ? 'Cobra el valor indicado en efectivo al pasajero y confirma el recibo.'
            : isRejected
            ? 'El pago con pasarela fue rechazado. Puedes reintentar o cobrar en efectivo.'
            : 'Genera el enlace de Checkout Pro o espera la confirmación del pago del pasajero.'}
        </Text>
      </View>

      {/* Summary Receipt Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Resumen de cobro</Text>
          <View
            style={[
              styles.statusBadge,
              isPaid
                ? styles.badgePaid
                : isRejected
                ? styles.badgeRejected
                : styles.badgePending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isPaid
                  ? styles.badgePaidText
                  : isRejected
                  ? styles.badgeRejectedText
                  : styles.badgePendingText,
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

        {activeTrip.paymentId ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID de pago</Text>
            <Text style={styles.detailValue}>{activeTrip.paymentId}</Text>
          </View>
        ) : null}

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
        ) : (
          <View style={styles.gatewayNotice}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={styles.gatewayNoticeText}>
              Al pagarse por pasarela, tu ganancia neta de {formatCOP(activeTrip.driverEarnings)} se suma automáticamente a tu saldo.
            </Text>
          </View>
        )}
      </View>

      {/* Driver Platform Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.rowBetween}>
          <View style={styles.balanceHeaderLeft}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={styles.balanceTitle}>Saldo en plataforma</Text>
          </View>
          <Text
            style={[
              styles.balanceAmount,
              balanceIsNegative ? styles.balanceNegative : styles.balancePositive,
            ]}
          >
            {formatCOP(driverBalance)}
          </Text>
        </View>
        <Text style={styles.balanceFormula}>
          Pasarela (+{formatCOP(balanceBreakdown.gatewayEarnings)}) − Comisiones efectivo (−
          {formatCOP(balanceBreakdown.cashCommissionsOwed)})
        </Text>
        {balanceIsNegative ? (
          <Text style={styles.balanceNegativeHint}>
            Tienes comisiones pendientes por viajes cobrados en efectivo. Se compensarán con próximos viajes por pasarela.
          </Text>
        ) : null}
      </View>

      {visibleError ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={styles.errorText}>{visibleError}</Text>
        </View>
      ) : null}

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
          <>
            <Pressable
              style={styles.mercadoPagoButton}
              onPress={handleOpenCheckoutPro}
              disabled={tripActionLoading}
            >
              {tripActionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.mercadoPagoButtonText}>
                    {paymentPreference
                      ? 'Abrir Checkout Pro (Mercado Pago)'
                      : 'Cobrar con Mercado Pago (Checkout Pro)'}
                  </Text>
                </>
              )}
            </Pressable>

            {!isRejected && paymentPreference ? (
              <View style={styles.waitingGatewayBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.waitingGatewayText}>
                  {checkoutOpened
                    ? 'Esperando confirmación del pago (webhook + verificación automática)...'
                    : 'Enlace generado. Abre Checkout Pro para que el pasajero pague.'}
                </Text>
              </View>
            ) : null}

            {!paymentPreference && !isRejected ? (
              <Text style={styles.hintText}>
                Presiona el botón para generar el enlace de cobro con Mercado Pago.
              </Text>
            ) : null}

            {paymentCheckMessage ? (
              <Text style={styles.hintText}>{paymentCheckMessage}</Text>
            ) : null}

            {paymentPreference ? (
              <Pressable
                style={styles.secondaryOutlineButton}
                onPress={() => verifyMercadoPagoPayment()}
                disabled={paymentVerifying || tripActionLoading}
              >
                {paymentVerifying ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.secondaryOutlineText}>Verificar estado del pago</Text>
                )}
              </Pressable>
            ) : null}

            <Pressable
              style={styles.secondaryOutlineButton}
              onPress={switchToCashPayment}
              disabled={tripActionLoading}
            >
              <Text style={styles.secondaryOutlineText}>Cambiar a cobro en efectivo</Text>
            </Pressable>
          </>
        ) : null}

        {!isPaid ? (
          <Pressable
            style={styles.cancelPendingButton}
            onPress={() => changeTripStatus(TRIP_STATUS.CANCELLED, { cancelledBy: 'driver' })}
            disabled={tripActionLoading}
          >
            <Text style={styles.cancelPendingText}>Cancelar cobro y volver al mapa</Text>
          </Pressable>
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
    marginBottom: spacing.md,
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
  badgeRejected: {
    backgroundColor: colors.errorLight,
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
  badgeRejectedText: {
    color: colors.error,
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
  gatewayNotice: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  gatewayNoticeText: {
    ...typography.caption,
    color: colors.primaryDark,
    marginLeft: spacing.xs,
    flex: 1,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  balanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceTitle: {
    ...typography.label,
    color: colors.text,
  },
  balanceAmount: {
    ...typography.subtitle,
    fontWeight: '800',
  },
  balancePositive: {
    color: colors.primary,
  },
  balanceNegative: {
    color: colors.error,
  },
  balanceFormula: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  balanceNegativeHint: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
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
  mercadoPagoButton: {
    flexDirection: 'row',
    backgroundColor: '#009EE3',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mercadoPagoButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  secondaryOutlineButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryOutlineText: {
    ...typography.button,
    color: colors.primary,
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
  cancelPendingButton: {
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPendingText: {
    ...typography.label,
    color: colors.error,
  },
});
