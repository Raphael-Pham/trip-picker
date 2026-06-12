'use client';

import { Slider } from '@/components/ui/slider';
import { WeightPreferences } from '@/lib/types';
import { cn } from '@/lib/utils';

const DIMENSIONS: { key: keyof WeightPreferences; label: string; emoji: string; color: string }[] = [
  { key: 'cost',        label: 'Cost Value',    emoji: '💰', color: 'text-emerald-600' },
  { key: 'food',        label: 'Food & Drink',  emoji: '🍽️', color: 'text-orange-500' },
  { key: 'photography', label: 'Photography',   emoji: '📷', color: 'text-violet-600' },
  { key: 'activities',  label: 'Activities',    emoji: '🎯', color: 'text-blue-600' },
  { key: 'weather',     label: 'Weather',       emoji: '☀️', color: 'text-amber-500' },
];

interface Props {
  weights: WeightPreferences;
  onChange: (weights: WeightPreferences) => void;
}

function redistribute(weights: WeightPreferences, changedKey: keyof WeightPreferences, newValue: number): WeightPreferences {
  const others = DIMENSIONS.filter(d => d.key !== changedKey);
  const remaining = 100 - newValue;
  const currentOtherTotal = others.reduce((sum, d) => sum + weights[d.key], 0);

  const updated: WeightPreferences = { ...weights, [changedKey]: newValue };

  if (currentOtherTotal === 0) {
    const each = Math.floor(remaining / others.length);
    others.forEach(d => { updated[d.key] = each; });
    updated[others[others.length - 1].key] = remaining - each * (others.length - 1);
  } else {
    let distributed = 0;
    for (let i = 0; i < others.length - 1; i++) {
      const d = others[i];
      const share = Math.round((weights[d.key] / currentOtherTotal) * remaining);
      updated[d.key] = share;
      distributed += share;
    }
    updated[others[others.length - 1].key] = remaining - distributed;
  }

  // Clamp all to 0+
  for (const d of DIMENSIONS) {
    if (updated[d.key] < 0) updated[d.key] = 0;
  }

  return updated;
}

export default function WeightSliders({ weights, onChange }: Props) {
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = total === 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-foreground">What matters most?</label>
        <span className={cn('text-xs font-bold tabular-nums', isValid ? 'text-emerald-600' : 'text-destructive')}>
          {total}/100
        </span>
      </div>
      <div className="space-y-4">
        {DIMENSIONS.map(({ key, label, emoji, color }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm flex items-center gap-1.5">
                <span>{emoji}</span>
                <span className="font-medium">{label}</span>
              </span>
              <span className={cn('text-sm font-bold tabular-nums w-8 text-right', color)}>
                {weights[key]}
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[weights[key]]}
              onValueChange={(vals) => {
                const v = Array.isArray(vals) ? vals[0] : (vals as number);
                onChange(redistribute(weights, key, v));
              }}
              aria-label={`${label} weight`}
              className="cursor-pointer"
            />
          </div>
        ))}
      </div>
      {!isValid && (
        <p className="text-xs text-destructive mt-2">Weights must total 100. Adjust sliders above.</p>
      )}
    </div>
  );
}
