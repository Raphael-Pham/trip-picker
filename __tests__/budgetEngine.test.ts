import { describe, it, expect } from 'vitest';
import { allocateBudget, getTripDays } from '../lib/budgetEngine';
import type { DestinationIndex } from '../lib/types';

const makeDestination = (costScore: number): DestinationIndex => ({
  id: 'test',
  city: 'Test City',
  country: 'Testland',
  region: 'North America',
  airportCodes: ['TST'],
  hiddenGem: false,
  tripStyles: ['standard'],
  scores: { cost: costScore, food: 80, photography: 80, activities: 80, weather: 80 },
  budgetRanges: [
    { level: 'budget', minPerDayUSD: 50, maxPerDayUSD: 100 },
    { level: 'mid', minPerDayUSD: 100, maxPerDayUSD: 200 },
    { level: 'luxury', minPerDayUSD: 200, maxPerDayUSD: 500 },
  ],
  unsplashQuery: 'test city',
  summary: 'A test destination.',
});

describe('getTripDays', () => {
  it('counts correctly for a 7-day trip', () => {
    expect(getTripDays('2025-06-01', '2025-06-08')).toBe(7);
  });

  it('returns 1 for same-day (minimum)', () => {
    expect(getTripDays('2025-06-01', '2025-06-01')).toBe(1);
  });

  it('handles month boundaries', () => {
    expect(getTripDays('2025-01-28', '2025-02-04')).toBe(7);
  });

  it('counts a 14-day trip', () => {
    expect(getTripDays('2025-03-01', '2025-03-15')).toBe(14);
  });
});

describe('allocateBudget', () => {
  it('all slices sum to exactly totalBudget', () => {
    const dest = makeDestination(70);
    const alloc = allocateBudget(3000, dest, 7, 500);
    const total = alloc.flights + alloc.hotel + alloc.food + alloc.activities
      + alloc.transportation + alloc.emergencyBuffer;
    expect(total).toBe(3000);
  });

  it('all slices are non-negative', () => {
    const dest = makeDestination(50);
    const alloc = allocateBudget(2000, dest, 7, 400);
    expect(alloc.flights).toBeGreaterThanOrEqual(0);
    expect(alloc.hotel).toBeGreaterThanOrEqual(0);
    expect(alloc.food).toBeGreaterThanOrEqual(0);
    expect(alloc.activities).toBeGreaterThanOrEqual(0);
    expect(alloc.transportation).toBeGreaterThanOrEqual(0);
    expect(alloc.emergencyBuffer).toBeGreaterThanOrEqual(0);
  });

  it('caps flight spend at 35% of total budget', () => {
    const dest = makeDestination(50);
    const budget = 2000;
    const veryExpensiveFlight = 5000; // far exceeds 35%
    const alloc = allocateBudget(budget, dest, 7, veryExpensiveFlight);
    expect(alloc.flights).toBeLessThanOrEqual(budget * 0.35 + 1); // +1 for rounding
    expect(alloc.flightWarning).toBe(true);
  });

  it('sets flightWarning=false when flights are within 35%', () => {
    const dest = makeDestination(50);
    const alloc = allocateBudget(3000, dest, 7, 500); // 500/3000 = 16.7%
    expect(alloc.flightWarning).toBe(false);
  });

  it('expensive destinations (low cost score) get higher hotel allocation', () => {
    const cheapDest = makeDestination(70);   // affordable — lower hotel%
    const priceyDest = makeDestination(25);  // expensive — higher hotel%
    const allocCheap  = allocateBudget(5000, cheapDest,  7, 700);
    const allocPricey = allocateBudget(5000, priceyDest, 7, 700);
    expect(allocPricey.hotel).toBeGreaterThan(allocCheap.hotel);
  });

  it('tripDays is stored in allocation', () => {
    const dest = makeDestination(60);
    const alloc = allocateBudget(3000, dest, 10, 500);
    expect(alloc.totalDays).toBe(10);
  });

  it('handles zero flight cost gracefully', () => {
    const dest = makeDestination(60);
    const alloc = allocateBudget(2000, dest, 7, 0);
    const total = alloc.flights + alloc.hotel + alloc.food + alloc.activities
      + alloc.transportation + alloc.emergencyBuffer;
    expect(total).toBe(2000);
    expect(alloc.flights).toBe(0);
    expect(alloc.flightWarning).toBe(false);
  });

  it('handles very small budget gracefully', () => {
    const dest = makeDestination(80);
    const alloc = allocateBudget(100, dest, 7, 50);
    const total = alloc.flights + alloc.hotel + alloc.food + alloc.activities
      + alloc.transportation + alloc.emergencyBuffer;
    expect(total).toBe(100);
  });
});
