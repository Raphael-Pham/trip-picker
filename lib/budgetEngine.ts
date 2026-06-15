import type { BudgetAllocation, DestinationIndex, LiveCityData } from './types';

export function allocateBudget(
  totalBudget: number,
  destination: DestinationIndex,
  tripDays: number,
  estimatedFlightCost: number,
  live?: Pick<LiveCityData, 'hotelPerNightUSD' | 'foodPerDayUSD'>,
): BudgetAllocation {
  const maxFlights = totalBudget * 0.35;
  const flights = Math.min(estimatedFlightCost, maxFlights);
  const flightWarning = estimatedFlightCost > maxFlights;

  const remaining = Math.max(totalBudget - flights, 0);

  let hotel: number;
  let food: number;
  let activities: number;
  let transportation: number;
  let emergencyBuffer: number;

  if (live?.hotelPerNightUSD || live?.foodPerDayUSD) {
    // Use live prices where available; fall back to proportional split for missing items
    hotel = live.hotelPerNightUSD
      ? Math.min(Math.round(live.hotelPerNightUSD * tripDays), Math.round(remaining * 0.55))
      : Math.round(remaining * 0.38);
    food = live.foodPerDayUSD
      ? Math.min(Math.round(live.foodPerDayUSD * tripDays), Math.round(remaining * 0.35))
      : Math.round(remaining * 0.22);
    const discretionary = Math.max(remaining - hotel - food, 0);
    activities = Math.round(discretionary * 0.50);
    transportation = Math.round(discretionary * 0.28);
    emergencyBuffer = discretionary - activities - transportation;
  } else {
    // Derive per-city estimates from the destination's budgetRanges,
    // which carry real USD amounts (e.g. Maldives mid: $400-800/day vs Hanoi $60-120/day).
    const perDay = remaining / Math.max(tripDays, 1);
    const sorted = [...destination.budgetRanges].sort((a, b) => a.minPerDayUSD - b.minPerDayUSD);
    // Pick the tier whose floor the user's remaining per-day budget can cover
    let tier = sorted[0];
    for (const range of sorted) {
      if (perDay >= range.minPerDayUSD * 0.8) tier = range;
    }
    const midpoint = (tier.minPerDayUSD + tier.maxPerDayUSD) / 2;
    // Hotels ≈ 45% of all-in daily cost, food ≈ 22%
    const hotelPerNight = Math.round(midpoint * 0.45);
    const foodPerDay = Math.round(midpoint * 0.22);
    hotel = Math.min(hotelPerNight * tripDays, Math.round(remaining * 0.55));
    food = Math.min(foodPerDay * tripDays, Math.round(remaining * 0.35));
    const discretionary = Math.max(remaining - hotel - food, 0);
    activities = Math.round(discretionary * 0.50);
    transportation = Math.round(discretionary * 0.28);
    emergencyBuffer = discretionary - activities - transportation;
  }

  return {
    flights: Math.round(flights),
    hotel,
    food,
    activities,
    transportation,
    emergencyBuffer: Math.max(0, emergencyBuffer),
    totalDays: tripDays,
    flightWarning,
  };
}

export function getTripDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}
