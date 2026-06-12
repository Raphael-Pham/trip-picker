import type { BudgetAllocation, DestinationIndex } from './types';

export function allocateBudget(
  totalBudget: number,
  destination: DestinationIndex,
  tripDays: number,
  estimatedFlightCost: number,
): BudgetAllocation {
  const maxFlights = totalBudget * 0.35;
  const flights = Math.min(estimatedFlightCost, maxFlights);
  const flightWarning = estimatedFlightCost > maxFlights;

  const remaining = Math.max(totalBudget - flights, 0);

  // Adjust hotel allocation based on cost score (lower cost score = pricier destination)
  const costScore = destination.scores.cost;
  const hotelMultiplier = costScore < 40 ? 0.44 : costScore < 60 ? 0.38 : 0.32;
  const activitiesMultiplier = costScore < 40 ? 0.14 : 0.18;

  const hotel = Math.round(remaining * hotelMultiplier);
  const food = Math.round(remaining * 0.22);
  const activities = Math.round(remaining * activitiesMultiplier);
  const transportation = Math.round(remaining * 0.10);
  // Emergency buffer gets the remainder to ensure exact sum
  const emergencyBuffer = remaining - hotel - food - activities - transportation;

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
