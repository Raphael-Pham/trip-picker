'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TravelMode, TimeOfDay, WeightPreferences, Traveler, SearchParams } from '@/lib/types';
import TravelModeSelector from './TravelModeSelector';
import WeightSliders from './WeightSliders';
import GroupMode from './GroupMode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_WEIGHTS: WeightPreferences = { cost: 20, food: 20, photography: 20, activities: 20, weather: 20 };

const TIME_OPTIONS: { value: TimeOfDay; label: string; icon: string; hint: string }[] = [
  { value: 'morning',   label: 'Morning',   icon: '🌅', hint: '5 am–11 am' },
  { value: 'noon',      label: 'Midday',    icon: '☀️',  hint: '11 am–2 pm' },
  { value: 'afternoon', label: 'Afternoon', icon: '🌤️', hint: '2 pm–6 pm' },
  { value: 'evening',   label: 'Evening',   icon: '🌆', hint: '6 pm–10 pm' },
  { value: 'night',     label: 'Night',     icon: '🌙', hint: '10 pm–5 am' },
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}
function getNextWeekStr() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

function TimeOfDayPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TimeOfDay | null;
  onChange: (v: TimeOfDay | null) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {TIME_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? null : opt.value)}
            title={opt.hint}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
              value === opt.value
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-input bg-background text-foreground hover:border-primary/50 hover:bg-accent',
            )}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
            <span className={cn('text-[10px]', value === opt.value ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {opt.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SearchForm() {
  const router = useRouter();

  const [airport, setAirport] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getNextWeekStr());
  const [budget, setBudget] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('standard');
  const [weights, setWeights] = useState<WeightPreferences>(DEFAULT_WEIGHTS);
  const [groupMode, setGroupMode] = useState(false);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [departureTime, setDepartureTime] = useState<TimeOfDay | null>(null);
  const [arrivalTime, setArrivalTime] = useState<TimeOfDay | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!airport.trim()) e.airport = 'Enter your departure airport code (e.g. JFK)';
    if (!startDate) e.startDate = 'Select a start date';
    if (!endDate) e.endDate = 'Select an end date';
    if (startDate && endDate && endDate <= startDate) e.endDate = 'End date must be after start date';
    if (!groupMode && (!budget || parseInt(budget) < 500)) e.budget = 'Minimum budget is $500 (flights alone cost more)';
    if (groupMode && travelers.length < 2) e.travelers = 'Add at least 2 travelers for group mode';
    const weightTotal = Object.values(weights).reduce((s, v) => s + v, 0);
    if (weightTotal !== 100) e.weights = 'Preference weights must total 100';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const params = new URLSearchParams();
    params.set('airport', airport.toUpperCase().trim());
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    params.set('mode', travelMode);
    params.set('weights', JSON.stringify(weights));
    params.set('groupMode', String(groupMode));

    if (groupMode && travelers.length > 0) {
      params.set('travelers', JSON.stringify(travelers));
      const lowest = Math.min(...travelers.map(t => t.budget));
      const average = Math.round(travelers.reduce((s, t) => s + t.budget, 0) / travelers.length);
      const recommended = Math.max(...travelers.map(t => t.budget));
      params.set('budget', String(recommended));
      params.set('computedBudget', JSON.stringify({ lowest, average, recommended }));
    } else {
      params.set('budget', budget);
    }

    if (departureTime) params.set('departureTime', departureTime);
    if (arrivalTime) params.set('arrivalTime', arrivalTime);

    router.push(`/results?${params.toString()}`);
  };

  const inputClass = (field: string) => cn(
    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring',
    errors[field] ? 'border-destructive' : 'border-input',
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Basic search fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="airport" className="block text-sm font-semibold mb-1.5">Departure Airport</label>
          <input
            id="airport"
            type="text"
            placeholder="JFK, LAX, LHR…"
            value={airport}
            onChange={e => setAirport(e.target.value.toUpperCase())}
            maxLength={4}
            className={cn(inputClass('airport'), 'uppercase tracking-widest font-mono')}
            aria-describedby={errors.airport ? 'airport-error' : undefined}
          />
          {errors.airport && <p id="airport-error" className="text-xs text-destructive mt-1">{errors.airport}</p>}
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-semibold mb-1.5">
            {groupMode ? 'Budget (auto from group)' : 'Total Trip Budget (USD)'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              id="budget"
              type="number"
              placeholder="3,000"
              value={groupMode ? '' : budget}
              onChange={e => setBudget(e.target.value)}
              disabled={groupMode}
              min={500}
              className={cn(inputClass('budget'), 'pl-7', groupMode && 'opacity-50 cursor-not-allowed')}
              aria-describedby={errors.budget ? 'budget-error' : undefined}
            />
          </div>
          {errors.budget
            ? <p id="budget-error" className="text-xs text-destructive mt-1">{errors.budget}</p>
            : <p className="text-xs text-muted-foreground mt-1">Total for the trip including flights (e.g. $2,000–$5,000)</p>
          }
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-semibold mb-1.5">Start Date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            min={getTodayStr()}
            onChange={e => setStartDate(e.target.value)}
            className={inputClass('startDate')}
          />
          {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate}</p>}
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-semibold mb-1.5">End Date</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate || getTodayStr()}
            onChange={e => setEndDate(e.target.value)}
            className={inputClass('endDate')}
          />
          {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate}</p>}
        </div>
      </div>

      {/* Flight time preferences */}
      <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-4">
        <h3 className="text-sm font-semibold">Flight Time Preferences <span className="font-normal text-muted-foreground">(optional — affects price estimate)</span></h3>
        <TimeOfDayPicker
          label="Departure time"
          value={departureTime}
          onChange={setDepartureTime}
        />
        <TimeOfDayPicker
          label="Arrival time at destination"
          value={arrivalTime}
          onChange={setArrivalTime}
        />
      </div>

      {/* Travel Mode */}
      <TravelModeSelector mode={travelMode} onChange={setTravelMode} />

      {/* Weight Sliders */}
      <div className="rounded-xl border border-border bg-accent/30 p-4">
        <WeightSliders weights={weights} onChange={setWeights} />
        {errors.weights && <p className="text-xs text-destructive mt-2">{errors.weights}</p>}
      </div>

      {/* Group Mode */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            role="switch"
            aria-checked={groupMode}
            onClick={() => setGroupMode(g => !g)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              groupMode ? 'bg-primary' : 'bg-input',
            )}
          >
            <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', groupMode ? 'translate-x-6' : 'translate-x-1')} />
          </button>
          <span className="text-sm font-semibold">Group Mode</span>
        </div>
        {groupMode && (
          <div className="rounded-xl border border-border bg-accent/30 p-4">
            <GroupMode travelers={travelers} onChange={setTravelers} />
            {errors.travelers && <p className="text-xs text-destructive mt-1">{errors.travelers}</p>}
          </div>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full text-base font-bold py-6">
        Find My Destination →
      </Button>
    </form>
  );
}
