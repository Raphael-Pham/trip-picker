'use client';

import { useState } from 'react';
import { Traveler } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface Props {
  travelers: Traveler[];
  onChange: (travelers: Traveler[]) => void;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Returns ISO date string for `days` from now. */
function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Compute the overlap of all traveler availability windows, if any. */
function computeOverlap(travelers: Traveler[]): { start: string; end: string } | null {
  const withDates = travelers.filter(t => t.availableFrom && t.availableTo);
  if (withDates.length < 2) return null;

  const latestStart = withDates.reduce((max, t) => t.availableFrom! > max ? t.availableFrom! : max, withDates[0].availableFrom!);
  const earliestEnd = withDates.reduce((min, t) => t.availableTo! < min ? t.availableTo! : min, withDates[0].availableTo!);

  if (latestStart >= earliestEnd) return null;
  return { start: latestStart, end: earliestEnd };
}

/** Format a date string for display: "Mon Jun 16" */
function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Count calendar days between two ISO dates. */
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export default function GroupMode({ travelers, onChange }: Props) {
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newFrom, setNewFrom] = useState(daysFromNow(14));
  const [newTo, setNewTo] = useState(daysFromNow(21));

  const addTraveler = () => {
    const budget = parseInt(newBudget, 10);
    if (!newName.trim() || isNaN(budget) || budget <= 0) return;
    onChange([...travelers, {
      name: newName.trim(),
      budget,
      availableFrom: newFrom || undefined,
      availableTo: newTo || undefined,
    }]);
    setNewName('');
    setNewBudget('');
  };

  const removeTraveler = (index: number) => {
    onChange(travelers.filter((_, i) => i !== index));
  };

  const lowest      = travelers.length ? Math.min(...travelers.map(t => t.budget)) : 0;
  const average     = travelers.length ? Math.round(travelers.reduce((s, t) => s + t.budget, 0) / travelers.length) : 0;
  const recommended = travelers.length ? Math.max(...travelers.map(t => t.budget)) : 0;

  const overlap = computeOverlap(travelers);
  const travelersWithDates = travelers.filter(t => t.availableFrom && t.availableTo);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTraveler()}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Traveler name"
        />
        <input
          type="number"
          placeholder="Budget ($)"
          value={newBudget}
          onChange={e => setNewBudget(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTraveler()}
          min={0}
          className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Traveler budget"
        />
        <input
          type="date"
          value={newFrom}
          min={getTodayStr()}
          onChange={e => setNewFrom(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Available from"
          title="Available from"
        />
        <input
          type="date"
          value={newTo}
          min={newFrom || getTodayStr()}
          onChange={e => setNewTo(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Available to"
          title="Available to"
        />
      </div>
      <Button type="button" onClick={addTraveler} size="sm" variant="outline" className="w-full sm:w-auto">
        + Add Traveler
      </Button>

      {travelers.length > 0 && (
        <>
          <ul className="space-y-2">
            {travelers.map((t, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm gap-2">
                <span className="font-medium min-w-0 truncate">{t.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
                  <span>${t.budget.toLocaleString()}</span>
                  {t.availableFrom && t.availableTo && (
                    <span className="hidden sm:inline border border-border rounded px-1.5 py-0.5">
                      {fmtDate(t.availableFrom)} – {fmtDate(t.availableTo)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeTraveler(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove ${t.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Lowest', value: lowest, color: 'text-amber-600' },
              { label: 'Average', value: average, color: 'text-blue-600' },
              { label: 'Recommended', value: recommended, color: 'text-emerald-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-accent p-2">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className={`text-sm font-bold ${color}`}>${value.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Shared availability window */}
          {travelersWithDates.length >= 2 && (
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                📅 Availability overlap
              </p>
              {overlap ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">
                      {daysBetween(overlap.start, overlap.end)} days shared
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {fmtDate(overlap.start)} → {fmtDate(overlap.end)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All {travelersWithDates.length} travelers with dates can travel during this window.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <span>⚠️</span>
                  <p className="text-sm">No shared window found — travelers&apos; availability doesn&apos;t overlap.</p>
                </div>
              )}

              {/* Per-traveler bars */}
              {(() => {
                const allDates = travelersWithDates.flatMap(t => [t.availableFrom!, t.availableTo!]);
                const minDate = allDates.reduce((a, b) => a < b ? a : b);
                const maxDate = allDates.reduce((a, b) => a > b ? a : b);
                const totalDays = Math.max(1, daysBetween(minDate, maxDate));
                return (
                  <div className="mt-3 space-y-1.5">
                    {travelersWithDates.map((t, i) => {
                      const left = daysBetween(minDate, t.availableFrom!) / totalDays * 100;
                      const width = daysBetween(t.availableFrom!, t.availableTo!) / totalDays * 100;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16 truncate">{t.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-accent relative">
                            <div
                              className="absolute h-full rounded-full bg-blue-400"
                              style={{ left: `${left}%`, width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
