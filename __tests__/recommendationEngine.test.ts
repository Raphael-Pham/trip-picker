import { describe, it, expect } from 'vitest';
import { scoreDestinations } from '../lib/recommendationEngine';
import type { DestinationIndex, SearchParams } from '../lib/types';

const makeParams = (overrides: Partial<SearchParams> = {}): SearchParams => ({
  departureAirport: 'JFK',
  startDate: '2025-08-01',
  endDate: '2025-08-08',
  budget: 5000,
  travelMode: 'standard',
  weights: { cost: 20, food: 20, photography: 20, activities: 20, weather: 20 },
  groupMode: false,
  ...overrides,
});

const makeDestination = (
  id: string,
  scores: { cost: number; food: number; photography: number; activities: number; weather: number },
  overrides: Partial<DestinationIndex> = {},
): DestinationIndex => ({
  id,
  city: id,
  country: 'Testland',
  region: 'North America',
  airportCodes: ['JFK'],
  hiddenGem: false,
  tripStyles: ['standard'],
  scores,
  budgetRanges: [
    { level: 'budget', minPerDayUSD: 50, maxPerDayUSD: 100 },
    { level: 'mid',    minPerDayUSD: 100, maxPerDayUSD: 200 },
    { level: 'luxury', minPerDayUSD: 200, maxPerDayUSD: 500 },
  ],
  unsplashQuery: 'test',
  summary: 'Test.',
  ...overrides,
});

const HIGH  = { cost: 90, food: 90, photography: 90, activities: 90, weather: 90 };
const MED   = { cost: 60, food: 60, photography: 60, activities: 60, weather: 60 };
const LOW   = { cost: 30, food: 30, photography: 30, activities: 30, weather: 30 };

describe('scoreDestinations', () => {
  it('returns at most 10 results', () => {
    const catalog = Array.from({ length: 30 }, (_, i) =>
      makeDestination(`dest-${i}`, MED),
    );
    const results = scoreDestinations(catalog, makeParams(), 7);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('ranks higher-scoring destination above lower-scoring one (with jitter margin)', () => {
    const catalog = [
      makeDestination('high', HIGH),
      makeDestination('low',  LOW),
    ];
    // Run 10 times — high should beat low every time despite jitter (gap is 60 pts)
    for (let i = 0; i < 10; i++) {
      const results = scoreDestinations(catalog, makeParams(), 7);
      expect(results[0].id).toBe('high');
    }
  });

  it('overallScore is between 0 and 100', () => {
    const catalog = [makeDestination('a', HIGH), makeDestination('b', LOW)];
    const results = scoreDestinations(catalog, makeParams(), 7);
    for (const r of results) {
      expect(r.overallScore).toBeGreaterThanOrEqual(0);
      expect(r.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it('mode=photography boosts photography score', () => {
    const dest = makeDestination('photo', { cost: 60, food: 60, photography: 70, activities: 60, weather: 60 });
    const base    = scoreDestinations([dest], makeParams({ travelMode: 'standard' }), 7);
    const photoMode = scoreDestinations([dest], makeParams({ travelMode: 'photography' }), 7);
    expect(photoMode[0].adjustedScores.photography).toBeGreaterThanOrEqual(
      base[0].adjustedScores.photography,
    );
  });

  it('mode=foodie boosts food score', () => {
    const dest = makeDestination('food', { cost: 60, food: 70, photography: 60, activities: 60, weather: 60 });
    const base     = scoreDestinations([dest], makeParams({ travelMode: 'standard' }), 7);
    const foodMode = scoreDestinations([dest], makeParams({ travelMode: 'foodie' }), 7);
    expect(foodMode[0].adjustedScores.food).toBeGreaterThanOrEqual(
      base[0].adjustedScores.food,
    );
  });

  it('mode=adventure boosts activities score', () => {
    const dest = makeDestination('adv', { cost: 60, food: 60, photography: 60, activities: 70, weather: 60 });
    const base       = scoreDestinations([dest], makeParams({ travelMode: 'standard' }), 7);
    const advMode    = scoreDestinations([dest], makeParams({ travelMode: 'adventure' }), 7);
    expect(advMode[0].adjustedScores.activities).toBeGreaterThanOrEqual(
      base[0].adjustedScores.activities,
    );
  });

  it('mode=hidden-gems filters out non-hidden-gem destinations', () => {
    const catalog = [
      makeDestination('gem',    MED, { hiddenGem: true }),
      makeDestination('normal', HIGH, { hiddenGem: false }),
    ];
    const results = scoreDestinations(catalog, makeParams({ travelMode: 'hidden-gems' }), 7);
    expect(results.every(r => r.id === 'gem')).toBe(true);
  });

  it('weights affect ranking — cost-heavy weights favour cheap destinations', () => {
    const cheap     = makeDestination('cheap',     { cost: 95, food: 50, photography: 50, activities: 50, weather: 50 });
    const expensive = makeDestination('expensive', { cost: 10, food: 90, photography: 90, activities: 90, weather: 90 });

    const costWeights = makeParams({
      weights: { cost: 80, food: 5, photography: 5, activities: 5, weather: 5 },
    });
    // Run multiple times to account for jitter
    let cheapWon = 0;
    for (let i = 0; i < 20; i++) {
      const results = scoreDestinations([cheap, expensive], costWeights, 7);
      if (results[0].id === 'cheap') cheapWon++;
    }
    // cheap should win at least 15/20 times (jitter is small relative to gap)
    expect(cheapWon).toBeGreaterThanOrEqual(15);
  });

  it('surprise mode returns results without crashing', () => {
    const catalog = Array.from({ length: 25 }, (_, i) =>
      makeDestination(`dest-${i}`, MED),
    );
    const results = scoreDestinations(catalog, makeParams({ travelMode: 'surprise' }), 7);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('filters destinations over budget', () => {
    // Need 5+ affordable destinations so the "relax if < 5" fallback doesn't trigger
    const affordable = Array.from({ length: 6 }, (_, i) =>
      makeDestination(`affordable-${i}`, MED, {
        budgetRanges: [{ level: 'budget', minPerDayUSD: 50, maxPerDayUSD: 100 },
                       { level: 'mid',    minPerDayUSD: 100, maxPerDayUSD: 200 },
                       { level: 'luxury', minPerDayUSD: 200, maxPerDayUSD: 500 }],
      }),
    );
    const luxuryOnly = makeDestination('luxury-only', LOW, {
      budgetRanges: [{ level: 'budget', minPerDayUSD: 1000, maxPerDayUSD: 2000 },
                     { level: 'mid',    minPerDayUSD: 2000, maxPerDayUSD: 4000 },
                     { level: 'luxury', minPerDayUSD: 4000, maxPerDayUSD: 10000 }],
    });
    const catalog = [...affordable, luxuryOnly];
    // $700 total for 7 days = $100/day — can afford affordable, not luxury-only
    const results = scoreDestinations(catalog, makeParams({ budget: 700 }), 7);
    expect(results.some(r => r.id.startsWith('affordable'))).toBe(true);
    expect(results.some(r => r.id === 'luxury-only')).toBe(false);
  });

  it('relaxes budget filter if fewer than 5 candidates pass', () => {
    // Only 1 destination passes budget — engine should still return results
    const catalog = [
      makeDestination('affordable', MED),
      makeDestination('expensive1', LOW, {
        budgetRanges: [{ level: 'budget', minPerDayUSD: 5000, maxPerDayUSD: 10000 },
                       { level: 'mid',    minPerDayUSD: 5000, maxPerDayUSD: 10000 },
                       { level: 'luxury', minPerDayUSD: 5000, maxPerDayUSD: 10000 }],
      }),
    ];
    const results = scoreDestinations(catalog, makeParams({ budget: 500 }), 7);
    expect(results.length).toBeGreaterThan(0);
  });
});
