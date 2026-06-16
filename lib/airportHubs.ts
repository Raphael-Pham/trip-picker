// Pure data — no Node.js imports. Safe for both edge runtime and CLI scripts.

export const HUB_AIRPORTS: readonly string[] = [
  // North America — Eastern USA
  'JFK', 'BOS', 'IAD', 'ATL', 'MIA', 'MSY',
  // North America — Midwest
  'ORD', 'MSP', 'DTW', 'STL',
  // North America — South / Mountain
  'DFW', 'DEN', 'PHX', 'SLC',
  // North America — West Coast / Pacific
  'LAX', 'SFO', 'SEA', 'LAS', 'HNL',
  // North America — Canada & Mexico
  'YYZ', 'YVR', 'MEX', 'CUN',
  // Europe
  'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'FCO',
  'ARN', 'ATH', 'LIS', 'PRG', 'VIE', 'DUB', 'IST',
  // Asia Pacific
  'NRT', 'ICN', 'HKG', 'SIN', 'BKK', 'SGN', 'DEL', 'SYD', 'AKL',
  // Middle East
  'DXB',
  // Africa
  'JNB', 'CAI', 'NBO',
  // South America & Caribbean
  'BOG', 'GRU', 'LIM', 'EZE', 'SJU',
] as const;

export const AIRPORT_TO_HUB: Record<string, string> = {
  // New York metro
  LGA: 'JFK', EWR: 'JFK', HPN: 'JFK', ISP: 'JFK',
  // New England
  BDL: 'BOS', PVD: 'BOS', MHT: 'BOS', BGR: 'BOS', PWM: 'BOS',
  SYR: 'BOS', BUF: 'BOS', ROC: 'BOS', ALB: 'BOS', BTV: 'BOS',
  // DC / Mid-Atlantic
  PHL: 'IAD', BWI: 'IAD', DCA: 'IAD', MDT: 'IAD', ORF: 'IAD', RIC: 'IAD',
  // Southeast
  CLT: 'ATL', GSP: 'ATL', AVL: 'ATL', CHS: 'ATL', SAV: 'ATL',
  JAX: 'ATL', BHM: 'ATL', HSV: 'ATL', RDU: 'ATL', GSO: 'ATL', TLH: 'MIA',
  // South Florida
  FLL: 'MIA', PBI: 'MIA', MCO: 'MIA', TPA: 'MIA', RSW: 'MIA',
  SFB: 'MIA', EYW: 'MIA', PIE: 'MIA', SRQ: 'MIA', DAB: 'MIA',
  // Gulf Coast
  MOB: 'MSY', BTR: 'MSY', JAN: 'MSY', PNS: 'MSY', VPS: 'MSY',
  // Chicago / Great Lakes
  MDW: 'ORD', RFD: 'ORD', MKE: 'ORD', GRB: 'ORD',
  // Ohio Valley / Detroit
  IND: 'DTW', CMH: 'DTW', CVG: 'DTW', CLE: 'DTW', PIT: 'DTW', SDF: 'DTW',
  // Upper Midwest
  DSM: 'MSP', MSN: 'MSP', DLH: 'MSP', FAR: 'MSP', BIS: 'MSP',
  // Missouri / Plains
  MCI: 'STL', SGF: 'STL', ICT: 'STL', OMA: 'STL', LNK: 'STL',
  TUL: 'DFW', XNA: 'DFW', OKC: 'DFW',
  // Texas
  IAH: 'DFW', HOU: 'DFW', SAT: 'DFW', AUS: 'DFW', ELP: 'PHX',
  // Mountain West
  COS: 'DEN', GJT: 'DEN', BZN: 'DEN', FCA: 'DEN', JAC: 'DEN',
  BOI: 'SLC', SGU: 'SLC', ABQ: 'PHX', TUS: 'PHX', FLG: 'PHX',
  // Southern California
  SAN: 'LAX', SBA: 'LAX', SNA: 'LAX', ONT: 'LAX', BUR: 'LAX', LGB: 'LAX', PSP: 'LAX',
  // Bay Area / NorCal
  OAK: 'SFO', SJC: 'SFO', SMF: 'SFO', FAT: 'SFO', STS: 'SFO',
  // Pacific Northwest
  PDX: 'SEA', GEG: 'SEA', MFR: 'SEA', EUG: 'SEA',
  // Nevada
  RNO: 'LAS',
  // Hawaii / Pacific
  OGG: 'HNL', KOA: 'HNL', ITO: 'HNL', LIH: 'HNL',
  PPT: 'HNL', NAN: 'HNL', APW: 'HNL',
  // Canada East
  YUL: 'YYZ', YOW: 'YYZ', YHM: 'YYZ', YTZ: 'YYZ', YQB: 'YYZ',
  // Canada West
  YYJ: 'YVR', YYC: 'YVR', YLW: 'YVR', YXE: 'YVR', YEG: 'YVR',
  // Mexico
  GDL: 'MEX', MTY: 'MEX', OAX: 'MEX', VER: 'MEX',
  MZT: 'CUN', SJD: 'CUN', PVR: 'CUN', CZM: 'CUN', MID: 'CUN', CTM: 'CUN', LAP: 'CUN',
  // UK
  LGW: 'LHR', STN: 'LHR', MAN: 'LHR', EDI: 'LHR', GLA: 'LHR', BHX: 'LHR',
  // Ireland / Iceland
  SNN: 'DUB', ORK: 'DUB', KEF: 'DUB',
  // France
  ORY: 'CDG', BVA: 'CDG', LYS: 'CDG', NCE: 'CDG', MRS: 'CDG', TLS: 'CDG',
  // Germany
  MUC: 'FRA', BER: 'FRA', HAM: 'FRA', DUS: 'FRA', CGN: 'FRA',
  // Austria / Switzerland
  ZRH: 'VIE', GVA: 'VIE', INN: 'VIE',
  // Benelux
  BRU: 'AMS', RTM: 'AMS', EIN: 'AMS',
  // Spain
  BCN: 'MAD', VLC: 'MAD', AGP: 'MAD', IBZ: 'MAD', VGO: 'MAD', LPA: 'MAD', PMI: 'MAD',
  // Portugal
  OPO: 'LIS', FAO: 'LIS', FNC: 'LIS',
  // Italy
  MXP: 'FCO', VCE: 'FCO', NAP: 'FCO', CIA: 'FCO', BGY: 'FCO', BLQ: 'FCO',
  // Scandinavia
  CPH: 'ARN', OSL: 'ARN', HEL: 'ARN', NYO: 'ARN', BGO: 'ARN', GOT: 'ARN',
  // Central / Eastern Europe
  WAW: 'PRG', KRK: 'PRG', BUD: 'PRG', BTS: 'PRG',
  LJU: 'PRG', ZAG: 'PRG', DBV: 'PRG', SPU: 'PRG', OTP: 'PRG',
  // Greece / Cyprus
  SKG: 'ATH', HER: 'ATH', RHO: 'ATH', JTR: 'ATH', LCA: 'ATH', PFO: 'ATH',
  // Turkey
  SAW: 'IST', AYT: 'IST', ESB: 'IST', ASR: 'IST', ADB: 'IST', KYA: 'IST',
  // Japan
  HND: 'NRT', KIX: 'NRT', ITM: 'NRT', NGO: 'NRT', CTS: 'NRT', OKA: 'NRT', FUK: 'NRT',
  // Korea
  GMP: 'ICN', PUS: 'ICN',
  // China / Taiwan
  PEK: 'HKG', PVG: 'HKG', CAN: 'HKG', SZX: 'HKG', CTU: 'HKG', TPE: 'HKG', KHH: 'HKG',
  // SE Asia — Singapore cluster
  KUL: 'SIN', XSP: 'SIN', CGK: 'SIN', DPS: 'SIN', SUB: 'SIN',
  MNL: 'SIN', CEB: 'SIN', CRK: 'SIN', DVO: 'SIN',
  // SE Asia — Bangkok cluster
  DMK: 'BKK', HKT: 'BKK', CNX: 'BKK', USM: 'BKK', RGN: 'BKK',
  // Vietnam
  HAN: 'SGN', DAD: 'SGN', PQC: 'SGN', CXR: 'SGN',
  // India / subcontinent
  BOM: 'DEL', MAA: 'DEL', BLR: 'DEL', CCU: 'DEL', HYD: 'DEL',
  COK: 'DEL', CJB: 'DEL', AMD: 'DEL', JAI: 'DEL',
  MLE: 'DEL', GAN: 'DEL', CMB: 'DEL', KTM: 'DEL',
  // Australia
  MEL: 'SYD', BNE: 'SYD', PER: 'SYD', ADL: 'SYD', CBR: 'SYD', AVV: 'SYD', MEB: 'SYD',
  // New Zealand
  CHC: 'AKL', ZQN: 'AKL', WLG: 'AKL',
  // Middle East
  AUH: 'DXB', DWC: 'DXB', DOH: 'DXB', RUH: 'DXB', KWI: 'DXB',
  AMM: 'DXB', AQJ: 'DXB', BEY: 'DXB', TLV: 'DXB',
  // Africa — North
  CMN: 'CAI', RAK: 'CAI', TUN: 'CAI', LXR: 'CAI', HRG: 'CAI', SSH: 'CAI', MRU: 'CAI',
  // Africa — West
  LOS: 'JNB', ACC: 'JNB', DKR: 'JNB',
  // Africa — East
  DAR: 'NBO', JRO: 'NBO', ZNZ: 'NBO', ADD: 'NBO', MBA: 'NBO',
  // Africa — South
  CPT: 'JNB', DUR: 'JNB',
  // Central America
  SJO: 'BOG', LIR: 'BOG', MGA: 'BOG', GUA: 'BOG', PTY: 'BOG', HAV: 'BOG',
  // South America — Northern
  CTG: 'BOG', MDE: 'BOG', CLO: 'BOG', UIO: 'BOG', GYE: 'BOG',
  // South America — Brazil
  GIG: 'GRU', SDU: 'GRU', FOR: 'GRU', REC: 'GRU', SSA: 'GRU', CWB: 'GRU', POA: 'GRU',
  // South America — Andean
  CUZ: 'LIM', AYP: 'LIM',
  // South America — Southern Cone
  SCL: 'EZE', MVD: 'EZE', USH: 'EZE', BRC: 'EZE', AEP: 'EZE',
  // Caribbean
  MBJ: 'SJU', KIN: 'SJU', PUJ: 'SJU', SDQ: 'SJU', STI: 'SJU',
  STT: 'SJU', SXM: 'SJU', ANU: 'SJU', SLU: 'SJU', SVD: 'SJU',
  AUA: 'SJU', BON: 'SJU', CUR: 'SJU', NAS: 'SJU', GDT: 'SJU',
  PLS: 'SJU', CYB: 'SJU', BGI: 'SJU', BZE: 'SJU',
};

const REGION_DEFAULT_HUB: Record<string, string> = {
  'North America':   'JFK',
  'Europe':          'LHR',
  'Asia Pacific':    'SIN',
  'Middle East':     'DXB',
  'Africa':          'JNB',
  'South America':   'GRU',
  'Caribbean':       'SJU',
  'Central America': 'BOG',
  'Pacific Islands': 'HNL',
};

// ── Airport coordinates (lat, lon) ────────────────────────────────────────────
// Hub airports only. Used for drive-distance detection.
export const AIRPORT_COORDS: Readonly<Record<string, readonly [number, number]>> = {
  JFK: [40.6413, -73.7781], BOS: [42.3656, -71.0096], IAD: [38.9531, -77.4565],
  ATL: [33.6407, -84.4277], MIA: [25.7959, -80.2870], MSY: [29.9934, -90.2580],
  ORD: [41.9742, -87.9073], MSP: [44.8848, -93.2223], DTW: [42.2162, -83.3554],
  STL: [38.7487, -90.3700], DFW: [32.8998, -97.0403], DEN: [39.8561, -104.6737],
  PHX: [33.4373, -112.0078], SLC: [40.7884, -111.9779], LAX: [33.9425, -118.4081],
  SFO: [37.6213, -122.3790], SEA: [47.4502, -122.3088], LAS: [36.0840, -115.1537],
  HNL: [21.3245, -157.9251], YYZ: [43.6777, -79.6248], YVR: [49.1967, -123.1815],
  MEX: [19.4363, -99.0721],  CUN: [21.0365, -86.8771], LHR: [51.4700, -0.4543],
  CDG: [49.0097, 2.5479],    FRA: [50.0379, 8.5622],   AMS: [52.3086, 4.7639],
  MAD: [40.4983, -3.5676],   FCO: [41.8003, 12.2389],  ARN: [59.6519, 17.9186],
  ATH: [37.9364, 23.9445],   LIS: [38.7813, -9.1359],  PRG: [50.1008, 14.2600],
  VIE: [48.1103, 16.5697],   DUB: [53.4264, -6.2499],  IST: [40.9769, 28.8146],
  NRT: [35.7720, 140.3929],  ICN: [37.4602, 126.4407], HKG: [22.3080, 113.9185],
  SIN: [1.3644,  103.9915],  BKK: [13.6900, 100.7501], SGN: [10.8188, 106.6520],
  DEL: [28.5562, 77.1000],   SYD: [-33.9399, 151.1753], AKL: [-37.0082, 174.7850],
  DXB: [25.2528, 55.3644],   JNB: [-26.1367, 28.2411], CAI: [30.1219, 31.4056],
  NBO: [-1.3192,  36.9275],  BOG: [4.7016,  -74.1469], GRU: [-23.4356, -46.4731],
  LIM: [-12.0219, -77.1143], EZE: [-34.8222, -58.5358], SJU: [18.4394, -66.0018],
};

function haversineKm(a: readonly [number, number], b: readonly [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h = sinHalfLat ** 2 + Math.cos(lat1) * Math.cos(lat2) * sinHalfLon ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const DRIVE_THRESHOLD_KM = 320; // ~200 straight-line miles

export interface DriveInfo {
  driveable: boolean;
  driveMiles: number;
  approxHours: number;
}

/**
 * Returns driving feasibility between a departure airport and a set of
 * destination airport codes. Uses hub coordinates for the comparison
 * (destinations list all nearby airports, so the nearest hub match wins).
 */
export function driveableInfo(depAirport: string, destAirportCodes: string[]): DriveInfo {
  const depHub    = getHub(depAirport);
  const depCoords = AIRPORT_COORDS[depHub];
  if (!depCoords) return { driveable: false, driveMiles: 9999, approxHours: 99 };

  let minKm = Infinity;
  for (const code of destAirportCodes) {
    const hub    = getHub(code);
    const coords = AIRPORT_COORDS[hub];
    if (!coords) continue;
    const km = haversineKm(depCoords, coords);
    if (km < minKm) minKm = km;
  }

  const straightMiles = minKm * 0.6214;
  const driveMiles    = Math.round(straightMiles * 1.35);
  const approxHours   = Math.round(driveMiles / 55 * 10) / 10;
  return { driveable: minKm < DRIVE_THRESHOLD_KM, driveMiles, approxHours };
}

export function getHub(iata: string, regionHint?: string): string {
  const code = iata.toUpperCase();
  if ((HUB_AIRPORTS as readonly string[]).includes(code)) return code;
  if (AIRPORT_TO_HUB[code]) return AIRPORT_TO_HUB[code];
  if (regionHint && REGION_DEFAULT_HUB[regionHint]) return REGION_DEFAULT_HUB[regionHint];
  return 'JFK';
}
