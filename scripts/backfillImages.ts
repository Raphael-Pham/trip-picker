/**
 * Backfills missing heroImageUrl values in data/index.json and the
 * corresponding data/destinations/<id>.json files.
 *
 * Usage:
 *   UNSPLASH_ACCESS_KEY=<your_key> npx tsx scripts/backfillImages.ts
 *
 * Get a free key at https://unsplash.com/developers (50 req/hour on free tier).
 * The script processes ~130 destinations in batches, respecting the rate limit.
 */

import fs from 'fs/promises';
import path from 'path';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY ?? '';
const DELAY_MS = 1300; // ~46 req/min — safely under the 50/hour free limit

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY env variable is required.');
  process.exit(1);
}

async function fetchUnsplashImageUrl(query: string): Promise<string | null> {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) {
      console.warn(`  Unsplash returned ${res.status} for "${query}"`);
      return null;
    }
    const data = await res.json() as { results: { urls: { regular: string } }[] };
    return data.results[0]?.urls?.regular ?? null;
  } catch (err) {
    console.warn(`  Fetch error for "${query}":`, err);
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const indexPath  = path.join(process.cwd(), 'data', 'index.json');
  const destDir    = path.join(process.cwd(), 'data', 'destinations');

  const index: any[] = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
  const missing = index.filter(d => !d.heroImageUrl);

  console.log(`Found ${missing.length} destinations missing heroImageUrl (of ${index.length} total).`);
  if (missing.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let updated = 0;
  let failed  = 0;

  for (let i = 0; i < missing.length; i++) {
    const entry = missing[i];
    const query = entry.unsplashQuery ?? entry.city;
    process.stdout.write(`[${i + 1}/${missing.length}] ${entry.city} — "${query}" ... `);

    const url = await fetchUnsplashImageUrl(query);
    if (!url) {
      console.log('no result');
      failed++;
    } else {
      // Update index entry in-place
      const idx = index.findIndex(d => d.id === entry.id);
      if (idx >= 0) index[idx].heroImageUrl = url;

      // Update full destination JSON if it exists
      const destFile = path.join(destDir, `${entry.id}.json`);
      try {
        const dest = JSON.parse(await fs.readFile(destFile, 'utf-8'));
        dest.heroImageUrl = url;
        await fs.writeFile(destFile, JSON.stringify(dest, null, 2));
      } catch {
        // destination file doesn't exist — index-only update is fine
      }

      console.log('ok');
      updated++;
    }

    // Checkpoint index after every entry so partial progress is preserved
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

    if (i < missing.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main().catch(err => { console.error(err); process.exit(1); });
