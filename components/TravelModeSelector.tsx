'use client';

import { TravelMode } from '@/lib/types';
import { cn } from '@/lib/utils';

const MODES: { value: TravelMode; label: string; emoji: string; description: string }[] = [
  { value: 'standard',     label: 'Standard',      emoji: '🌍', description: 'Balanced mix' },
  { value: 'surprise',     label: 'Surprise Me',   emoji: '🎲', description: 'Random pick' },
  { value: 'hidden-gems',  label: 'Hidden Gems',   emoji: '💎', description: 'Off the beaten path' },
  { value: 'photography',  label: 'Photography',   emoji: '📷', description: 'Best shots' },
  { value: 'foodie',       label: 'Foodie',        emoji: '🍜', description: 'Culinary adventures' },
  { value: 'adventure',    label: 'Adventure',     emoji: '🧗', description: 'Thrills & activities' },
  { value: 'relaxation',   label: 'Relaxation',    emoji: '🏖️', description: 'Unwind & recharge' },
];

interface Props {
  mode: TravelMode;
  onChange: (mode: TravelMode) => void;
}

export default function TravelModeSelector({ mode, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-3">Travel Style</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MODES.map(m => (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            aria-pressed={mode === m.value}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              mode === m.value
                ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent',
            )}
          >
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs font-semibold leading-tight">{m.label}</span>
            <span className={cn('text-[10px] leading-tight', mode === m.value ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
              {m.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
