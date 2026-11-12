import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useDriverRegistration from '../../hooks/useDriverRegistration.js';
import { getDriverTripsPage, seedDemoDriverTrips } from '../../services/tripService.js';
import { isDateInPeriod, resolveTripDate } from '../../hooks/useEarnings.js';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  TRIP_STATUS,
  TRIP_STATUS_LABELS,
} from '../../constants/tripStatus.js';
import { VEHICLE_CATEGORY_OPTIONS, getOptionLabel } from '../../data/registrationOptions.js';
import { formatCOP } from '../../utils/routeUtils.js';
import DatePickerField from '../../components/registration/DatePickerField.jsx';
import { colors, radius, shadows, spacing, typography } from '../../theme/index.js';

const PAGE_SIZE = 20;

const PERIOD_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'range', label: 'Rango' },
];

const PAYMENT_FILTERS = [
  { key: 'all', label: 'Todos los pagos' },
  { key: PAYMENT_METHODS.CASH, label: 'Efectivo' },
  { key: PAYMENT_METHODS.MERCADO_PAGO, label: 'Mercado Pago' },
];

const formatTripDate = (trip) => {
  const date = resolveTripDate(trip);
  if (!date) return 'Fecha reciente';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistoryScreen({ navigation }) {
  const { driverId } = useDriverRegistration();

  const [trips, setTrips] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [periodFilter, setPeriodFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });

  const loadInitialPage = useCallback(async () => {
    if (!driverId) {
      setTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const page = await getDriverTripsPage(driverId, { pageSize: PAGE_SIZE });
      setTrips(page.trips);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } catch (error) {
      console.log('Error loading trip history:', error);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadInitialPage();
  }, [loadInitialPage]);

  const handleRefresh = useCallback(async () => {
    if (!driverId) return;
    setRefreshing(true);
    try {
      const page = await getDriverTripsPage(driverId, { pageSize: PAGE_SIZE });
      setTrips(page.trips);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } finally {
      setRefreshing(false);
    }
  }, [driverId]);

  const handleLoadMore = useCallback(async () => {
    if (!driverId || !hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await getDriverTripsPage(driverId, {
        pageSize: PAGE_SIZE,
        lastDoc,
        offset: nextOffset,
      });
      setTrips((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNew = page.trips.filter((item) => !existingIds.has(item.id));
        return [...prev, ...uniqueNew];
      });
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } finally {
      setLoadingMore(false);
    }
  }, [driverId, hasMore, loadingMore, loading, lastDoc, nextOffset]);

  const handleSeedHistory = useCallback(async () => {
    if (!driverId || seeding) return;
    setSeeding(true);
    try {
      await seedDemoDriverTrips(driverId, 12);
      await loadInitialPage();
    } finally {
      setSeeding(false);
    }
  }, [driverId, seeding, loadInitialPage]);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (paymentFilter !== 'all' && trip.paymentMethod !== paymentFilter) {
        return false;
      }
      const date = resolveTripDate(trip);
      return isDateInPeriod(date, periodFilter, customRange);
    });
  }, [trips, paymentFilter, periodFilter, customRange]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderTripItem = useCallback(
    ({ item }) => {
      const isPaid =
        item.status === TRIP_STATUS.PAID || item.paymentStatus === PAYMENT_STATUS.APPROVED;
      const isCancelled =
        item.status === TRIP_STATUS.CANCELLED || item.status === TRIP_STATUS.REJECTED;
      const categoryLabel =
        getOptionLabel(VEHICLE_CATEGORY_OPTIONS, item.category) || 'Económico';
      const paymentLabel = PAYMENT_METHOD_LABELS[item.paymentMethod] || 'Efectivo';

      return (
        <Pressable
          style={styles.tripCard}
          onPress={() => navigation.navigate('TripDetail', { trip: item })}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.dateText}>{formatTripDate(item)}</Text>
            <View
              style={[
                styles.statusBadge,
                isPaid
                  ? styles.badgePaid
                  : isCancelled
                  ? styles.badgeCancelled
                  : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isPaid
                    ? styles.badgePaidText
                    : isCancelled
                    ? styles.badgeCancelledText
                    : styles.badgePendingText,
                ]}
              >
                {TRIP_STATUS_LABELS[item.status] || 'Finalizado'}
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <Ionicons name="radio-button-on" size={16} color={colors.success} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.origin?.name || item.origin?.address || 'Punto de recogida'}
              </Text>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="location" size={16} color={colors.error} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.destination?.name || item.destination?.address || 'Destino'}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooterRow}>
            <View style={styles.metaChips}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{categoryLabel}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{paymentLabel}</Text>
              </View>
              {item.rating ? (
                <View style={styles.ratingChip}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.earningsColumn}>
              <Text style={styles.earningsLabel}>Ganancia neta</Text>
              <Text style={styles.earningsValue}>
                {formatCOP(item.driverEarnings ?? item.fare ?? 0)}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {PERIOD_FILTERS.map((filter) => {
            const active = periodFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setPeriodFilter(filter.key)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {periodFilter === 'range' ? (
          <View style={styles.rangePickerRow}>
            <View style={styles.rangeField}>
              <DatePickerField
                label="Desde"
                value={customRange.startDate}
                onChange={(dateStr) =>
                  setCustomRange((prev) => ({ ...prev, startDate: dateStr }))
                }
                maximumDate={new Date()}
              />
            </View>
            <View style={styles.rangeField}>
              <DatePickerField
                label="Hasta"
                value={customRange.endDate}
                onChange={(dateStr) =>
                  setCustomRange((prev) => ({ ...prev, endDate: dateStr }))
                }
                maximumDate={new Date()}
              />
            </View>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {PAYMENT_FILTERS.map((filter) => {
            const active = paymentFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                style={[styles.subFilterPill, active && styles.subFilterPillActive]}
                onPress={() => setPaymentFilter(filter.key)}
              >
                <Text
                  style={[styles.subFilterPillText, active && styles.subFilterPillTextActive]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptySubtitle}>Cargando historial de carreras...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={keyExtractor}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin carreras en este filtro</Text>
              <Text style={styles.emptySubtitle}>
                No encontramos viajes registrados para el período o método de pago seleccionado.
              </Text>
              {trips.length === 0 ? (
                <Pressable
                  style={styles.seedButton}
                  onPress={handleSeedHistory}
                  disabled={seeding}
                >
                  {seeding ? (
                    <ActivityIndicator color={colors.primaryText} />
                  ) : (
                    <>
                      <Ionicons name="sparkles-outline" size={18} color={colors.primaryText} />
                      <Text style={styles.seedButtonText}>
                        Generar historial de prueba (12 viajes)
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  filterPillsRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.primaryText,
  },
  subFilterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subFilterPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  subFilterPillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subFilterPillTextActive: {
    color: colors.primary,
  },
  rangePickerRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rangeField: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgePaid: {
    backgroundColor: colors.successLight,
  },
  badgeCancelled: {
    backgroundColor: colors.errorLight,
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
  badgeCancelledText: {
    color: colors.error,
  },
  badgePendingText: {
    color: colors.warning,
  },
  routeContainer: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  metaChip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  metaChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  ratingText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#B45309',
  },
  earningsColumn: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  earningsValue: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.primary,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  seedButtonText: {
    ...typography.button,
    color: colors.primaryText,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

