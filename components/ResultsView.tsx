'use client';

import { useState } from 'react';
import { RecommendationResult, WeightPreferences } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScoreBreakdown from './ScoreBreakdown';
import BudgetPieChart from './BudgetPieChart';
import RestaurantList from './RestaurantList';
import ActivityList from './ActivityList';
import PhotographySection from './PhotographySection';
import WeatherSection from './WeatherSection';

interface Props {
  results: RecommendationResult[];
  weights: WeightPreferences;
  totalBudget: number;
  startDate: string;
}

export default function ResultsView({ results, weights, totalBudget, startDate }: Props) {
  const [index, setIndex] = useState(0);

  if (!results.length) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="text-xl font-semibold mb-2">No destinations found</h2>
        <p className="text-muted-foreground">Try adjusting your budget or travel mode.</p>
      </div>
    );
  }

  const result = results[index];
  const { destination: dest, overallScore, adjustedScores, modeBonus, budgetAllocation, estimatedFlightCostUSD } = result;

  // Use baked-in URL from generation script; fall back to a reliable placeholder
  const imageUrl = dest.heroImageUrl
    ?? `https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1600&q=80`;

  const handlePickAnother = () => {
    setIndex(i => (i + 1) % results.length);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6 shadow-xl">
        <img
          src={imageUrl}
          alt={`${dest.city}, ${dest.country}`}
          className="w-full h-64 sm:h-80 object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                  #{index + 1} of {results.length}
                </Badge>
                {dest.hiddenGem && (
                  <Badge className="bg-violet-500/80 text-white border-0 text-xs">💎 Hidden Gem</Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">{dest.city}</h1>
              <p className="text-white/80 text-lg">{dest.country} · {dest.region}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-4xl font-bold">{overallScore.toFixed(0)}</div>
              <div className="text-white/70 text-sm">match score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary + actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <p className="text-muted-foreground leading-relaxed flex-1">{dest.summary}</p>
        <Button onClick={handlePickAnother} variant="outline" className="flex-shrink-0 gap-2">
          🎲 Pick Another
          {index < results.length - 1 && <span className="text-xs text-muted-foreground">({results.length - index - 1} more)</span>}
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Estimated Flight', value: `$${estimatedFlightCostUSD.toLocaleString()}`, icon: '✈️' },
          { label: 'Hotel/Night', value: `$${Math.round(budgetAllocation.hotel / Math.max(budgetAllocation.totalDays, 1)).toLocaleString()}`, icon: '🏨' },
          { label: 'Food/Day', value: `$${Math.round(budgetAllocation.food / Math.max(budgetAllocation.totalDays, 1)).toLocaleString()}`, icon: '🍽️' },
          { label: 'Activities Est.', value: `$${budgetAllocation.activities.toLocaleString()}`, icon: '🎯' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl border border-border bg-background p-3 text-center">
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-sm font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-6 h-auto">
          {[
            { value: 'overview',      label: '📊 Overview' },
            { value: 'food',          label: '🍽️ Food' },
            { value: 'activities',    label: '🎯 Activities' },
            { value: 'photography',   label: '📷 Photo' },
            { value: 'weather',       label: '🌤️ Weather' },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm py-2">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <ScoreBreakdown overallScore={overallScore} scores={adjustedScores} weights={weights} modeBonus={modeBonus} />
          <Separator />
          <BudgetPieChart allocation={budgetAllocation} totalBudget={totalBudget} />

          {/* Hotels */}
          {dest.hotels?.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-4">🏨 Where to Stay</h3>
                <div className="space-y-3">
                  {dest.hotels.map((h, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3">
                      <div>
                        <p className="font-semibold text-sm">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.neighborhood} · {h.category}</p>
                        <p className="text-xs text-muted-foreground mt-1">{h.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm">${h.pricePerNightUSD}</p>
                        <p className="text-xs text-muted-foreground">/night</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="food" className="mt-0">
          <RestaurantList restaurants={dest.restaurants} />
        </TabsContent>

        <TabsContent value="activities" className="mt-0">
          <ActivityList activities={dest.activities} />
        </TabsContent>

        <TabsContent value="photography" className="mt-0">
          <PhotographySection photography={dest.photography} />
        </TabsContent>

        <TabsContent value="weather" className="mt-0">
          <WeatherSection weather={dest.weather} startDate={startDate} />
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <Button onClick={handlePickAnother} size="lg" variant="outline" className="gap-2">
          🎲 Show Me Another Destination
        </Button>
      </div>
    </div>
  );
}
