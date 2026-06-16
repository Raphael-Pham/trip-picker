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
import { HUB_AIRPORTS, AIRPORT_TO_HUB, getHub } from '../lib/airportHubs';

// Re-export so existing callers of this script's exports still work
export { HUB_AIRPORTS, AIRPORT_TO_HUB, getHub };

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

export interface PriceEntry {
  min: number;
  median: number;
  max: number;
  samples: number;
}

/**
 * Scrapes a Google Flights results page and returns min/median/max from the
 * visible fare list (typically 5-20 options shown above the fold).
 * Storing the range lets the UI show "~$420–$680" instead of a single number.
 */
async function fetchPriceRange(
  page: import('playwright').Page,
  origin: string, dest: string, depart: string, ret: string,
): Promise<PriceEntry | null> {
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
  if (!prices.length) return null;

  prices.sort((a, b) => a - b);
  const min    = prices[0];
  const median = prices[Math.floor(prices.length / 2)];
  // Cap "max" at the 80th-percentile shown price — extreme outliers aren't useful
  const p80idx = Math.min(prices.length - 1, Math.floor(prices.length * 0.8));
  const max    = prices[p80idx];
  return { min, median, max, samples: prices.length };
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
  const hubData = new Map<string, Record<string, PriceEntry>>();
  const queue: Array<{ hub: string; dest: { iata: string; label: string } }> = [];

  for (const hub of hubs) {
    let existing: Record<string, PriceEntry> = {};
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
        const entry = await fetchPriceRange(page, hub, dest.iata, depart, ret);
        if (entry) {
          hubData.get(hub)![dest.iata] = entry;
          console.log(`$${entry.min}–$${entry.max} (median $${entry.median}, ${entry.samples} samples)  (${i + 1}/${total})`);
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
