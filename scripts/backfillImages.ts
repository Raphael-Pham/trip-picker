/**
 * Backfills missing heroImageUrl values in data/index.json and the
 * corresponding data/destinations/<id>.json files.
 *
 * Usage:
 *   UNSPLASH_ACCESS_KEY=<your_key> npx tsx scripts/backfillImages.ts
 *
 * Get a free key at https://unsplash.com/developers (50 req/hour on free tier).
 * On 403/429 rate-limit responses the script pauses 65 s and retries automatically.
 * Already-filled entries are skipped, so you can re-run safely after a Ctrl+C.
 */

import fs from 'fs/promises';
import path from 'path';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY ?? '';
const BETWEEN_REQ_MS  = 1_300;   // normal gap between requests
const RATE_LIMIT_WAIT = 65_000;  // wait this long when Unsplash says 403/429

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY env variable is required.');
  process.exit(1);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRateLimit(query: string): Promise<string | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;

  for (let attempt = 0; attempt < 5; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
    } catch (err) {
      console.warn(`\n  Network error:`, err);
      return null;
    }

    if (res.status === 403 || res.status === 429) {
      process.stdout.write(`\n  Rate limited (${res.status}). Pausing ${RATE_LIMIT_WAIT / 1000}s ... `);
      await sleep(RATE_LIMIT_WAIT);
      continue; // retry
    }

    if (!res.ok) return null;

    const data = await res.json() as { results: { urls: { regular: string } }[] };
    return data.results[0]?.urls?.regular ?? null;
  }

  return null; // exhausted retries
}

async function main() {
  const indexPath = path.join(process.cwd(), 'data', 'index.json');
  const destDir   = path.join(process.cwd(), 'data', 'destinations');

  const index: any[] = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
  const missing = index.filter(d => !d.heroImageUrl);

  console.log(`Found ${missing.length} destinations missing heroImageUrl (of ${index.length} total).`);
  if (missing.length === 0) { console.log('Nothing to do.'); return; }

  let updated = 0;
  let failed  = 0;

  for (let i = 0; i < missing.length; i++) {
    const entry = missing[i];
    const query = entry.unsplashQuery ?? entry.city;
    process.stdout.write(`[${i + 1}/${missing.length}] ${entry.city} — "${query}" ... `);

    const imageUrl = await fetchWithRateLimit(query);

    if (!imageUrl) {
      console.log('no result');
      failed++;
    } else {
      const idx = index.findIndex(d => d.id === entry.id);
      if (idx >= 0) index[idx].heroImageUrl = imageUrl;

      const destFile = path.join(destDir, `${entry.id}.json`);
      try {
        const dest = JSON.parse(await fs.readFile(destFile, 'utf-8'));
        dest.heroImageUrl = imageUrl;
        await fs.writeFile(destFile, JSON.stringify(dest, null, 2));
      } catch { /* destination file missing — index-only update is fine */ }

      console.log('ok');
      updated++;
    }

    // Checkpoint after every entry so partial progress survives Ctrl+C
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

    if (i < missing.length - 1) await sleep(BETWEEN_REQ_MS);
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main().catch(err => { console.error(err); process.exit(1); });
