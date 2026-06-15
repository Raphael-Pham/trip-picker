import type {
  SearchParams,
  DestinationIndex,
  DestinationScores,
  RecommendationResult,
  ScoredDestination,
  TravelMode,
} from './types';
import { estimateFlightCost, isAirportReachable } from './flightEstimator';
import { allocateBudget, getTripDays } from './budgetEngine';

const MODE_MODIFIERS: Partial<Record<TravelMode, Partial<DestinationScores>>> = {
  photography: { photography: 15 },
  foodie:      { food: 15 },
  adventure:   { activities: 15 },
  relaxation:  { weather: 15 },
};

function applyModeModifiers(
  scores: DestinationScores,
  mode: TravelMode,
): { adjusted: DestinationScores; bonus: number } {
  const modifiers = MODE_MODIFIERS[mode];
  if (!modifiers) return { adjusted: { ...scores }, bonus: 0 };

  const adjusted = { ...scores };
  let bonus = 0;
  for (const [key, delta] of Object.entries(modifiers) as [keyof DestinationScores, number][]) {
    adjusted[key] = Math.min(100, scores[key] + delta);
    bonus += delta;
  }
  return { adjusted, bonus };
}

function applySalt(scores: DestinationScores, maxJitter: number): DestinationScores {
  return {
    cost:        Math.min(100, scores.cost        + Math.random() * maxJitter),
    food:        Math.min(100, scores.food        + Math.random() * maxJitter),
    photography: Math.min(100, scores.photography + Math.random() * maxJitter),
    activities:  Math.min(100, scores.activities  + Math.random() * maxJitter),
    weather:     Math.min(100, scores.weather     + Math.random() * maxJitter),
  };
}

function computeWeightedScore(scores: DestinationScores, weights: SearchParams['weights']): number {
  return (
    scores.cost        * (weights.cost        / 100) +
    scores.food        * (weights.food        / 100) +
    scores.photography * (weights.photography / 100) +
    scores.activities  * (weights.activities  / 100) +
    scores.weather     * (weights.weather     / 100)
  );
}

function isBudgetViable(budget: number, destination: DestinationIndex, tripDays: number): boolean {
  const budgetPerDay = budget / tripDays;
  // Use cheapest budget range as minimum floor
  const cheapest = destination.budgetRanges.find(r => r.level === 'budget');
  if (!cheapest) return true;
  // Allow 20% under the floor (flight costs might still make it work)
  return budgetPerDay >= cheapest.minPerDayUSD * 0.8;
}

export function scoreDestinations(
  catalog: DestinationIndex[],
  params: SearchParams,
  tripDays: number,
): ScoredDestination[] {
  const { travelMode, weights, budget, departureAirport } = params;

  let candidates = catalog.filter(dest => {
    if (travelMode === 'hidden-gems' && !dest.hiddenGem) return false;
    if (!isAirportReachable(departureAirport, dest.airportCodes, budget)) return false;
    if (!isBudgetViable(budget, dest, tripDays)) return false;
    return true;
  });

  // Relax budget constraint if too few results
  if (candidates.length < 5) {
    candidates = catalog.filter(dest => {
      if (travelMode === 'hidden-gems' && !dest.hiddenGem) return false;
      return true;
    });
  }

  const scored: ScoredDestination[] = candidates.map(dest => {
    let { adjusted, bonus } = applyModeModifiers(dest.scores, travelMode);
    if (travelMode === 'surprise') {
      adjusted = applySalt(adjusted, 5);
      bonus = 0;
    } else {
      // Small jitter so repeated searches with identical inputs yield variety
      adjusted = applySalt(adjusted, 3);
    }
    const rawScore = computeWeightedScore(adjusted, weights);
    return {
      ...dest,
      overallScore: Math.round(rawScore * 10) / 10,
      adjustedScores: adjusted,
      modeBonus: bonus,
    };
  });

  scored.sort((a, b) => b.overallScore - a.overallScore);

  if (travelMode === 'surprise') {
    // Shuffle top 20
    const top20 = scored.slice(0, 20);
    for (let i = top20.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [top20[i], top20[j]] = [top20[j], top20[i]];
    }
    return top20.slice(0, 10);
  }

  return scored.slice(0, 10);
}

export async function getRecommendations(
  catalog: DestinationIndex[],
  params: SearchParams,
): Promise<RecommendationResult[]> {
  const tripDays = getTripDays(params.startDate, params.endDate);
  const budget = params.groupMode && params.computedBudget
    ? params.computedBudget.recommended
    : params.budget;

  const paramsWithBudget = { ...params, budget };
  const scored = scoreDestinations(catalog, paramsWithBudget, tripDays);

  const results: RecommendationResult[] = [];

  for (let i = 0; i < scored.length; i++) {
    const s = scored[i];
    const flightCost = estimateFlightCost(params.departureAirport, s.airportCodes, tripDays);

    // Dynamic import of full destination JSON
    let fullDest;
    try {
      const mod = await import(`@/data/destinations/${s.id}.json`);
      fullDest = { ...(mod.default ?? mod), heroImageUrl: s.heroImageUrl };
    } catch {
      // Fall back to index data if full file missing
      fullDest = { ...s, restaurants: [], activities: [], photography: null, weather: null, hotels: [] };
    }

    const budgetAllocation = allocateBudget(budget, s, tripDays, flightCost);

    results.push({
      destination: fullDest,
      overallScore: s.overallScore,
      adjustedScores: s.adjustedScores,
      modeBonus: s.modeBonus,
      budgetAllocation,
      estimatedFlightCostUSD: flightCost,
      rank: i + 1,
    });
  }

  return results;
}
