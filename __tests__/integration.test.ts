/**
 * Integration test: traces the full cost pipeline with a realistic $3000 budget.
 * Catches regressions where flight/hotel/food numbers look obviously wrong.
 */
import { describe, it, expect } from 'vitest';
import { estimateFlightCost } from '../lib/flightEstimator';
import { allocateBudget, getTripDays } from '../lib/budgetEngine';
import type { DestinationIndex } from '../lib/types';

const BUDGET = 3000;
const TRIP_DAYS = 7;
const DEP = 'JFK';

const dest = (costScore: number): DestinationIndex => ({
  id: 'test', city: 'Test', country: 'TC', region: 'North America',
  airportCodes: [], hiddenGem: false, tripStyles: ['standard'],
  scores: { cost: costScore, food: 70, photography: 70, activities: 70, weather: 70 },
  budgetRanges: [
    { level: 'budget', minPerDayUSD: 50, maxPerDayUSD: 100 },
    { level: 'mid',    minPerDayUSD: 100, maxPerDayUSD: 200 },
    { level: 'luxury', minPerDayUSD: 200, maxPerDayUSD: 500 },
  ],
  unsplashQuery: '', summary: '',
});

interface CostRow {
  city: string;
  codes: string[];
  costScore: number;
}

const CASES: CostRow[] = [
  { city: 'Domestic US (LAX)',  codes: ['LAX'],        costScore: 65 },
  { city: 'Cancun',             codes: ['CUN'],        costScore: 70 },
  { city: 'London',             codes: ['LHR', 'LGW'], costScore: 35 },
  { city: 'Hanoi',              codes: ['HAN', 'SGN'], costScore: 90 },
  { city: 'Tokyo',              codes: ['NRT', 'HND'], costScore: 55 },
  { city: 'Bali',               codes: ['DPS'],        costScore: 80 },
  { city: 'Queenstown NZ',      codes: ['ZQN'],        costScore: 50 },
  { city: 'Cape Town',          codes: ['CPT'],        costScore: 55 },
  { city: 'Zanzibar',           codes: ['ZNZ'],        costScore: 75 },
  { city: 'Maldives',           codes: ['MLE'],        costScore: 15 },
];

describe('Full cost pipeline — $3000 budget, JFK, 7 days', () => {
  for (const c of CASES) {
    it(`${c.city}: realistic flight, hotel, food, activities`, () => {
      const flight = estimateFlightCost(DEP, c.codes, TRIP_DAYS);
      const alloc  = allocateBudget(BUDGET, dest(c.costScore), TRIP_DAYS, flight);
      const hotelPerNight = Math.round(alloc.hotel / TRIP_DAYS);
      const foodPerDay    = Math.round(alloc.food  / TRIP_DAYS);
      const total = alloc.flights + alloc.hotel + alloc.food
        + alloc.activities + alloc.transportation + alloc.emergencyBuffer;

      // Allocation must sum to budget
      expect(total).toBe(BUDGET);

      // Flight must be at least domestic (>$200) and not ludicrous (>$2000)
      expect(flight).toBeGreaterThan(200);
      expect(flight).toBeLessThan(2000);

      // Non-domestic destinations must cost more than domestic ($270)
      if (!['LAX'].includes(c.codes[0])) {
        // Caribbean/Mexico should be more expensive than pure domestic,
        // and intercontinental should be significantly more
        if (['LHR', 'LGW', 'HAN', 'SGN', 'NRT', 'HND', 'DPS', 'ZQN', 'CPT', 'ZNZ', 'MLE'].includes(c.codes[0])) {
          expect(flight).toBeGreaterThan(500);
        }
      }

      // With $3000 budget, hotel/night should be meaningful (>$30) for a 7-day trip
      // Even if flights eat into it, remaining should yield decent per-night
      expect(hotelPerNight).toBeGreaterThan(30);

      // Food per day should be meaningful (>$20)
      expect(foodPerDay).toBeGreaterThan(20);

      // Activities should cover at least some spending (>$50 total)
      expect(alloc.activities).toBeGreaterThan(50);
    });
  }

  it('getTripDays parses URL date strings correctly', () => {
    expect(getTripDays('2025-08-01', '2025-08-08')).toBe(7);
    expect(getTripDays('2025-12-20', '2026-01-03')).toBe(14);
  });

  it('$500 budget yields noticeably smaller hotel/food than $3000 budget', () => {
    const flight = estimateFlightCost(DEP, ['LAX'], TRIP_DAYS);
    const allocSmall = allocateBudget(500,  dest(65), TRIP_DAYS, flight);
    const allocLarge = allocateBudget(3000, dest(65), TRIP_DAYS, flight);
    expect(Math.round(allocLarge.hotel / TRIP_DAYS)).toBeGreaterThan(
      Math.round(allocSmall.hotel / TRIP_DAYS) + 50,
    );
  });
});
