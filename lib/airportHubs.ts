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

export function getHub(iata: string, regionHint?: string): string {
  const code = iata.toUpperCase();
  if ((HUB_AIRPORTS as readonly string[]).includes(code)) return code;
  if (AIRPORT_TO_HUB[code]) return AIRPORT_TO_HUB[code];
  if (regionHint && REGION_DEFAULT_HUB[regionHint]) return REGION_DEFAULT_HUB[regionHint];
  return 'JFK';
}
