// Static IATA region mapping for flight cost estimation
const IATA_REGIONS: Record<string, string> = {
  // North America
  JFK: 'NA', LAX: 'NA', ORD: 'NA', ATL: 'NA', DFW: 'NA', DEN: 'NA', SFO: 'NA',
  SEA: 'NA', MIA: 'NA', BOS: 'NA', LAS: 'NA', PHX: 'NA', IAH: 'NA', MSP: 'NA',
  DTW: 'NA', PHL: 'NA', CLT: 'NA', SLC: 'NA', YYZ: 'NA', YVR: 'NA', YUL: 'NA',
  MEX: 'NA', CUN: 'NA', GDL: 'NA',
  // Europe
  LHR: 'EU', CDG: 'EU', AMS: 'EU', FRA: 'EU', MAD: 'EU', BCN: 'EU', FCO: 'EU',
  MUC: 'EU', ZRH: 'EU', VIE: 'EU', BRU: 'EU', LIS: 'EU', CPH: 'EU', ARN: 'EU',
  OSL: 'EU', HEL: 'EU', DUB: 'EU', ATH: 'EU', WAW: 'EU', PRG: 'EU', BUD: 'EU',
  IST: 'EU', SVO: 'EU', LED: 'EU',
  // Asia Pacific
  NRT: 'AP', HND: 'AP', PEK: 'AP', PVG: 'AP', HKG: 'AP', SIN: 'AP', BKK: 'AP',
  KUL: 'AP', CGK: 'AP', ICN: 'AP', TPE: 'AP', MNL: 'AP', DEL: 'AP', BOM: 'AP',
  SYD: 'AP', MEL: 'AP', AKL: 'AP', NAN: 'AP', DPS: 'AP',
  // Middle East & Africa
  DXB: 'ME', AUH: 'ME', DOH: 'ME', RUH: 'ME', CAI: 'AF', JNB: 'AF', NBO: 'AF',
  CMN: 'AF', ACC: 'AF', ADD: 'AF', LOS: 'AF', CPT: 'AF', DAR: 'AF',
  // Latin America
  GRU: 'SA', BOG: 'SA', LIM: 'SA', SCL: 'SA', EZE: 'SA', MVD: 'SA', UIO: 'SA',
  PTY: 'SA', SJO: 'SA', HAV: 'SA',
  // Caribbean & Pacific Islands
  MBJ: 'CAR', PUJ: 'CAR', SXM: 'CAR', ANU: 'CAR', PPT: 'PAC', HNL: 'PAC',
};

// Base flight costs (USD round-trip per person) between regions
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

export function getRegion(iataCode: string): string {
  return IATA_REGIONS[iataCode.toUpperCase()] ?? 'NA';
}

export function estimateFlightCost(
  departureAirport: string,
  destinationAirportCodes: string[],
  tripDays: number,
): number {
  const depRegion = getRegion(departureAirport);

  // Find the cheapest reachable airport for this destination
  let minCost = Infinity;
  for (const code of destinationAirportCodes) {
    const destRegion = getRegion(code);
    const baseCost = REGION_FLIGHT_COSTS[depRegion]?.[destRegion] ?? 800;
    // Adjust slightly for trip length (longer trips = often cheaper fares booked earlier)
    const lengthAdjustment = tripDays >= 7 ? 0.9 : tripDays <= 3 ? 1.15 : 1.0;
    minCost = Math.min(minCost, Math.round(baseCost * lengthAdjustment));
  }

  return minCost === Infinity ? 800 : minCost;
}

export function isAirportReachable(
  departureAirport: string,
  destinationAirportCodes: string[],
  budget: number,
): boolean {
  // Any destination is technically reachable; this just checks if flights alone don't exceed budget
  const tripDays = 7; // default for viability check
  const flightCost = estimateFlightCost(departureAirport, destinationAirportCodes, tripDays);
  return flightCost < budget * 0.7; // flight shouldn't exceed 70% of budget
}
