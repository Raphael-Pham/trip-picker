/**
 * Captures real flight prices from Google Flights into data/flightPrices/<HUB>.json.
 *
 * Architecture:
 *   - 48 "hub" airports, geographically distributed, cover all 373 airports in
 *     data/index.json via a nearest-hub mapping (see AIRPORT_TO_HUB / getHub()).
 *   - Destinations are loaded live from data/index.json (every unique IATA code).
 *   - Each hub gets its own file: data/flightPrices/JFK.json = { NRT: 850, LHR: 620 }
 *   - flightEstimator.ts maps any departure airport -> hub -> dest price.
 *
 * Usage:
 *   npm run capture:flights                          # all hubs
 *   npm run capture:flights -- --hub JFK,LAX         # specific hubs only
 *   npm run capture:flights -- --group 0 --total 7   # CI matrix shard (group 0 of 7)
 *   npm run capture:flights -- --resume              # skip already-captured pairs
 *   npm run capture:flights -- --concurrency 6       # parallel browsers (default 4)
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// ── Hub airports ───────────────────────────────────────────────────────────────
// One per geographic cluster. All 373+ destination airports map to a hub via
// AIRPORT_TO_HUB or fall back to REGION_DEFAULT_HUB.

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

// ── Airport → nearest hub ──────────────────────────────────────────────────────

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

/** Map any IATA code to its pricing hub. Exported for use by flightEstimator. */
export function getHub(iata: string, regionHint?: string): string {
  const code = iata.toUpperCase();
  if ((HUB_AIRPORTS as readonly string[]).includes(code)) return code;
  if (AIRPORT_TO_HUB[code]) return AIRPORT_TO_HUB[code];
  if (regionHint && REGION_DEFAULT_HUB[regionHint]) return REGION_DEFAULT_HUB[regionHint];
  return 'JFK';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function loadDestinations(): Promise<Array<{ iata: string; label: string }>> {
  const index: Array<{ city: string; country: string; airportCodes: string[] }> =
    JSON.parse(await fs.readFile(path.join(process.cwd(), 'data', 'index.json'), 'utf-8'));
  const seen = new Set<string>();
  const dests: Array<{ iata: string; label: string }> = [];
  for (const d of index) {
    for (const raw of d.airportCodes ?? []) {
      const iata = raw.toUpperCase();
      if (!seen.has(iata)) {
        seen.add(iata);
        dests.push({ iata, label: `${d.city}, ${d.country}` });
      }
    }
  }
  return dests;
}

function argVal(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

function getTripDates() {
  const d = new Date();
  d.setDate(d.getDate() + 42);
  const depart = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + 7);
  return { depart, ret: d.toISOString().slice(0, 10) };
}

async function fetchPrice(
  page: import('playwright').Page,
  origin: string, dest: string, depart: string, ret: string,
): Promise<number | null> {
  const url =
    `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${depart}+returning+${ret}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await page.waitForSelector('[data-price], .YMlIz, .qx27Je, .Rj2Mlc', { timeout: 18000 });
  } catch {
    await page.waitForTimeout(4000);
  }
  const prices: number[] = [];
  for (const sel of ['[data-price]', '.YMlIz', '.qx27Je', '.Rj2Mlc', '[aria-label*="$"]']) {
    for (const el of await page.$$(sel)) {
      const text = (await el.getAttribute('data-price')) ?? (await el.textContent()) ?? '';
      const m = text.replace(/,/g, '').match(/\$?(\d{2,5})/);
      if (m) { const v = parseInt(m[1], 10); if (v >= 50 && v <= 12000) prices.push(v); }
    }
    if (prices.length) break;
  }
  if (!prices.length) {
    const body = await page.evaluate(() => document.body.innerText);
    for (const m of body.matchAll(/\$(\d{2,5})/g)) {
      const v = parseInt(m[1], 10);
      if (v >= 50 && v <= 12000) prices.push(v);
    }
  }
  return prices.length ? Math.min(...prices) : null;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const RESUME      = process.argv.includes('--resume');
  const specificHub = argVal('--hub')?.split(',').map(h => h.trim().toUpperCase()) ?? null;
  const groupIdx    = argVal('--group') != null ? parseInt(argVal('--group')!, 10) : null;
  const totalGroups = parseInt(argVal('--total') ?? '1', 10);
  const CONCURRENCY = parseInt(argVal('--concurrency') ?? '4', 10);
  const OUTPUT_DIR  = path.join(process.cwd(), 'data', 'flightPrices');

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const dests = await loadDestinations();
  const { depart, ret } = getTripDates();

  let hubs: string[];
  if (specificHub) {
    hubs = specificHub;
  } else if (groupIdx !== null) {
    hubs = [...HUB_AIRPORTS].filter((_, i) => i % totalGroups === groupIdx);
  } else {
    hubs = [...HUB_AIRPORTS];
  }

  console.log(`\n✈  Flight price capture`);
  console.log(`   Hubs: ${hubs.length} | Destinations: ${dests.length} | Parallel: ${CONCURRENCY}`);
  if (groupIdx !== null) console.log(`   CI shard: group ${groupIdx + 1}/${totalGroups}`);
  console.log(`   Dates: ${depart} -> ${ret}\n`);

  // Load existing data and build work queue
  const hubData = new Map<string, Record<string, number>>();
  const queue: Array<{ hub: string; dest: { iata: string; label: string } }> = [];

  for (const hub of hubs) {
    let existing: Record<string, number> = {};
    try {
      existing = JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, `${hub}.json`), 'utf-8'));
    } catch { /* new hub */ }
    hubData.set(hub, existing);
    for (const dest of dests) {
      if (dest.iata === hub) continue;
      if (RESUME && existing[dest.iata] != null) continue;
      queue.push({ hub, dest });
    }
  }

  queue.sort(() => Math.random() - 0.5); // shuffle so tabs hit different hubs
  const total = queue.length;
  if (total === 0) {
    console.log('All pairs captured. Run without --resume to refresh.');
    return;
  }
  console.log(`${total} searches queued.\n`);

  let queuePos = 0;
  let captured = 0;
  let missed   = 0;

  async function checkpoint(hub: string) {
    await fs.writeFile(
      path.join(OUTPUT_DIR, `${hub}.json`),
      JSON.stringify(hubData.get(hub), null, 2),
    );
  }

  async function runBrowser(browserId: number) {
    const browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    });
    const ctx = await browser.newContext({
      viewport: null,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();

    while (true) {
      const i = queuePos++;
      if (i >= queue.length) break;
      const { hub, dest } = queue[i];
      process.stdout.write(`[${browserId}] ${hub}->${dest.iata} (${dest.label}) ... `);
      try {
        const price = await fetchPrice(page, hub, dest.iata, depart, ret);
        if (price) {
          hubData.get(hub)![dest.iata] = price;
          console.log(`$${price}  (${i + 1}/${total})`);
          captured++;
        } else {
          console.log(`no price  (${i + 1}/${total})`);
          missed++;
        }
        await checkpoint(hub);
      } catch (e) {
        console.log(`err: ${(e as Error).message?.slice(0, 60)}`);
        missed++;
      }
      await page.waitForTimeout(1500 + Math.random() * 2000);
    }
    await browser.close();
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => runBrowser(i + 1)));

  console.log(`\nDone: ${captured} captured, ${missed} without price (matrix fallback).`);
  console.log(`Output: ${OUTPUT_DIR}/`);
  console.log('Commit: git add data/flightPrices/ && git commit -m "Weekly flight price update"');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
