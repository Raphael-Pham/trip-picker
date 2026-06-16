import { HUB_AIRPORTS, AIRPORT_TO_HUB, getHub } from '../scripts/captureFlightPrices';

// Static IATA region mapping — used as final fallback
const IATA_REGIONS: Record<string, string> = {
  // North America — USA
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
  // Europe
  LHR: 'EU', CDG: 'EU', AMS: 'EU', FRA: 'EU', MAD: 'EU', BCN: 'EU', FCO: 'EU',
  MUC: 'EU', ZRH: 'EU', VIE: 'EU', BRU: 'EU', LIS: 'EU', CPH: 'EU', ARN: 'EU',
  OSL: 'EU', HEL: 'EU', DUB: 'EU', ATH: 'EU', WAW: 'EU', PRG: 'EU', BUD: 'EU',
  LGW: 'EU', STN: 'EU', MAN: 'EU', EDI: 'EU', GLA: 'EU',
  BER: 'EU', MXP: 'EU', VCE: 'EU', NAP: 'EU', CIA: 'EU',
  OPO: 'EU', FAO: 'EU', AGP: 'EU', IBZ: 'EU', VLC: 'EU',
  ORY: 'EU', BVA: 'EU', DBV: 'EU', SPU: 'EU', ZAG: 'EU', LJU: 'EU',
  JTR: 'EU', RHO: 'EU', KEF: 'EU', IST: 'EU', SAW: 'EU', ASR: 'EU', KYA: 'EU',
  // Asia Pacific
  NRT: 'AP', HND: 'AP', KIX: 'AP', ITM: 'AP',
  PEK: 'AP', PVG: 'AP', CAN: 'AP', SZX: 'AP',
  HKG: 'AP', TPE: 'AP', ICN: 'AP', GMP: 'AP',
  SIN: 'AP', BKK: 'AP', DMK: 'AP', HKT: 'AP',
  KUL: 'AP', CGK: 'AP', DPS: 'AP', MNL: 'AP',
  HAN: 'AP', SGN: 'AP', DAD: 'AP',
  DEL: 'AP', BOM: 'AP', MLE: 'AP',
  SYD: 'AP', MEL: 'AP', BNE: 'AP', AKL: 'AP', CHC: 'AP', ZQN: 'AP',
  // Pacific Islands
  NAN: 'PAC', PPT: 'PAC', HNL: 'PAC', OGG: 'PAC', KOA: 'PAC',
  // Middle East
  DXB: 'ME', AUH: 'ME', DOH: 'ME', RUH: 'ME', AMM: 'ME', AQJ: 'ME',
  // Africa
  CAI: 'AF', JNB: 'AF', CPT: 'AF', NBO: 'AF', DAR: 'AF',
  CMN: 'AF', RAK: 'AF', ACC: 'AF', ADD: 'AF', LOS: 'AF', JRO: 'AF', ZNZ: 'AF',
  // Latin America
  SJO: 'SA', GRU: 'SA', BOG: 'SA', CTG: 'SA', LIM: 'SA', CUZ: 'SA',
  SCL: 'SA', EZE: 'SA', MVD: 'SA', UIO: 'SA', HAV: 'SA', AYP: 'SA',
  // Caribbean
  MBJ: 'CAR', KIN: 'CAR', PUJ: 'CAR', SDQ: 'CAR', STI: 'CAR',
  SJU: 'CAR', STT: 'CAR', SXM: 'CAR', ANU: 'CAR', SLU: 'CAR', SVD: 'CAR',
  AUA: 'CAR', BON: 'CAR', CUR: 'CAR', NAS: 'CAR', GDT: 'CAR',
  PLS: 'CAR', CYB: 'CAR', BGI: 'CAR', BZE: 'CAR',
};

// Regional fallback matrix (USD round-trip per person)
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

// Per-hub price files loaded lazily: data/flightPrices/<HUB>.json -> { destIata: price }
const hubPriceCache = new Map<string, Record<string, number> | null>();

function loadHubPrices(hub: string): Record<string, number> | null {
  if (hubPriceCache.has(hub)) return hubPriceCache.get(hub)!;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require(`../data/flightPrices/${hub}.json`) as Record<string, number>;
    hubPriceCache.set(hub, data);
    return data;
  } catch {
    hubPriceCache.set(hub, null);
    return null;
  }
}

// Build a reverse map: region -> list of hub airports in that region
// Used to find an alternative hub when the exact one has no data for a dest
const REGION_HUBS: Record<string, string[]> = {};
for (const hub of HUB_AIRPORTS) {
  const region = IATA_REGIONS[hub] ?? 'NA';
  (REGION_HUBS[region] ??= []).push(hub);
}

export function getRegion(iataCode: string): string {
  return IATA_REGIONS[iataCode.toUpperCase()] ?? 'NA';
}

export function estimateFlightCost(
  departureAirport: string,
  destinationAirportCodes: string[],
  tripDays: number,
): number {
  const dep = departureAirport.toUpperCase();
  const depRegion = getRegion(dep);
  const depHub = getHub(dep);
  const lengthAdj = tripDays >= 7 ? 0.9 : tripDays <= 3 ? 1.15 : 1.0;

  let minCost = Infinity;

  for (const rawCode of destinationAirportCodes) {
    const dest = rawCode.toUpperCase();
    const destRegion = getRegion(dest);
    let baseCost: number | undefined;

    // 1. Exact hub + exact dest airport price
    const hubPrices = loadHubPrices(depHub);
    baseCost = hubPrices?.[dest];

    // 2. Same-region alternative hub (e.g., user is at BOS but we only have JFK data)
    if (!baseCost) {
      for (const altHub of REGION_HUBS[depRegion] ?? []) {
        if (altHub === depHub) continue;
        baseCost = loadHubPrices(altHub)?.[dest];
        if (baseCost) break;
      }
    }

    // 3. Regional matrix fallback
    if (!baseCost) {
      baseCost = REGION_FLIGHT_COSTS[depRegion]?.[destRegion] ?? 800;
    }

    minCost = Math.min(minCost, Math.round(baseCost * lengthAdj));
  }

  return minCost === Infinity ? 800 : minCost;
}

export function isAirportReachable(
  departureAirport: string,
  destinationAirportCodes: string[],
  budget: number,
): boolean {
  const flightCost = estimateFlightCost(departureAirport, destinationAirportCodes, 7);
  return flightCost < budget * 0.7;
}
