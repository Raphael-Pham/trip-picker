/**
 * Live price and weather enrichment using free, no-auth public APIs:
 *  - Teleport (api.teleport.org): cost-of-living index + meal prices
 *  - Open-Meteo (api.open-meteo.com / archive-api.open-meteo.com): weather forecasts
 *  - Xotelo (data.xotelo.com): TripAdvisor-backed hotel prices
 *  - Open Exchange Rates (open.er-api.com): USD FX rates
 *
 * All calls are best-effort with a hard timeout. On failure, callers fall back to static estimates.
 */

import type { LiveCityData } from './types';

const TIMEOUT_MS = 5000;

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('live-data timeout')), TIMEOUT_MS)
    ),
  ]);
}

// ── Teleport ─────────────────────────────────────────────────────────────────

interface TeleportResult {
  lat: number;
  lon: number;
  costOfLivingScore: number; // Teleport 0–10 scale, higher = more expensive
  foodPerDayUSD: number | null;
}

async function fetchTeleport(city: string, country: string): Promise<TeleportResult | null> {
  try {
    const q = encodeURIComponent(`${city} ${country}`);
    const res = await withTimeout(
      fetch(`https://api.teleport.org/api/cities/?search=${q}&embed=city%3Asearch-results%2Fcity%3Aitem&limit=1`)
    );
    if (!res.ok) return null;

    const json = await res.json();
    const item = json._embedded?.['city:search-results']?.[0]?._embedded?.['city:item'];
    if (!item) return null;

    const lat: number | undefined = item.location?.latlon?.latitude;
    const lon: number | undefined = item.location?.latlon?.longitude;
    if (!lat || !lon) return null;

    const uaHref: string | undefined = item._links?.['city:urban_area']?.href;
    if (!uaHref) return { lat, lon, costOfLivingScore: 5, foodPerDayUSD: null };

    // Fetch scores and details in parallel
    const [scoresRes, detailsRes] = await Promise.all([
      withTimeout(fetch(`${uaHref}scores/`)).catch(() => null),
      withTimeout(fetch(`${uaHref}details/`)).catch(() => null),
    ]);

    let costOfLivingScore = 5;
    if (scoresRes?.ok) {
      const scores = await scoresRes.json();
      const category = (scores.categories as Array<{ id: string; score_out_of_10: number }> | undefined)
        ?.find(c => c.id === 'COST_OF_LIVING');
      if (category) costOfLivingScore = category.score_out_of_10;
    }

    let foodPerDayUSD: number | null = null;
    if (detailsRes?.ok) {
      const details = await detailsRes.json();
      const costCat = (details.categories as Array<{ id: string; data: Array<{ id: string; currency_dollar_value?: number }> }> | undefined)
        ?.find(c => c.id === 'COST_OF_LIVING');

      if (costCat) {
        const byId = Object.fromEntries(
          costCat.data
            .filter(d => d.currency_dollar_value != null)
            .map(d => [d.id, d.currency_dollar_value as number])
        );
        const cheap = byId['COST_MEAL_INEXPENSIVE'];
        const midFor2 = byId['COST_MEAL_MID_RANGE'];
        if (cheap && midFor2) {
          // Estimate one day: breakfast (~50% of cheap meal) + cheap lunch + mid-range dinner per person
          foodPerDayUSD = Math.round(cheap * 0.5 + cheap + midFor2 / 2);
        }
      }
    }

    return { lat, lon, costOfLivingScore, foodPerDayUSD };
  } catch {
    return null;
  }
}

// ── Open-Meteo ───────────────────────────────────────────────────────────────

export interface WeatherForecast {
  avgTempC: number;
  precipDays: number;
  score: number;      // 0–100
  summary: string;
  isHistorical: boolean; // true = last year's data used as seasonal proxy
}

function computeWeatherScore(avgTempC: number, precipDays: number, totalDays: number): number {
  // Temperature comfort: ideal 18–26°C
  let tempScore: number;
  if (avgTempC >= 18 && avgTempC <= 26) {
    tempScore = 100;
  } else if (avgTempC >= 10 && avgTempC < 18) {
    tempScore = 60 + ((avgTempC - 10) / 8) * 40;
  } else if (avgTempC > 26 && avgTempC <= 32) {
    tempScore = 60 + ((32 - avgTempC) / 6) * 40;
  } else if (avgTempC < 10) {
    tempScore = Math.max(0, 60 - (10 - avgTempC) * 6);
  } else {
    tempScore = Math.max(0, 60 - (avgTempC - 32) * 6);
  }

  // Rain penalty: 0 rainy days = 100, all days rainy = 40
  const rainScore = 100 - (precipDays / Math.max(totalDays, 1)) * 60;
  return Math.min(100, Math.max(0, Math.round(tempScore * 0.6 + rainScore * 0.4)));
}

async function fetchWeather(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<WeatherForecast | null> {
  try {
    const today = new Date();
    const tripStart = new Date(startDate + 'T00:00:00');
    const daysAhead = (tripStart.getTime() - today.getTime()) / 86400000;

    let apiUrl: string;
    let fetchStart: string;
    let fetchEnd: string;
    let isHistorical = false;

    if (daysAhead <= 14) {
      // Near-term: use the 16-day forecast API
      fetchStart = startDate;
      fetchEnd = endDate;
      apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&start_date=${fetchStart}&end_date=${fetchEnd}&timezone=auto`;
    } else {
      // Further out: use last year's historical data as a seasonal proxy
      const prevYear = tripStart.getFullYear() - 1;
      fetchStart = `${prevYear}${startDate.slice(4)}`;
      fetchEnd = `${prevYear}${endDate.slice(4)}`;
      apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&start_date=${fetchStart}&end_date=${fetchEnd}&timezone=auto`;
      isHistorical = true;
    }

    const res = await withTimeout(fetch(apiUrl));
    if (!res.ok) return null;

    const data = await res.json();
    const maxArr: number[] | undefined = data.daily?.temperature_2m_max;
    const minArr: number[] | undefined = data.daily?.temperature_2m_min;
    const precipArr: number[] | undefined = data.daily?.precipitation_sum;
    if (!maxArr?.length || !minArr?.length || !precipArr?.length) return null;

    const n = maxArr.length;
    const avgTemp = maxArr.reduce((s, v, i) => s + (v + minArr[i]) / 2, 0) / n;
    const precipDays = precipArr.filter(mm => mm != null && mm > 1).length;
    const score = computeWeatherScore(avgTemp, precipDays, n);
    const tempRounded = Math.round(avgTemp);

    return {
      avgTempC: tempRounded,
      precipDays,
      score,
      summary: `Avg ${tempRounded}°C · ${precipDays} rainy day${precipDays !== 1 ? 's' : ''}${isHistorical ? ' (typical)' : ''}`,
      isHistorical,
    };
  } catch {
    return null;
  }
}

// ── Xotelo (TripAdvisor-backed hotel prices) ─────────────────────────────────

async function fetchXoteloPrice(
  city: string,
  country: string,
  checkin: string,
  checkout: string,
): Promise<number | null> {
  try {
    // Search returns a list of hotels matching the query
    const query = encodeURIComponent(`${city} ${country}`);
    const searchRes = await withTimeout(
      fetch(`https://data.xotelo.com/api/search?query=${query}`)
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    // Response shape: { result: { list: [{ hotel_key, location_key, name, ... }] } }
    const hotels: Array<{ hotel_key: string; location_key?: string }> =
      searchData.result?.list ?? [];

    if (!hotels.length) return null;

    // If we have a location_key, fetch more hotels in that area for better median
    let hotelKeys = hotels.slice(0, 3).map(h => h.hotel_key);
    const locationKey = hotels[0]?.location_key;

    if (locationKey) {
      const listRes = await withTimeout(
        fetch(`https://data.xotelo.com/api/list?location_key=${locationKey}&limit=8`)
      ).catch(() => null);
      if (listRes?.ok) {
        const listData = await listRes.json();
        const listed: Array<{ hotel_key: string }> = listData.result?.list ?? [];
        if (listed.length) hotelKeys = listed.slice(0, 5).map(h => h.hotel_key);
      }
    }

    // Fetch rates for all candidate hotels in parallel
    const rateResults = await Promise.allSettled(
      hotelKeys.map(key =>
        withTimeout(
          fetch(
            `https://data.xotelo.com/api/rates?hotel_key=${key}&checkin=${checkin}&checkout=${checkout}&currency=USD`
          )
        ).then(r => r.json())
      )
    );

    const prices: number[] = [];
    for (const r of rateResults) {
      if (r.status !== 'fulfilled') continue;
      // Xotelo wraps data in result.rates[] or result[]
      const rates: Array<{ rate?: number; price?: number }> =
        r.value?.result?.rates ?? (Array.isArray(r.value?.result) ? r.value.result : []);
      for (const rate of rates) {
        const price = rate?.rate ?? rate?.price;
        if (typeof price === 'number' && price > 15 && price < 3000) {
          prices.push(price);
          break; // one price per hotel
        }
      }
    }

    if (!prices.length) return null;
    prices.sort((a, b) => a - b);
    // Return median to avoid outliers (ultra-luxury or suspicious $1 rates)
    return Math.round(prices[Math.floor(prices.length / 2)]);
  } catch {
    return null;
  }
}

// ── FX rate (open.er-api.com — free, no API key) ─────────────────────────────

// Maps common destination country names → ISO 4217 currency code
const COUNTRY_CURRENCY: Record<string, string> = {
  Japan: 'JPY', Thailand: 'THB', Indonesia: 'IDR', Vietnam: 'VND', Philippines: 'PHP',
  Malaysia: 'MYR', Cambodia: 'KHR', Myanmar: 'MMK', India: 'INR', Nepal: 'NPR',
  'Sri Lanka': 'LKR', Bangladesh: 'BDT', Pakistan: 'PKR',
  Mexico: 'MXN', Colombia: 'COP', Peru: 'PEN', Argentina: 'ARS', Chile: 'CLP',
  Brazil: 'BRL', Ecuador: 'USD', Bolivia: 'BOB', Paraguay: 'PYG', Uruguay: 'UYU',
  Cuba: 'CUP', 'Costa Rica': 'CRC', Guatemala: 'GTQ', Honduras: 'HNL',
  'El Salvador': 'USD', Panama: 'USD', 'Dominican Republic': 'DOP', Jamaica: 'JMD',
  'United Kingdom': 'GBP', France: 'EUR', Germany: 'EUR', Spain: 'EUR', Italy: 'EUR',
  Portugal: 'EUR', Netherlands: 'EUR', Belgium: 'EUR', Switzerland: 'CHF',
  Austria: 'EUR', Greece: 'EUR', Croatia: 'EUR', Poland: 'PLN', Hungary: 'HUF',
  'Czech Republic': 'CZK', Romania: 'RON', Bulgaria: 'BGN', Serbia: 'RSD',
  Turkey: 'TRY', Iceland: 'ISK', Norway: 'NOK', Sweden: 'SEK', Denmark: 'DKK',
  Finland: 'EUR', Ireland: 'EUR',
  China: 'CNY', 'South Korea': 'KRW', Taiwan: 'TWD', 'Hong Kong': 'HKD',
  Singapore: 'SGD', Australia: 'AUD', 'New Zealand': 'NZD',
  Morocco: 'MAD', Egypt: 'EGP', Kenya: 'KES', Tanzania: 'TZS', 'South Africa': 'ZAR',
  Ghana: 'GHS', Nigeria: 'NGN', Ethiopia: 'ETB', Senegal: 'XOF', Rwanda: 'RWF',
  'United Arab Emirates': 'AED', Qatar: 'QAR', 'Saudi Arabia': 'SAR', Jordan: 'JOD',
  Israel: 'ILS', Oman: 'OMR', Bahrain: 'BHD', Kuwait: 'KWD',
  Canada: 'CAD', Maldives: 'MVR', Fiji: 'FJD', 'French Polynesia': 'XPF',
};

let fxRatesCache: { rates: Record<string, number>; fetchedAt: number } | null = null;

async function fetchFxRate(country: string): Promise<{ fxRateUSD: number; currencyCode: string } | null> {
  const code = COUNTRY_CURRENCY[country];
  if (!code || code === 'USD') return null;
  try {
    // Cache rates for 1 hour
    if (!fxRatesCache || Date.now() - fxRatesCache.fetchedAt > 3_600_000) {
      const res = await withTimeout(fetch('https://open.er-api.com/v6/latest/USD'));
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.rates) return null;
      fxRatesCache = { rates: json.rates as Record<string, number>, fetchedAt: Date.now() };
    }
    const rate = fxRatesCache.rates[code];
    if (!rate) return null;
    return { fxRateUSD: rate, currencyCode: code };
  } catch {
    return null;
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function fetchLiveCityData(
  city: string,
  country: string,
  startDate: string,
  endDate: string,
): Promise<LiveCityData> {
  // Step 1: Teleport lookup (sequential: need lat/lon for weather)
  const teleport = await fetchTeleport(city, country).catch(() => null);

  // Step 2: Weather, Xotelo, FX in parallel
  const [weather, hotelPrice, fx] = await Promise.all([
    teleport ? fetchWeather(teleport.lat, teleport.lon, startDate, endDate).catch(() => null) : Promise.resolve(null),
    fetchXoteloPrice(city, country, startDate, endDate).catch(() => null),
    fetchFxRate(country).catch(() => null),
  ]);

  const costScore = teleport
    ? Math.min(100, Math.max(0, Math.round((10 - teleport.costOfLivingScore) / 10 * 100)))
    : null;

  const hasLive = !!(weather || hotelPrice || teleport?.foodPerDayUSD);
  const hasFull = !!(weather && (hotelPrice || teleport?.foodPerDayUSD));

  return {
    weatherScore: weather?.score ?? null,
    weatherSummary: weather?.summary ?? null,
    hotelPerNightUSD: hotelPrice,
    foodPerDayUSD: teleport?.foodPerDayUSD ?? null,
    costScore,
    source: hasFull ? 'live' : hasLive ? 'partial' : 'estimated',
    fxRateUSD: fx?.fxRateUSD,
    currencyCode: fx?.currencyCode,
  };
}
