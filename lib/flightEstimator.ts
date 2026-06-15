// Static IATA region mapping for flight cost estimation
const IATA_REGIONS: Record<string, string> = {
  // North America — USA majors
  JFK: 'NA', LAX: 'NA', ORD: 'NA', ATL: 'NA', DFW: 'NA', DEN: 'NA', SFO: 'NA',
  SEA: 'NA', MIA: 'NA', BOS: 'NA', LAS: 'NA', PHX: 'NA', IAH: 'NA', MSP: 'NA',
  DTW: 'NA', PHL: 'NA', CLT: 'NA', SLC: 'NA', IAD: 'NA', DCA: 'NA', BWI: 'NA',
  EWR: 'NA', LGA: 'NA', MDW: 'NA', OAK: 'NA', SJC: 'NA', LGB: 'NA', BUR: 'NA',
  // North America — USA regionals
  AUS: 'NA', BNA: 'NA', MSY: 'NA', MEM: 'NA', PDX: 'NA', SAN: 'NA', SAT: 'NA',
  TPA: 'NA', MCO: 'NA', SFB: 'NA', FLL: 'NA', PBI: 'NA', RSW: 'NA', EYW: 'NA',
  MCI: 'NA', STL: 'NA', IND: 'NA', CMH: 'NA', CVG: 'NA', CLE: 'NA', PIT: 'NA',
  RIC: 'NA', SDF: 'NA', BOS: 'NA', ORF: 'NA', RDU: 'NA', CHS: 'NA', SAV: 'NA',
  JAX: 'NA', MEM: 'NA', BNA: 'NA', BOI: 'NA', ABQ: 'NA', TUS: 'NA', ELP: 'NA',
  AUS: 'NA', AVL: 'NA', GSP: 'NA', OGG: 'NA', KOA: 'NA', RNO: 'NA', SMF: 'NA',
  FAT: 'NA', ONT: 'NA', STS: 'NA', MFR: 'NA', TAC: 'NA', BZN: 'NA', FCA: 'NA',
  JAC: 'NA', MDT: 'NA', SYR: 'NA', BUF: 'NA', ROC: 'NA', PVD: 'NA', BGR: 'NA',
  COS: 'NA', GJT: 'NA', SAF: 'NA', ABQ: 'NA', FLG: 'NA', BTR: 'NA', MOB: 'NA',
  JAN: 'NA', LUK: 'NA', PDK: 'NA', FTY: 'NA', MCC: 'NA', MSC: 'NA', AZA: 'NA',
  HDT: 'NA', MIC: 'NA', OGD: 'NA', PVT: 'NA', WYS: 'NA', MIS: 'NA', CIU: 'NA',
  // North America — Canada
  YYZ: 'NA', YVR: 'NA', YUL: 'NA', YYC: 'NA', YYJ: 'NA', YQB: 'NA', YTZ: 'NA',
  YLW: 'NA', YHM: 'NA', YMX: 'NA',
  // North America — Mexico
  MEX: 'NA', CUN: 'NA', GDL: 'NA', SJD: 'NA', PVR: 'NA', OAX: 'NA', MZT: 'NA',
  VER: 'NA', CTM: 'NA', LAP: 'NA',
  // Europe — Western
  LHR: 'EU', CDG: 'EU', AMS: 'EU', FRA: 'EU', MAD: 'EU', BCN: 'EU', FCO: 'EU',
  MUC: 'EU', ZRH: 'EU', VIE: 'EU', BRU: 'EU', LIS: 'EU', CPH: 'EU', ARN: 'EU',
  OSL: 'EU', HEL: 'EU', DUB: 'EU', ATH: 'EU', WAW: 'EU', PRG: 'EU', BUD: 'EU',
  SVO: 'EU', LED: 'EU',
  // Europe — additional
  LGW: 'EU', STN: 'EU', MAN: 'EU', EDI: 'EU', GLA: 'EU', SNN: 'EU',
  BER: 'EU', TXL: 'EU', SXF: 'EU', MXP: 'EU', VCE: 'EU', NAP: 'EU', CIA: 'EU',
  OPO: 'EU', FAO: 'EU', AGP: 'EU', IBZ: 'EU', VLC: 'EU', VGO: 'EU',
  ORY: 'EU', BVA: 'EU', EHV: 'EU', RTM: 'EU', NYO: 'EU', VST: 'EU',
  DBV: 'EU', SPU: 'EU', ZAG: 'EU', LJU: 'EU',
  JTR: 'EU', RHO: 'EU', SKU: 'EU', ATH: 'EU',
  KEF: 'EU', RKE: 'EU', RKV: 'EU',
  CPH: 'EU', MME: 'EU',
  INN: 'EU', BRN: 'EU', FKB: 'EU',
  IST: 'EU', SAW: 'EU', ASR: 'EU', KYA: 'EU', AYP: 'EU',
  // Asia Pacific — Northeast Asia
  NRT: 'AP', HND: 'AP', KIX: 'AP', ITM: 'AP', NGO: 'AP', UKB: 'AP',
  PEK: 'AP', PVG: 'AP', CAN: 'AP', SZX: 'AP', TXG: 'AP',
  HKG: 'AP', TPE: 'AP', GMP: 'AP', ICN: 'AP',
  // Asia Pacific — Southeast Asia
  SIN: 'AP', XSP: 'AP', BKK: 'AP', DMK: 'AP', HKT: 'AP',
  KUL: 'AP', CGK: 'AP', SUB: 'AP', DPS: 'AP',
  MNL: 'AP', CRK: 'AP',
  HAN: 'AP', SGN: 'AP', DAD: 'AP',
  // Asia Pacific — South Asia
  DEL: 'AP', BOM: 'AP', CJB: 'AP',
  // Asia Pacific — Maldives
  MLE: 'AP', GAN: 'AP',
  // Asia Pacific — Australia / NZ
  SYD: 'AP', MEL: 'AP', BNE: 'AP', CBR: 'AP', AVV: 'AP', MEB: 'AP', KNX: 'AP',
  AKL: 'AP', CHC: 'AP', ZQN: 'AP',
  // Asia Pacific — Pacific
  NAN: 'PAC', PPT: 'PAC', HNL: 'PAC', OGG: 'PAC', KOA: 'PAC',
  // Middle East
  DXB: 'ME', AUH: 'ME', DWC: 'ME', DOH: 'ME', RUH: 'ME',
  AMM: 'ME', AQJ: 'ME',
  // Africa
  CAI: 'AF', JNB: 'AF', CPT: 'AF', NBO: 'AF', DAR: 'AF',
  CMN: 'AF', RAK: 'AF',
  ACC: 'AF', ADD: 'AF', LOS: 'AF',
  JRO: 'AF', ZNZ: 'AF', MRU: 'AF',
  // Latin America — Central America
  SJO: 'SA', LIR: 'SA', MGA: 'SA', GUA: 'SA', PTY: 'SA',
  // Latin America — South America
  GRU: 'SA', GIG: 'SA', SDU: 'SA', BOG: 'SA', CTG: 'SA', MDE: 'SA',
  LIM: 'SA', CUZ: 'SA', AYP: 'SA',
  SCL: 'SA', EZE: 'SA', AEP: 'SA', BRC: 'SA', CPC: 'SA', USH: 'SA', PSS: 'SA',
  MVD: 'SA', UIO: 'SA', HAV: 'SA',
  // Caribbean
  MBJ: 'CAR', KIN: 'CAR', PUJ: 'CAR', SDQ: 'CAR', STI: 'CAR',
  SJU: 'CAR', STT: 'CAR', SXM: 'CAR', ANU: 'CAR', SLU: 'CAR', SVD: 'CAR',
  AUA: 'CAR', BON: 'CAR', CUR: 'CAR',
  NAS: 'CAR', GDT: 'CAR', PLS: 'CAR', CYB: 'CAR',
  BGI: 'CAR',
  BZE: 'CAR',
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
