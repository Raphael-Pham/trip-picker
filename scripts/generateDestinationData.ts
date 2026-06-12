/**
 * Generates 300+ destination JSON files using the Claude API.
 * Run: npx tsx scripts/generateDestinationData.ts
 * Resume: npx tsx scripts/generateDestinationData.ts --resume
 *
 * Requires: ANTHROPIC_API_KEY env variable.
 * Optional: UNSPLASH_ACCESS_KEY env variable (from free app at unsplash.com/developers).
 *   If set, fetches a real hero image URL per destination and stores it in the JSON.
 *   If not set, falls back to a generic landscape photo.
 * Estimated cost: ~$0.04 for all 300 destinations at claude-haiku-4-5 pricing.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY ?? '';
const RESUME = process.argv.includes('--resume');
const BATCH_SIZE = 5;
const DELAY_MS = 1500;

const DESTINATION_SEEDS: string[] = [
  // USA — Cities
  'New York City, USA', 'Los Angeles, USA', 'Chicago, USA', 'Miami, USA', 'New Orleans, USA',
  'San Francisco, USA', 'Seattle, USA', 'Portland, USA', 'Austin, USA', 'Nashville, USA',
  'Denver, USA', 'Las Vegas, USA', 'Honolulu, USA', 'Savannah, USA', 'Charleston, USA',
  'Boston, USA', 'Washington DC, USA', 'Philadelphia, USA', 'San Diego, USA', 'Phoenix, USA',
  'Atlanta, USA', 'Minneapolis, USA', 'Detroit, USA', 'Kansas City, USA', 'Salt Lake City, USA',
  'Albuquerque, USA', 'Tucson, USA', 'Boise, USA', 'Asheville, USA', 'Memphis, USA',
  'Pittsburgh, USA', 'Cleveland, USA', 'Cincinnati, USA', 'Louisville, USA', 'Indianapolis, USA',
  'Columbus, USA', 'Richmond, USA', 'Baltimore, USA', 'Tampa, USA', 'Orlando, USA',

  // USA — Nature & Regions
  'Sedona, USA', 'Moab, USA', 'Jackson Hole, USA', 'Glacier National Park, USA',
  'Yellowstone, USA', 'Grand Canyon, USA', 'Zion National Park, USA', 'Yosemite, USA',
  'Great Smoky Mountains, USA', 'Acadia National Park, USA', 'Napa Valley, USA',
  'Big Sur, USA', 'Outer Banks, USA', 'Florida Keys, USA', 'Lake Tahoe, USA',
  'Finger Lakes, USA', 'Sonoma County, USA', 'Williamsburg, USA', 'Scottsdale, USA',

  // Canada
  'Vancouver, Canada', 'Toronto, Canada', 'Montreal, Canada', 'Quebec City, Canada',
  'Banff, Canada', 'Victoria, Canada', 'Calgary, Canada',

  // Mexico & Caribbean (popular with US travelers)
  'Cancun, Mexico', 'Tulum, Mexico', 'Mexico City, Mexico', 'Los Cabos, Mexico',
  'Puerto Vallarta, Mexico', 'Oaxaca, Mexico', 'Playa del Carmen, Mexico',
  'Punta Cana, Dominican Republic', 'Montego Bay, Jamaica', 'San Juan, Puerto Rico',
  'Nassau, Bahamas', 'Aruba', 'St. Lucia', 'Turks and Caicos',
  'Cayman Islands', 'Barbados', 'St. Thomas, US Virgin Islands',

  // Costa Rica & Central America
  'San Jose, Costa Rica', 'Manuel Antonio, Costa Rica', 'Tamarindo, Costa Rica',
  'Antigua, Guatemala', 'Belize City, Belize',

  // South America (popular destinations)
  'Cartagena, Colombia', 'Medellin, Colombia',
  'Machu Picchu, Peru', 'Cusco, Peru', 'Lima, Peru',
  'Buenos Aires, Argentina', 'Patagonia, Argentina',
  'Rio de Janeiro, Brazil',

  // Western Europe (most popular with Americans)
  'London, England', 'Paris, France', 'Rome, Italy', 'Barcelona, Spain', 'Amsterdam, Netherlands',
  'Lisbon, Portugal', 'Dublin, Ireland', 'Edinburgh, Scotland', 'Berlin, Germany', 'Munich, Germany',
  'Vienna, Austria', 'Prague, Czech Republic', 'Budapest, Hungary', 'Copenhagen, Denmark',
  'Stockholm, Sweden', 'Reykjavik, Iceland', 'Santorini, Greece', 'Athens, Greece',
  'Florence, Italy', 'Venice, Italy', 'Amalfi Coast, Italy', 'Porto, Portugal',
  'Dubrovnik, Croatia', 'Interlaken, Switzerland', 'Lake Bled, Slovenia',

  // Asia Pacific (top picks for American travelers)
  'Tokyo, Japan', 'Kyoto, Japan', 'Osaka, Japan', 'Bali, Indonesia', 'Bangkok, Thailand',
  'Singapore, Singapore', 'Seoul, South Korea', 'Sydney, Australia', 'Melbourne, Australia',
  'Queenstown, New Zealand', 'Maldives', 'Phuket, Thailand', 'Hong Kong',
  'Taipei, Taiwan', 'Hanoi, Vietnam', 'Hoi An, Vietnam',

  // Middle East & Africa (top picks)
  'Dubai, UAE', 'Marrakech, Morocco', 'Cape Town, South Africa',
  'Petra, Jordan', 'Istanbul, Turkey', 'Cappadocia, Turkey',
  'Cairo, Egypt', 'Zanzibar, Tanzania', 'Serengeti, Tanzania',
];

function toId(seed: string): string {
  return seed.toLowerCase()
    .split(',')[0]
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SCHEMA_HINT = `{
  "id": "string (kebab-case city name)",
  "city": "string",
  "country": "string",
  "region": "one of: Asia Pacific | Europe | Middle East | Africa | North America | South America | Caribbean | Pacific Islands",
  "airportCodes": ["array of real IATA codes (1-3 nearest major airports)"],
  "hiddenGem": true/false,
  "tripStyles": ["array of: standard | surprise | hidden-gems | photography | foodie | adventure | relaxation"],
  "scores": {
    "cost": 0-100 (100=very cheap, 0=very expensive),
    "food": 0-100,
    "photography": 0-100,
    "activities": 0-100,
    "weather": 0-100
  },
  "budgetRanges": [
    { "level": "budget", "minPerDayUSD": number, "maxPerDayUSD": number },
    { "level": "mid",    "minPerDayUSD": number, "maxPerDayUSD": number },
    { "level": "luxury", "minPerDayUSD": number, "maxPerDayUSD": number }
  ],
  "unsplashQuery": "2-4 word Unsplash search query for hero image",
  "summary": "2-3 sentence compelling destination description",
  "restaurants": [
    { "name": "string", "category": "Budget|Midrange|Fine Dining|Local Specialty", "priceRange": "$|$$|$$$|$$$$", "description": "1-2 sentences", "mustTry": "optional signature dish" }
  ],
  "activities": [
    { "name": "string", "category": "Outdoor|Indoor|Cultural|Family|Nightlife|Adventure", "description": "1-2 sentences", "durationHours": number, "estimatedCostUSD": number, "bestFor": ["array of tripStyles"] }
  ],
  "photography": {
    "spots": [
      { "name": "string", "description": "1 sentence", "difficulty": "Beginner|Intermediate|Advanced", "bestTime": "string", "category": "Street|Architecture|Landscape|Wildlife|Night" }
    ],
    "sunriseSpots": ["3 location names"],
    "sunsetSpots": ["3 location names"],
    "lensRecommendations": ["3-4 lens suggestions with use-case"],
    "goldenHourNotes": "2-3 sentences",
    "overallDifficulty": "Beginner|Intermediate|Advanced"
  },
  "weather": {
    "monthly": [
      { "month": 1-12, "avgTempC": number, "rainfallMM": number }
    ],
    "bestMonths": [array of month numbers 1-12],
    "seasonality": "1-2 sentences",
    "summary": "1-2 sentences"
  },
  "hotels": [
    { "name": "string", "neighborhood": "string", "pricePerNightUSD": number, "category": "Budget|Mid-range|Luxury", "description": "1 sentence" }
  ]
}`;

async function generateDestination(seed: string): Promise<object> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    system: 'You are a travel data expert. Output ONLY valid JSON matching the exact schema provided. No prose, no markdown, no explanation. Ensure all array minimums are met: 12 restaurants, 12 activities, 10 photo spots, 3 sunrise spots, 3 sunset spots, 12 monthly weather entries, 3 hotels. CRITICAL: Your response must be complete, valid JSON. Never truncate mid-string.',
    messages: [{
      role: 'user',
      content: `Generate a complete travel destination JSON for "${seed}".

Schema:
${SCHEMA_HINT}

Requirements:
- scores reflect real-world quality (cost score 100=very cheap destination, 0=very expensive)
- budgetRanges use realistic USD per person per day including accommodation
- restaurants: exactly 12 entries, realistic mix of categories
- activities: exactly 12 entries, include free options
- photography.spots: exactly 10 entries
- photography sunrise/sunset: exactly 3 each
- weather.monthly: all 12 months
- hotels: exactly 3 entries (one per category)
- airportCodes: real IATA codes only

Output only the JSON object, no other text.`,
    }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  // Strip markdown code fences if present
  const jsonStr = raw.startsWith('```') ? raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '') : raw;
  return JSON.parse(jsonStr);
}

async function fetchUnsplashImageUrl(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { results: { urls: { regular: string } }[] };
    return data.results[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const destDir = path.join(process.cwd(), 'data', 'destinations');
  const indexPath = path.join(process.cwd(), 'data', 'index.json');

  await fs.mkdir(destDir, { recursive: true });

  // Load existing index if resuming
  let index: object[] = [];
  if (RESUME) {
    try {
      const raw = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(raw);
      console.log(`Resuming: ${index.length} destinations already in index.`);
    } catch {
      console.log('No existing index found, starting fresh.');
    }
  }

  const existingIds = new Set(index.map((d: any) => d.id));
  const pending = DESTINATION_SEEDS.filter(seed => !existingIds.has(toId(seed)));

  console.log(`Generating ${pending.length} destinations (${DESTINATION_SEEDS.length - pending.length} already done)...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(', ')}`);

    const results = await Promise.allSettled(batch.map(seed => generateDestination(seed)));

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const seed = batch[j];

      if (result.status === 'fulfilled') {
        const dest = result.value as any;
        const id = dest.id ?? toId(seed);
        dest.id = id;

        // Fetch and bake in Unsplash hero image URL
        const heroImageUrl = await fetchUnsplashImageUrl(dest.unsplashQuery ?? seed);
        if (heroImageUrl) {
          dest.heroImageUrl = heroImageUrl;
          console.log(`  📷 Got Unsplash image for ${dest.city}`);
        }

        // Write full destination file
        await fs.writeFile(
          path.join(destDir, `${id}.json`),
          JSON.stringify(dest, null, 2),
        );

        // Add lightweight index entry
        const indexEntry: any = {
          id: dest.id,
          city: dest.city,
          country: dest.country,
          region: dest.region,
          airportCodes: dest.airportCodes,
          hiddenGem: dest.hiddenGem,
          tripStyles: dest.tripStyles,
          scores: dest.scores,
          budgetRanges: dest.budgetRanges,
          unsplashQuery: dest.unsplashQuery,
          heroImageUrl: dest.heroImageUrl,
          summary: dest.summary,
        };

        // Update or add
        const existIdx = index.findIndex((d: any) => d.id === id);
        if (existIdx >= 0) {
          index[existIdx] = indexEntry;
        } else {
          index.push(indexEntry);
        }

        successCount++;
        console.log(`  ✓ ${dest.city}, ${dest.country}`);
      } else {
        errorCount++;
        console.error(`  ✗ ${seed}: ${(result as PromiseRejectedResult).reason?.message ?? 'unknown error'}`);
      }
    }

    // Checkpoint index after every batch
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

    if (i + BATCH_SIZE < pending.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅ Done. ${successCount} generated, ${errorCount} failed.`);
  console.log(`📁 Index now contains ${index.length} destinations.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
