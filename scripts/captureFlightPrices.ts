/**
 * Captures real flight prices from Google Flights into data/flightPrices.json.
 *
 * Run:  npx tsx scripts/captureFlightPrices.ts
 * Args: --airport JFK        (only capture for one departure airport)
 *       --resume             (skip airport+region pairs already in the file)
 *
 * Opens a VISIBLE Chrome window — you can watch it work, solve any CAPTCHA
 * manually, and it will continue automatically.  No headless tricks.
 *
 * Output shape (data/flightPrices.json):
 * {
 *   "JFK": { "NA": 285, "EU": 650, "AP": 830, ... },
 *   "LAX": { ... },
 *   ...
 * }
 *
 * The flightEstimator checks this file first; missing entries fall back to
 * the static regional matrix.
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

// Key departure airports to capture prices from
const DEPARTURE_AIRPORTS = [
  'JFK', // New York (JFK)
  'LAX', // Los Angeles
  'ORD', // Chicago
  'SFO', // San Francisco
  'MIA', // Miami
  'DFW', // Dallas/Fort Worth
  'SEA', // Seattle
  'BOS', // Boston
  'ATL', // Atlanta
  'DEN', // Denver
  'IAD', // Washington DC
  'PHX', // Phoenix
  'MSP', // Minneapolis
  'DTW', // Detroit
  'HNL', // Honolulu (Pacific departure)
];

// One representative destination per region for price calibration
const REGION_SAMPLES: Record<string, { iata: string; label: string }> = {
  NA:  { iata: 'ORD', label: 'Chicago (domestic benchmark)' },
  EU:  { iata: 'LHR', label: 'London' },
  AP:  { iata: 'NRT', label: 'Tokyo' },
  ME:  { iata: 'DXB', label: 'Dubai' },
  AF:  { iata: 'JNB', label: 'Johannesburg' },
  SA:  { iata: 'BOG', label: 'Bogota' },
  CAR: { iata: 'CUN', label: 'Cancun' },
  PAC: { iata: 'HNL', label: 'Honolulu' },
};

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'flightPrices.json');
const RESUME = process.argv.includes('--resume');
const ONLY_AIRPORT = (() => {
  const idx = process.argv.indexOf('--airport');
  return idx >= 0 ? process.argv[idx + 1]?.toUpperCase() : null;
})();

// Trip: 7 nights starting ~6 weeks from today (enough lead time for realistic fares)
function getTripDates(): { depart: string; ret: string } {
  const d = new Date();
  d.setDate(d.getDate() + 42); // 6 weeks out
  const depart = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + 7);
  const ret = d.toISOString().slice(0, 10);
  return { depart, ret };
}

// ── Google Flights scraper ────────────────────────────────────────────────────

async function fetchPrice(
  page: import('playwright').Page,
  origin: string,
  dest: string,
  depart: string,
  ret: string,
): Promise<number | null> {
  const url = `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${depart}+returning+${ret}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for flight results to populate (prices appear in these elements)
  try {
    await page.waitForSelector('[data-price], .YMlIz, .qx27Je, .Rj2Mlc', {
      timeout: 20000,
    });
  } catch {
    // Selector might have changed; try waiting a bit longer for any price text
    await page.waitForTimeout(5000);
  }

  // Try multiple selector strategies — Google Flights changes its DOM frequently
  const priceSelectors = [
    '[data-price]',           // data attribute
    '.YMlIz',                 // price in result list
    '.qx27Je',                // price chip
    '.Rj2Mlc',                // price in calendar
    '[aria-label*="$"]',      // any element with $ in aria-label
  ];

  const prices: number[] = [];

  for (const sel of priceSelectors) {
    const elements = await page.$$(sel);
    for (const el of elements) {
      const text = await el.getAttribute('data-price')
        ?? await el.textContent()
        ?? '';
      const match = text.replace(/,/g, '').match(/\$?(\d{2,5})/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val >= 50 && val <= 10000) prices.push(val);
      }
    }
    if (prices.length > 0) break;
  }

  // Also scrape page text as fallback
  if (!prices.length) {
    const bodyText = await page.evaluate(() => document.body.innerText);
    const matches = [...bodyText.matchAll(/\$(\d{2,5})/g)];
    for (const m of matches) {
      const val = parseInt(m[1], 10);
      if (val >= 50 && val <= 10000) prices.push(val);
    }
  }

  if (!prices.length) return null;
  return Math.min(...prices); // return the cheapest price found
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Load existing data if resuming
  let data: Record<string, Record<string, number>> = {};
  if (RESUME) {
    try {
      data = JSON.parse(await fs.readFile(OUTPUT_PATH, 'utf-8'));
      console.log('Resuming from existing data.');
    } catch {
      console.log('No existing data found, starting fresh.');
    }
  }

  const { depart, ret } = getTripDates();
  console.log(`\nCapturing prices for a 7-night trip departing ${depart}, returning ${ret}`);
  console.log('A Chrome window will open — do not close it.\n');

  const airports = ONLY_AIRPORT ? [ONLY_AIRPORT] : DEPARTURE_AIRPORTS;
  const regions = Object.keys(REGION_SAMPLES);

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({
    viewport: null, // use maximized window size
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let saved = 0;
  let failed = 0;

  for (const airport of airports) {
    data[airport] ??= {};

    for (const region of regions) {
      // Skip same-airport searches (e.g., HNL→PAC where sample is HNL)
      const sample = REGION_SAMPLES[region];
      if (airport === sample.iata) {
        data[airport][region] = 0; // same city — no flight needed
        continue;
      }

      if (RESUME && data[airport][region] != null) {
        console.log(`  ↷ ${airport}→${region} already captured ($${data[airport][region]})`);
        continue;
      }

      process.stdout.write(`  ${airport} → ${region} (${sample.label}) … `);

      try {
        const price = await fetchPrice(page, airport, sample.iata, depart, ret);

        if (price) {
          data[airport][region] = price;
          console.log(`$${price}`);
          saved++;
        } else {
          console.log('no price found (will use matrix fallback)');
          failed++;
        }
      } catch (e) {
        console.log(`ERROR: ${(e as Error).message?.slice(0, 60)}`);
        failed++;
      }

      // Checkpoint after every entry
      await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
      await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));

      // Polite delay between searches (3–6 seconds, randomised)
      await page.waitForTimeout(3000 + Math.random() * 3000);
    }

    console.log(`  ✓ ${airport} done — checkpoint saved\n`);
  }

  await browser.close();

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`\nDone. ${saved} prices captured, ${failed} failed.`);
  console.log(`Saved to ${OUTPUT_PATH}`);
  console.log('\nCommit the result: git add data/flightPrices.json && git commit -m "Update flight price snapshots"');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
