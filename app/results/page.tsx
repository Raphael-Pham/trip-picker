export const runtime = 'edge';

import { Suspense } from 'react';
import Link from 'next/link';
import { getRecommendations } from '@/lib/recommendationEngine';
import { SearchParams, WeightPreferences, TravelMode, Traveler } from '@/lib/types';
import ResultsView from '@/components/ResultsView';
import catalogData from '@/data/index.json';

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

function parseParams(params: Record<string, string>): SearchParams {
  const weights: WeightPreferences = params.weights
    ? JSON.parse(params.weights)
    : { cost: 20, food: 20, photography: 20, activities: 20, weather: 20 };

  const travelers: Traveler[] = params.travelers ? JSON.parse(params.travelers) : [];
  const computedBudget = params.computedBudget ? JSON.parse(params.computedBudget) : undefined;

  return {
    departureAirport: params.airport ?? 'JFK',
    startDate: params.startDate ?? new Date().toISOString().split('T')[0],
    endDate: params.endDate ?? new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0],
    budget: parseInt(params.budget ?? '2000', 10),
    travelMode: (params.mode ?? 'standard') as TravelMode,
    weights,
    groupMode: params.groupMode === 'true',
    travelers,
    computedBudget,
  };
}

async function ResultsContent({ searchParams }: { searchParams: Record<string, string> }) {
  const params = parseParams(searchParams);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await getRecommendations(catalogData as any, params);

  const totalBudget = params.groupMode && params.computedBudget
    ? params.computedBudget.recommended
    : params.budget;

  return (
    <ResultsView
      results={results}
      weights={params.weights}
      totalBudget={totalBudget}
      startDate={params.startDate}
    />
  );
}

export default async function ResultsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight text-indigo-700 hover:text-indigo-900 transition-colors">
            ✈️ Trip Picker
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← New Search
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="text-center py-20">
            <div className="text-4xl mb-4 animate-bounce">🌍</div>
            <p className="text-lg text-muted-foreground">Finding your perfect destination…</p>
          </div>
        }>
          <ResultsContent searchParams={resolvedParams} />
        </Suspense>
      </div>
    </div>
  );
}
