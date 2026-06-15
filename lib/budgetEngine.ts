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
    // Static proportional split (original logic)
    const costScore = destination.scores.cost;
    const hotelMultiplier = costScore < 40 ? 0.44 : costScore < 60 ? 0.38 : 0.32;
    const activitiesMultiplier = costScore < 40 ? 0.14 : 0.18;
    hotel = Math.round(remaining * hotelMultiplier);
    food = Math.round(remaining * 0.22);
    activities = Math.round(remaining * activitiesMultiplier);
    transportation = Math.round(remaining * 0.10);
    emergencyBuffer = remaining - hotel - food - activities - transportation;
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
