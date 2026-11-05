export const PRICING_CONFIG = {
  baseFare: 3500,
  perKmRate: 1200,
  perMinRate: 250,
  minFare: 6000,
  categoryMultipliers: {
    economy: 1.0,
    xl: 1.4,
    premium: 1.8,
  },
  commissionRate: 0.2, // 20%
};

export const PLATFORM_COMMISSION_RATE = PRICING_CONFIG.commissionRate;
export const PLATFORM_COMMISSION_PERCENT = Math.round(PLATFORM_COMMISSION_RATE * 100);

