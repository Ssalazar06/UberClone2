
import { PRICING_CONFIG } from '../config/pricing.js';

/**
 * @param {Object} params
 * @param {number} params.distanceKm
 * @param {number} params.durationMin
 * @param {string} params.category - 'economy' | 'xl' | 'premium'
 * @param {number} [params.tip=0]
 * @param {number} [params.commissionRate] - Override commission if needed (defaults to PRICING_CONFIG.commissionRate)
 * @returns {{ fare: number, commission: number, driverEarnings: number, commissionRate: number }}
 */
export const calculateFare = ({
  distanceKm = 0,
  durationMin = 0,
  category = 'economy',
  tip = 0,
  commissionRate = PRICING_CONFIG.commissionRate,
}) => {
  const multiplier = PRICING_CONFIG.categoryMultipliers[category] ?? 1.0;

  const rawSum =
    PRICING_CONFIG.baseFare +
    distanceKm * PRICING_CONFIG.perKmRate +
    durationMin * PRICING_CONFIG.perMinRate;

  const rawFareWithMultiplier = rawSum * multiplier;

  // Apply minFare if lower than minimum
  const effectiveFare = Math.max(rawFareWithMultiplier, PRICING_CONFIG.minFare);

  // Round to nearest 100 COP
  const fare = Math.round(effectiveFare / 100) * 100;

  // Commission is calculated on the rounded fare
  const commission = Math.round(fare * commissionRate);

  // Driver earnings = fare - commission + 100% tip
  const validTip = Math.max(0, Math.round(tip));
  const driverEarnings = fare - commission + validTip;

  return {
    fare,
    commission,
    driverEarnings,
    commissionRate,
  };
};

