import { useMemo } from 'react';
import { PAYMENT_METHODS, PAYMENT_STATUS, TRIP_STATUS } from '../constants/tripStatus.js';
import { calculateDriverBalance } from '../utils/calculateDriverBalance.js';

export const EARNINGS_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  ALL: 'all',
};

export const EARNINGS_PERIOD_LABELS = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  all: 'Total',
};

export const resolveTripDate = (trip) => {
  const raw = trip?.paidAt || trip?.completedAt || trip?.createdAt;
  if (!raw) return null;
  if (typeof raw.toDate === 'function') return raw.toDate();
  if (typeof raw.seconds === 'number') return new Date(raw.seconds * 1000);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isDateInPeriod = (date, period, customRange = null) => {
  if (!date) return period === EARNINGS_PERIODS.ALL;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === EARNINGS_PERIODS.TODAY) {
    return date >= startOfToday;
  }

  if (period === EARNINGS_PERIODS.WEEK) {
    const dayOfWeek = startOfToday.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - diffToMonday);
    return date >= startOfWeek;
  }

  if (period === EARNINGS_PERIODS.MONTH) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= startOfMonth;
  }

  if (period === 'range' && customRange?.startDate && customRange?.endDate) {
    const start = new Date(`${customRange.startDate}T00:00:00`);
    const end = new Date(`${customRange.endDate}T23:59:59`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
    return date >= start && date <= end;
  }

  return true;
};

const computeMetrics = (tripsList) => {
  let tripCount = 0;
  let grossBilled = 0;
  let totalCommissions = 0;
  let totalTips = 0;
  let netEarnings = 0;
  let cashCount = 0;
  let gatewayCount = 0;

  for (const trip of tripsList) {
    const isCompletedOrPaid =
      trip.status === TRIP_STATUS.PAID ||
      trip.status === TRIP_STATUS.COMPLETED ||
      trip.paymentStatus === PAYMENT_STATUS.APPROVED;

    if (!isCompletedOrPaid) continue;

    const fare = Number(trip.fare) || 0;
    const commission = Number(trip.commission) || Math.round(fare * 0.2);
    const tip = Number(trip.tip) || 0;
    const net =
      trip.driverEarnings !== undefined
        ? Number(trip.driverEarnings)
        : Math.max(0, fare - commission) + tip;

    tripCount += 1;
    grossBilled += fare;
    totalCommissions += commission;
    totalTips += tip;
    netEarnings += net;

    if (trip.paymentMethod === PAYMENT_METHODS.CASH) {
      cashCount += 1;
    } else {
      gatewayCount += 1;
    }
  }

  const averagePerTrip = tripCount > 0 ? Math.round(netEarnings / tripCount) : 0;
  const balanceInfo = calculateDriverBalance(tripsList);

  return {
    tripCount,
    grossBilled: Math.round(grossBilled),
    totalCommissions: Math.round(totalCommissions),
    totalTips: Math.round(totalTips),
    netEarnings: Math.round(netEarnings),
    averagePerTrip,
    cashCount,
    gatewayCount,
    platformBalance: balanceInfo.balance,
    gatewayEarnings: balanceInfo.gatewayEarnings,
    cashCommissionsOwed: balanceInfo.cashCommissionsOwed,
  };
};

export default function useEarnings(trips = [], selectedPeriod = EARNINGS_PERIODS.TODAY) {
  return useMemo(() => {
    const safeTrips = Array.isArray(trips) ? trips : [];

    const byPeriod = {
      today: safeTrips.filter((t) => isDateInPeriod(resolveTripDate(t), EARNINGS_PERIODS.TODAY)),
      week: safeTrips.filter((t) => isDateInPeriod(resolveTripDate(t), EARNINGS_PERIODS.WEEK)),
      month: safeTrips.filter((t) => isDateInPeriod(resolveTripDate(t), EARNINGS_PERIODS.MONTH)),
      all: safeTrips,
    };

    const activeTripsList = byPeriod[selectedPeriod] || safeTrips;
    const current = computeMetrics(activeTripsList);
    const overallBalance = calculateDriverBalance(safeTrips);

    return {
      ...current,
      filteredTrips: activeTripsList,
      overallPlatformBalance: overallBalance.balance,
      overallGatewayEarnings: overallBalance.gatewayEarnings,
      overallCashCommissionsOwed: overallBalance.cashCommissionsOwed,
      summaries: {
        today: computeMetrics(byPeriod.today),
        week: computeMetrics(byPeriod.week),
        month: computeMetrics(byPeriod.month),
        all: computeMetrics(byPeriod.all),
      },
    };
  }, [trips, selectedPeriod]);
}

