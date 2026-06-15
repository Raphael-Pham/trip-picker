/**
 * Backfills missing heroImageUrl for destinations that lack one.
 * Run: UNSPLASH_ACCESS_KEY=xxx npx tsx scripts/backfillImages.ts
 *
 * Reads data/index.json, fetches a landscape photo from Unsplash for each
 * destination missing heroImageUrl, then updates both the index and the
 * individual destination JSON file.
 */

import fs from 'fs/promises';
import path from 'path';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY ?? '';
if (!UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY env variable is required.');
  console.error('Get a free key at https://unsplash.com/developers (50 requests/hour on free tier).');
  process.exit(1);
}

const DEST_DIR = path.join(process.cwd(), 'data', 'destinations');
const INDEX_PATH = path.join(process.cwd(), 'data', 'index.json');
const DELAY_MS = 1300; // stay safely under 50 req/hour free tier limit

async function fetchUnsplashUrl(query: string): Promise<string | null> {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) {
      console.warn(`  Unsplash ${res.status} for "${query}"`);
      return null;
    }
    const data = await res.json() as { results: { urls: { regular: string } }[] };
    return data.results[0]?.urls?.regular ?? null;
  } catch (e) {
    console.warn(`  Unsplash fetch error for "${query}":`, e);
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const raw = await fs.readFile(INDEX_PATH, 'utf-8');
  const index = JSON.parse(raw) as Array<Record<string, unknown>>;

  const missing = index.filter(d => !d.heroImageUrl);
  console.log(`Found ${missing.length} destinations without heroImageUrl (${index.length - missing.length} already have one).`);

  if (!missing.length) {
    console.log('Nothing to do.');
    return;
  }

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < missing.length; i++) {
    const entry = missing[i];
    const id = entry.id as string;
    const city = entry.city as string;
    const query = (entry.unsplashQuery as string | undefined) ?? city;

    process.stdout.write(`[${i + 1}/${missing.length}] ${city} — "${query}" … `);

    const imageUrl = await fetchUnsplashUrl(query);

    if (!imageUrl) {
      console.log('FAILED');
      fail++;
    } else {
      entry.heroImageUrl = imageUrl;

      // Update the full destination file too
      const destFile = path.join(DEST_DIR, `${id}.json`);
      try {
        const destRaw = await fs.readFile(destFile, 'utf-8');
        const dest = JSON.parse(destRaw);
        dest.heroImageUrl = imageUrl;
        await fs.writeFile(destFile, JSON.stringify(dest, null, 2));
      } catch {
        // Full file might not exist; index-only update is fine
      }

      console.log('✓');
      ok++;
    }

    // Checkpoint index after every 10 images so progress isn't lost on error
    if ((i + 1) % 10 === 0 || i === missing.length - 1) {
      await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
      console.log(`  → Saved index (${ok} updated, ${fail} failed so far)`);
    }

    if (i < missing.length - 1) await sleep(DELAY_MS);
  }

  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log(`\nDone. ${ok} images backfilled, ${fail} failed.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
