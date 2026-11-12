import React, { useCallback, useState } from 'react';
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
import useDriverRegistration from '../../hooks/useDriverRegistration.js';
import useEarnings, {
  EARNINGS_PERIOD_LABELS,
  EARNINGS_PERIODS,
} from '../../hooks/useEarnings.js';
import { seedDemoDriverTrips } from '../../services/tripService.js';
import { formatCOP } from '../../utils/routeUtils.js';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

const PERIOD_OPTIONS = [
  EARNINGS_PERIODS.TODAY,
  EARNINGS_PERIODS.WEEK,
  EARNINGS_PERIODS.MONTH,
  EARNINGS_PERIODS.ALL,
];

export default function EarningsScreen() {
  const { paidTrips } = useActiveTrip();
  const { driverId } = useDriverRegistration();
  const [selectedPeriod, setSelectedPeriod] = useState(EARNINGS_PERIODS.TODAY);
  const [seeding, setSeeding] = useState(false);

  const earnings = useEarnings(paidTrips, selectedPeriod);
  const balanceIsNegative = earnings.overallPlatformBalance < 0;

  const handleSeed = useCallback(async () => {
    if (!driverId || seeding) return;
    setSeeding(true);
    try {
      await seedDemoDriverTrips(driverId, 12);
    } finally {
      setSeeding(false);
    }
  }, [driverId, seeding]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.periodTabs}>
        {PERIOD_OPTIONS.map((period) => {
          const active = selectedPeriod === period;
          return (
            <Pressable
              key={period}
              style={[styles.periodTab, active && styles.periodTabActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodTabText, active && styles.periodTabTextActive]}>
                {EARNINGS_PERIOD_LABELS[period]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>
          Ganancia neta ({EARNINGS_PERIOD_LABELS[selectedPeriod]})
        </Text>
        <Text style={styles.heroAmount}>{formatCOP(earnings.netEarnings)}</Text>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{earnings.tripCount}</Text>
            <Text style={styles.heroStatCaption}>Carreras</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{formatCOP(earnings.averagePerTrip)}</Text>
            <Text style={styles.heroStatCaption}>Promedio / viaje</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickSummaryRow}>
        <View style={styles.quickSummaryCard}>
          <Text style={styles.quickSummaryLabel}>Hoy</Text>
          <Text style={styles.quickSummaryAmount}>
            {formatCOP(earnings.summaries.today.netEarnings)}
          </Text>
          <Text style={styles.quickSummarySub}>
            {earnings.summaries.today.tripCount} viajes
          </Text>
        </View>
        <View style={styles.quickSummaryCard}>
          <Text style={styles.quickSummaryLabel}>Semana</Text>
          <Text style={styles.quickSummaryAmount}>
            {formatCOP(earnings.summaries.week.netEarnings)}
          </Text>
          <Text style={styles.quickSummarySub}>
            {earnings.summaries.week.tripCount} viajes
          </Text>
        </View>
        <View style={styles.quickSummaryCard}>
          <Text style={styles.quickSummaryLabel}>Mes</Text>
          <Text style={styles.quickSummaryAmount}>
            {formatCOP(earnings.summaries.month.netEarnings)}
          </Text>
          <Text style={styles.quickSummarySub}>
            {earnings.summaries.month.tripCount} viajes
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Saldo acumulado en plataforma</Text>
          </View>
          <Text
            style={[
              styles.balanceValue,
              balanceIsNegative ? styles.negativeText : styles.positiveText,
            ]}
          >
            {formatCOP(earnings.overallPlatformBalance)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ganancias por Mercado Pago</Text>
          <Text style={[styles.detailValue, styles.positiveText]}>
            + {formatCOP(earnings.overallGatewayEarnings)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Comisiones de viajes en efectivo</Text>
          <Text style={[styles.detailValue, styles.negativeText]}>
            - {formatCOP(earnings.overallCashCommissionsOwed)}
          </Text>
        </View>

        {balanceIsNegative ? (
          <View style={styles.warningNotice}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.warningNoticeText}>
              Tu saldo es negativo porque has cobrado viajes en efectivo. Se descontará automáticamente de tus próximos viajes con Mercado Pago.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Desglose del período ({EARNINGS_PERIOD_LABELS[selectedPeriod]})
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total facturado (tarifa bruta)</Text>
          <Text style={styles.detailValue}>{formatCOP(earnings.grossBilled)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Comisiones descontadas (20%)</Text>
          <Text style={[styles.detailValue, styles.negativeText]}>
            - {formatCOP(earnings.totalCommissions)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Propinas recibidas (100% tuyas)</Text>
          <Text style={[styles.detailValue, styles.positiveText]}>
            + {formatCOP(earnings.totalTips)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Carreras en efectivo</Text>
          <Text style={styles.detailValue}>{earnings.cashCount}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Carreras por Mercado Pago</Text>
          <Text style={styles.detailValue}>{earnings.gatewayCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Ganancia neta</Text>
          <Text style={styles.totalValue}>{formatCOP(earnings.netEarnings)}</Text>
        </View>
      </View>

      {paidTrips.length === 0 ? (
        <Pressable
          style={styles.seedButton}
          onPress={handleSeed}
          disabled={seeding}
        >
          {seeding ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={18} color={colors.primaryText} />
              <Text style={styles.seedButtonText}>
                Cargar viajes de demostración (12 carreras)
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
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
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    color: colors.primaryText,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  heroLabel: {
    ...typography.label,
    color: '#D8F3E0',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primaryText,
    marginVertical: spacing.xs,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroStatValue: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primaryText,
  },
  heroStatCaption: {
    ...typography.caption,
    color: '#D8F3E0',
  },
  quickSummaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickSummaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickSummaryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickSummaryAmount: {
    ...typography.label,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  quickSummarySub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  balanceValue: {
    ...typography.subtitle,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  positiveText: {
    color: colors.success,
  },
  negativeText: {
    color: colors.error,
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  warningNoticeText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
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
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  seedButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
});

