import type {
  SearchParams,
  DestinationIndex,
  DestinationScores,
  RecommendationResult,
  ScoredDestination,
  TravelMode,
  LiveCityData,
} from './types';
import { estimateFlightCostRange, isAirportReachable, getRegion } from './flightEstimator';
import { allocateBudget, getTripDays } from './budgetEngine';
import { fetchLiveCityData } from './liveData';

// Countries that commonly require advance visa (not eVisa/VOA) for most Western passport holders.
// This is intentionally conservative — only flag well-known cases to avoid false positives.
const VISA_WARNING_COUNTRIES = new Set([
  'China', 'Russia', 'Belarus', 'Iran', 'North Korea', 'Turkmenistan',
  'Bhutan', 'Libya', 'Syria', 'Yemen', 'Afghanistan', 'Sudan',
]);

// Region pairs where low-cost carriers dominate (bag fees likely not included in base fare).
const LCC_DOMINANT_REGION_PAIRS = new Set([
  'EU:EU',   // Ryanair, EasyJet, Wizz Air
  'AP:AP',   // AirAsia, Lion Air, Scoot, IndiGo
  'NA:NA',   // Spirit, Frontier, Allegiant, Swoop
]);

const ESTIMATED_LIVE: LiveCityData = {
  weatherScore: null, weatherSummary: null,
  hotelPerNightUSD: null, foodPerDayUSD: null,
  costScore: null, source: 'estimated',
};

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
    if (!isAirportReachable(departureAirport, dest.airportCodes, budget, params.startDate)) return false;
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

  return scored.slice(0, 20);
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

  // Fetch full destination JSON + live data for all top results in parallel
  const enriched = await Promise.all(
    scored.map(async (s, i) => {
      const depRegion  = getRegion(params.departureAirport);
      const destRegion = getRegion(s.airportCodes[0] ?? '');
      const regionPair = `${depRegion}:${destRegion}`;

      const flightRange = estimateFlightCostRange(
        params.departureAirport, s.airportCodes, {
          tripDays,
          departureDate: params.startDate,
          returnDate:    params.endDate,
          departureTime: params.departureTime,
          arrivalTime:   params.arrivalTime,
          cabinClass:    params.cabinClass,
          preferDirect:  params.preferDirect,
        },
      );

      // Hard budget gate: if even the cheapest flight exceeds the total budget,
      // this destination is impossible regardless of other scores.
      if (flightRange.min >= budget) return null;

      const [destMod, liveData] = await Promise.all([
        import(`@/data/destinations/${s.id}.json`).catch(() => null),
        fetchLiveCityData(s.city, s.country, params.startDate, params.endDate)
          .catch(() => ESTIMATED_LIVE),
      ]);

      const fullDest = destMod
        ? { ...(destMod.default ?? destMod), heroImageUrl: s.heroImageUrl }
        : { ...s, restaurants: [], activities: [], photography: null, weather: null, hotels: [] };

      const budgetAllocation = allocateBudget(budget, s, tripDays, flightRange.median, liveData);

      const visaWarning = VISA_WARNING_COUNTRIES.has(s.country)
        ? 'Visa likely required — check requirements before booking'
        : undefined;

      const baggageWarning = LCC_DOMINANT_REGION_PAIRS.has(regionPair);

      return {
        destination: fullDest,
        overallScore: s.overallScore,
        adjustedScores: s.adjustedScores,
        modeBonus: s.modeBonus,
        budgetAllocation,
        estimatedFlightCostUSD: flightRange.median,
        flightPriceRange: flightRange,
        rank: i + 1,
        liveData,
        visaWarning,
        baggageWarning,
      } satisfies RecommendationResult;
    })
  );

  const valid = enriched.filter((r) => r !== null) as RecommendationResult[];
  results.push(...valid.slice(0, 10));

  return results;
}
