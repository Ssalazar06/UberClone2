// AI-assisted: see docs/AI_LOG.md #5

import { PAYMENT_METHODS, PAYMENT_STATUS, TRIP_STATUS } from '../constants/tripStatus.js';

/**
 * Pure function that calculates the driver's platform balance from completed/paid trips.
 *
 * Rule from specification:
 * Driver balance = (gateway trip net earnings) - (cash trip platform commissions).
 * Can be negative if the driver has accumulated unpaid cash commissions.
 *
 * @param {Array<Object>} trips
 * @returns {{
 *   balance: number,
 *   gatewayEarnings: number,
 *   cashCommissionsOwed: number,
 *   cashNetEarnings: number,
 *   totalNetEarnings: number,
 *   paidTripsCount: number,
 *   gatewayTripsCount: number,
 *   cashTripsCount: number,
 * }}
 */
export const calculateDriverBalance = (trips = []) => {
  if (!Array.isArray(trips) || trips.length === 0) {
    return {
      balance: 0,
      gatewayEarnings: 0,
      cashCommissionsOwed: 0,
      cashNetEarnings: 0,
      totalNetEarnings: 0,
      paidTripsCount: 0,
      gatewayTripsCount: 0,
      cashTripsCount: 0,
    };
  }

  let gatewayEarnings = 0;
  let cashCommissionsOwed = 0;
  let cashNetEarnings = 0;
  let totalNetEarnings = 0;
  let paidTripsCount = 0;
  let gatewayTripsCount = 0;
  let cashTripsCount = 0;

  for (const trip of trips) {
    const isPaid =
      trip?.status === TRIP_STATUS.PAID || trip?.paymentStatus === PAYMENT_STATUS.APPROVED;
    if (!isPaid) continue;

    const fare = Math.round(Number(trip.fare) || 0);
    const commission = Math.round(Number(trip.commission) || 0);
    const tip = Math.max(0, Math.round(Number(trip.tip) || 0));
    const driverEarnings =
      trip.driverEarnings !== undefined && trip.driverEarnings !== null
        ? Math.round(Number(trip.driverEarnings) || 0)
        : fare - commission + tip;

    paidTripsCount += 1;
    totalNetEarnings += driverEarnings;

    if (trip.paymentMethod === PAYMENT_METHODS.CASH) {
      cashTripsCount += 1;
      cashCommissionsOwed += commission;
      cashNetEarnings += driverEarnings;
    } else {
      gatewayTripsCount += 1;
      gatewayEarnings += driverEarnings;
    }
  }

  const balance = gatewayEarnings - cashCommissionsOwed;

  return {
    balance,
    gatewayEarnings,
    cashCommissionsOwed,
    cashNetEarnings,
    totalNetEarnings,
    paidTripsCount,
    gatewayTripsCount,
    cashTripsCount,
  };
};

