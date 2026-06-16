import { HUB_AIRPORTS, AIRPORT_TO_HUB, getHub } from './airportHubs';
import type { TimeOfDay, CabinClass, FlightPriceRange } from './types';

// ── 1. Cabin class multipliers ─────────────────────────────────────────────────
// Captured prices are economy (standard). These scale relative to that baseline.
const CABIN_CLASS_MULTIPLIER: Record<CabinClass, number> = {
  basic_economy:   0.88,  // restricted bags/changes, typically 10-15% below economy
  economy:         1.00,  // baseline — what our scraper captures
  premium_economy: 1.65,  // wider seat, extra legroom, ~60-70% premium
  business:        2.50,  // lie-flat long-haul, ~2.5× economy on average
};

// ── 2. Day-of-week multipliers ─────────────────────────────────────────────────
// 0=Sun, 1=Mon, …, 6=Sat (JS Date.getDay() order)
// Tuesdays & Wednesdays are historically cheapest; Fridays & Sundays most expensive.
const DOW_MULTIPLIER: number[] = [
  1.10,  // Sunday    — popular return day, elevated
  1.00,  // Monday    — baseline business travel
  0.90,  // Tuesday   — cheapest day to fly
  0.88,  // Wednesday — cheapest day to fly
  0.95,  // Thursday  — moderate
  1.15,  // Friday    — most expensive (leisure + end-of-week business)
  1.05,  // Saturday  — moderate, family travel
];

/** Returns the day-of-week price multiplier for a given ISO date string. */
export function dayOfWeekMultiplier(departureDateISO: string): number {
  const dow = new Date(departureDateISO + 'T12:00:00Z').getUTCDay();
  return DOW_MULTIPLIER[dow] ?? 1.0;
}

// ── 3. Lead-time multipliers ───────────────────────────────────────────────────
// Booking further in advance generally yields lower fares up to ~60 days out.
// Last-minute (<14 days) fares spike; very far out (>90 days) also has a slight
// discount as airlines seed early-bird inventory.
const LEAD_TIME_BANDS: Array<{ maxDays: number; multiplier: number }> = [
  { maxDays: 6,   multiplier: 1.35 },  // last-minute surge
  { maxDays: 13,  multiplier: 1.20 },  // <2 weeks
  { maxDays: 29,  multiplier: 1.10 },  // 2–4 weeks
  { maxDays: 59,  multiplier: 1.00 },  // 1–2 months — baseline
  { maxDays: 89,  multiplier: 0.95 },  // 2–3 months
  { maxDays: Infinity, multiplier: 0.92 }, // 3+ months — early-bird
];

/** Returns the lead-time price multiplier based on days until departure. */
export function leadTimeMultiplier(departureDateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dep = new Date(departureDateISO + 'T00:00:00Z');
  const daysOut = Math.max(0, Math.round((dep.getTime() - today.getTime()) / 86_400_000));
  return LEAD_TIME_BANDS.find(b => daysOut <= b.maxDays)?.multiplier ?? 1.0;
}

// ── 4. Seasonal multipliers ────────────────────────────────────────────────────
// Month index 0=Jan … 11=Dec. Values are price multipliers relative to the
// annual baseline for each departure-region → destination-region pair.
// Sourced from aggregated fare studies (Hopper, Google Flights, IdeaWorks 2023-24).
const SEASONAL: Record<string, Record<string, number[]>> = {
  NA: {
    //                Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec
    NA:  [1.05, 0.95, 0.98, 1.02, 1.08, 1.15, 1.20, 1.15, 0.95, 0.90, 0.95, 1.12],
    EU:  [0.90, 0.88, 0.95, 1.05, 1.15, 1.30, 1.35, 1.28, 1.05, 0.92, 0.85, 0.90],
    AP:  [1.10, 1.05, 1.00, 0.95, 0.92, 0.95, 0.98, 1.00, 0.95, 0.95, 1.05, 1.20],
    CAR: [1.40, 1.35, 1.20, 1.05, 0.90, 0.85, 0.88, 0.85, 0.80, 0.82, 0.95, 1.32],
    ME:  [1.05, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.05],
    AF:  [1.00, 1.00, 1.00, 1.00, 1.00, 1.05, 1.05, 1.00, 0.95, 0.95, 1.00, 1.05],
    SA:  [0.95, 0.95, 1.00, 1.05, 1.00, 0.95, 0.95, 0.95, 0.90, 0.90, 0.95, 1.05],
    PAC: [1.05, 1.00, 0.98, 1.00, 1.05, 1.10, 1.15, 1.10, 0.95, 0.90, 0.95, 1.10],
  },
  EU: {
    NA:  [0.88, 0.88, 0.95, 1.05, 1.15, 1.30, 1.35, 1.25, 1.00, 0.90, 0.82, 0.88],
    EU:  [0.95, 0.90, 0.95, 1.00, 1.10, 1.25, 1.30, 1.25, 1.05, 0.95, 0.85, 0.90],
    AP:  [1.05, 1.00, 0.95, 0.95, 1.00, 1.05, 1.05, 1.00, 0.95, 0.95, 1.00, 1.10],
    CAR: [1.10, 1.05, 1.00, 1.00, 1.00, 1.05, 1.10, 1.05, 0.95, 0.92, 1.00, 1.15],
    ME:  [1.00, 0.95, 0.95, 1.00, 1.05, 1.10, 1.10, 1.05, 1.00, 1.00, 0.95, 1.00],
    AF:  [1.00, 1.00, 1.00, 1.00, 1.00, 1.05, 1.05, 1.00, 0.95, 0.95, 1.00, 1.05],
    SA:  [0.95, 0.95, 1.00, 1.05, 1.00, 1.00, 1.00, 0.95, 0.90, 0.90, 0.95, 1.00],
    PAC: [1.00, 1.00, 1.00, 1.00, 1.00, 1.05, 1.10, 1.05, 0.95, 0.95, 1.00, 1.05],
  },
  AP: {
    NA:  [1.10, 1.05, 1.00, 0.95, 0.92, 0.95, 0.98, 1.00, 0.95, 0.95, 1.05, 1.20],
    EU:  [1.05, 1.00, 0.95, 0.95, 1.00, 1.05, 1.05, 1.00, 0.95, 0.95, 1.00, 1.10],
    AP:  [1.15, 1.05, 1.00, 0.95, 0.90, 0.88, 0.90, 0.95, 0.98, 1.00, 1.10, 1.20],
    CAR: [1.05, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.05],
    ME:  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    AF:  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    SA:  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    PAC: [1.05, 1.00, 0.98, 1.00, 1.00, 1.00, 1.00, 1.00, 0.98, 1.00, 1.00, 1.05],
  },
};

/** Returns seasonal price multiplier for a departure month (1-12). */
export function seasonalMultiplier(
  depRegion: string,
  destRegion: string,
  month: number, // 1-12
): number {
  const row = SEASONAL[depRegion]?.[destRegion];
  if (row) return row[month - 1] ?? 1.0;
  // Symmetric fallback: try the reverse direction
  const rev = SEASONAL[destRegion]?.[depRegion];
  if (rev) return rev[month - 1] ?? 1.0;
  return 1.0;
}

// ── 5. Time-of-day multipliers (from previous feature) ─────────────────────────
const DEPARTURE_TIME_MULTIPLIER: Record<TimeOfDay, number> = {
  morning:   1.12,
  noon:      0.95,
  afternoon: 1.08,
  evening:   1.02,
  night:     0.85,
};
const ARRIVAL_TIME_MULTIPLIER: Record<TimeOfDay, number> = {
  morning:   0.88,
  noon:      0.97,
  afternoon: 1.00,
  evening:   1.05,
  night:     0.92,
};
export function timeOfDayMultiplier(dep?: TimeOfDay, arr?: TimeOfDay): number {
  if (!dep && !arr) return 1.0;
  if (dep && !arr) return DEPARTURE_TIME_MULTIPLIER[dep];
  if (!dep && arr) return ARRIVAL_TIME_MULTIPLIER[arr];
  return Math.round((DEPARTURE_TIME_MULTIPLIER[dep!] * 0.6 + ARRIVAL_TIME_MULTIPLIER[arr!] * 0.4) * 100) / 100;
}

// ── IATA region map ────────────────────────────────────────────────────────────
const IATA_REGIONS: Record<string, string> = {
  JFK: 'NA', LAX: 'NA', ORD: 'NA', ATL: 'NA', DFW: 'NA', DEN: 'NA', SFO: 'NA',
  SEA: 'NA', MIA: 'NA', BOS: 'NA', LAS: 'NA', PHX: 'NA', IAH: 'NA', MSP: 'NA',
  DTW: 'NA', PHL: 'NA', CLT: 'NA', SLC: 'NA', IAD: 'NA', DCA: 'NA', BWI: 'NA',
  EWR: 'NA', LGA: 'NA', MDW: 'NA', OAK: 'NA', SJC: 'NA', LGB: 'NA', BUR: 'NA',
  AUS: 'NA', BNA: 'NA', MSY: 'NA', MEM: 'NA', PDX: 'NA', SAN: 'NA', SAT: 'NA',
  TPA: 'NA', MCO: 'NA', FLL: 'NA', PBI: 'NA', RSW: 'NA', EYW: 'NA',
  MCI: 'NA', STL: 'NA', IND: 'NA', CMH: 'NA', CVG: 'NA', CLE: 'NA', PIT: 'NA',
  RIC: 'NA', SDF: 'NA', ORF: 'NA', RDU: 'NA', CHS: 'NA', SAV: 'NA',
  JAX: 'NA', BOI: 'NA', ABQ: 'NA', TUS: 'NA', ELP: 'NA',
  AVL: 'NA', GSP: 'NA', RNO: 'NA', SMF: 'NA',
  FAT: 'NA', ONT: 'NA', STS: 'NA', MFR: 'NA', BZN: 'NA', FCA: 'NA',
  JAC: 'NA', MDT: 'NA', SYR: 'NA', BUF: 'NA', ROC: 'NA', PVD: 'NA', BGR: 'NA',
  COS: 'NA', GJT: 'NA', FLG: 'NA', BTR: 'NA', MOB: 'NA', JAN: 'NA',
  YYZ: 'NA', YVR: 'NA', YUL: 'NA', YYC: 'NA', YYJ: 'NA', YQB: 'NA',
  MEX: 'NA', CUN: 'NA', GDL: 'NA', SJD: 'NA', PVR: 'NA', OAX: 'NA', MZT: 'NA',
  LHR: 'EU', CDG: 'EU', AMS: 'EU', FRA: 'EU', MAD: 'EU', BCN: 'EU', FCO: 'EU',
  MUC: 'EU', ZRH: 'EU', VIE: 'EU', BRU: 'EU', LIS: 'EU', CPH: 'EU', ARN: 'EU',
  OSL: 'EU', HEL: 'EU', DUB: 'EU', ATH: 'EU', WAW: 'EU', PRG: 'EU', BUD: 'EU',
  LGW: 'EU', STN: 'EU', MAN: 'EU', EDI: 'EU', GLA: 'EU',
  BER: 'EU', MXP: 'EU', VCE: 'EU', NAP: 'EU', CIA: 'EU',
  OPO: 'EU', FAO: 'EU', AGP: 'EU', IBZ: 'EU', VLC: 'EU',
  ORY: 'EU', BVA: 'EU', DBV: 'EU', SPU: 'EU', ZAG: 'EU', LJU: 'EU',
  JTR: 'EU', RHO: 'EU', KEF: 'EU', IST: 'EU', SAW: 'EU', ASR: 'EU', KYA: 'EU',
  NRT: 'AP', HND: 'AP', KIX: 'AP', ITM: 'AP',
  PEK: 'AP', PVG: 'AP', CAN: 'AP', SZX: 'AP',
  HKG: 'AP', TPE: 'AP', ICN: 'AP', GMP: 'AP',
  SIN: 'AP', BKK: 'AP', DMK: 'AP', HKT: 'AP',
  KUL: 'AP', CGK: 'AP', DPS: 'AP', MNL: 'AP',
  HAN: 'AP', SGN: 'AP', DAD: 'AP',
  DEL: 'AP', BOM: 'AP', MLE: 'AP',
  SYD: 'AP', MEL: 'AP', BNE: 'AP', AKL: 'AP', CHC: 'AP', ZQN: 'AP',
  NAN: 'PAC', PPT: 'PAC', HNL: 'PAC', OGG: 'PAC', KOA: 'PAC',
  DXB: 'ME', AUH: 'ME', DOH: 'ME', RUH: 'ME', AMM: 'ME', AQJ: 'ME',
  CAI: 'AF', JNB: 'AF', CPT: 'AF', NBO: 'AF', DAR: 'AF',
  CMN: 'AF', RAK: 'AF', ACC: 'AF', ADD: 'AF', LOS: 'AF', JRO: 'AF', ZNZ: 'AF',
  SJO: 'SA', GRU: 'SA', BOG: 'SA', CTG: 'SA', LIM: 'SA', CUZ: 'SA',
  SCL: 'SA', EZE: 'SA', MVD: 'SA', UIO: 'SA', HAV: 'SA', AYP: 'SA',
  MBJ: 'CAR', KIN: 'CAR', PUJ: 'CAR', SDQ: 'CAR', STI: 'CAR',
  SJU: 'CAR', STT: 'CAR', SXM: 'CAR', ANU: 'CAR', SLU: 'CAR', SVD: 'CAR',
  AUA: 'CAR', BON: 'CAR', CUR: 'CAR', NAS: 'CAR', GDT: 'CAR',
  PLS: 'CAR', CYB: 'CAR', BGI: 'CAR', BZE: 'CAR',
};

const REGION_FLIGHT_COSTS: Record<string, Record<string, number>> = {
  NA:  { NA: 300,  EU: 700,  AP: 900,  ME: 1000, AF: 1100, SA: 600,  CAR: 400,  PAC: 800  },
  EU:  { NA: 700,  EU: 200,  AP: 800,  ME: 400,  AF: 600,  SA: 900,  CAR: 800,  PAC: 1200 },
  AP:  { NA: 900,  EU: 800,  AP: 300,  ME: 500,  AF: 1000, SA: 1300, CAR: 1200, PAC: 600  },
  ME:  { NA: 1000, EU: 400,  AP: 500,  ME: 200,  AF: 500,  SA: 1200, CAR: 1100, PAC: 1100 },
  AF:  { NA: 1100, EU: 600,  AP: 1000, ME: 500,  AF: 300,  SA: 1300, CAR: 1300, PAC: 1400 },
  SA:  { NA: 600,  EU: 900,  AP: 1300, ME: 1200, AF: 1300, SA: 400,  CAR: 600,  PAC: 1400 },
  CAR: { NA: 400,  EU: 800,  AP: 1200, ME: 1100, AF: 1300, SA: 600,  CAR: 300,  PAC: 1300 },
  PAC: { NA: 800,  EU: 1200, AP: 600,  ME: 1100, AF: 1400, SA: 1400, CAR: 1300, PAC: 400  },
};

// ── Hub price loader ───────────────────────────────────────────────────────────
// Stored value can be a plain number (old format) or {min,median,max,samples}
interface StoredPriceEntry { min: number; median: number; max: number; samples: number }
type StoredPrice = number | StoredPriceEntry;
type HubPriceFile = Record<string, StoredPrice>;

const hubPriceCache = new Map<string, HubPriceFile | null>();

function loadHubPrices(hub: string): HubPriceFile | null {
  if (hubPriceCache.has(hub)) return hubPriceCache.get(hub)!;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require(/* webpackIgnore: true */ `../data/flightPrices/${hub}.json`) as HubPriceFile;
    hubPriceCache.set(hub, data);
    return data;
  } catch {
    hubPriceCache.set(hub, null);
    return null;
  }
}

/** Extract {min, median, max} from either the old (number) or new (object) storage format. */
function extractRange(entry: StoredPrice | undefined): { min: number; median: number; max: number } | null {
  if (entry == null) return null;
  if (typeof entry === 'number') return { min: Math.round(entry * 0.82), median: entry, max: Math.round(entry * 1.22) };
  return { min: entry.min, median: entry.median, max: entry.max };
}

const REGION_HUBS: Record<string, string[]> = {};
for (const hub of HUB_AIRPORTS) {
  const region = IATA_REGIONS[hub] ?? 'NA';
  (REGION_HUBS[region] ??= []).push(hub);
}

export function getRegion(iataCode: string): string {
  return IATA_REGIONS[iataCode.toUpperCase()] ?? 'NA';
}

// ── Core estimation ────────────────────────────────────────────────────────────

interface FlightEstimateOptions {
  tripDays?: number;
  departureDate?: string;   // ISO date — used for lead-time, DOW, seasonal
  returnDate?: string;      // ISO date — used for return-leg DOW asymmetry
  departureTime?: TimeOfDay;
  arrivalTime?: TimeOfDay;
  cabinClass?: CabinClass;
  preferDirect?: boolean;   // true = add ~30% surcharge (direct flights cost more)
}

/**
 * Returns a price range {min, median, max} for a round-trip flight.
 * All five adjustment factors are applied to every figure.
 */
export function estimateFlightCostRange(
  departureAirport: string,
  destinationAirportCodes: string[],
  options: FlightEstimateOptions = {},
): FlightPriceRange {
  const { tripDays = 7, departureDate, returnDate, departureTime, arrivalTime, cabinClass = 'economy', preferDirect = false } = options;

  const dep = departureAirport.toUpperCase();
  const depRegion = getRegion(dep);
  const depHub = getHub(dep);

  // Compute all multipliers
  const lengthAdj   = tripDays >= 7 ? 0.9 : tripDays <= 3 ? 1.15 : 1.0;
  const timeAdj     = timeOfDayMultiplier(departureTime, arrivalTime);
  const cabinAdj    = CABIN_CLASS_MULTIPLIER[cabinClass];
  // Blend outbound + return DOW (outbound 60%, return 40%) to reflect real round-trip pricing
  const depDowAdj   = departureDate ? dayOfWeekMultiplier(departureDate) : 1.0;
  const retDowAdj   = returnDate    ? dayOfWeekMultiplier(returnDate)    : depDowAdj;
  const dowAdj      = Math.round((depDowAdj * 0.6 + retDowAdj * 0.4) * 1000) / 1000;
  const leadAdj     = departureDate ? leadTimeMultiplier(departureDate) : 1.0;
  const depMonth    = departureDate ? new Date(departureDate + 'T12:00:00Z').getUTCMonth() + 1 : new Date().getMonth() + 1;
  const directAdj   = preferDirect ? 1.30 : 1.0;

  let bestMin    = Infinity;
  let bestMedian = Infinity;
  let bestMax    = Infinity;

  for (const rawCode of destinationAirportCodes) {
    const dest = rawCode.toUpperCase();
    const destRegion = getRegion(dest);
    const seasonAdj  = seasonalMultiplier(depRegion, destRegion, depMonth);

    const totalMult = lengthAdj * timeAdj * cabinAdj * dowAdj * leadAdj * seasonAdj * directAdj;

    // Try to get a captured price range
    let range: { min: number; median: number; max: number } | null = null;

    const hubFile = loadHubPrices(depHub);
    range = extractRange(hubFile?.[dest]);

    if (!range) {
      for (const altHub of REGION_HUBS[depRegion] ?? []) {
        if (altHub === depHub) continue;
        range = extractRange(loadHubPrices(altHub)?.[dest]);
        if (range) break;
      }
    }

    if (!range) {
      const base = REGION_FLIGHT_COSTS[depRegion]?.[destRegion] ?? 800;
      range = { min: Math.round(base * 0.82), median: base, max: Math.round(base * 1.22) };
    }

    const adjMin    = Math.round(range.min    * totalMult);
    const adjMedian = Math.round(range.median * totalMult);
    const adjMax    = Math.round(range.max    * totalMult);

    if (adjMedian < bestMedian) {
      bestMin    = adjMin;
      bestMedian = adjMedian;
      bestMax    = adjMax;
    }
  }

  if (bestMedian === Infinity) return { min: 656, median: 800, max: 976 };
  return { min: bestMin, median: bestMedian, max: bestMax };
}

/** Convenience wrapper returning just the median (used by budgetEngine etc). */
export function estimateFlightCost(
  departureAirport: string,
  destinationAirportCodes: string[],
  tripDays: number,
  departureTime?: TimeOfDay,
  arrivalTime?: TimeOfDay,
  cabinClass?: CabinClass,
  departureDate?: string,
): number {
  return estimateFlightCostRange(departureAirport, destinationAirportCodes, {
    tripDays, departureTime, arrivalTime, cabinClass, departureDate,
  }).median;
}

export function isAirportReachable(
  departureAirport: string,
  destinationAirportCodes: string[],
  budget: number,
  departureDate?: string,
): boolean {
  // Use a date-aware estimate so seasonal/DOW/lead-time multipliers are included.
  // Threshold: the median flight cost must leave at least 20% of the budget for
  // hotels, food, and activities. Using median (not min) keeps the pre-filter
  // fast; getRecommendations does a hard min-cost check after full enrichment.
  const median = estimateFlightCost(
    departureAirport, destinationAirportCodes, 7,
    undefined, undefined, undefined, departureDate,
  );
  return median < budget * 0.80;
}
