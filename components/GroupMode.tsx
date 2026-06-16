'use client';

import { useState } from 'react';
import { Traveler } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface Props {
  travelers: Traveler[];
  onChange: (travelers: Traveler[]) => void;
}

export default function GroupMode({ travelers, onChange }: Props) {
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');

  const addTraveler = () => {
    const budget = parseInt(newBudget, 10);
    if (!newName.trim() || isNaN(budget) || budget <= 0) return;
    onChange([...travelers, { name: newName.trim(), budget }]);
    setNewName('');
    setNewBudget('');
  };

  const removeTraveler = (index: number) => {
    onChange(travelers.filter((_, i) => i !== index));
  };

  const lowest   = travelers.length ? Math.min(...travelers.map(t => t.budget)) : 0;
  const average  = travelers.length ? Math.round(travelers.reduce((s, t) => s + t.budget, 0) / travelers.length) : 0;
  const recommended = travelers.length ? Math.max(...travelers.map(t => t.budget)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTraveler()}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Traveler name"
        />
        <input
          type="number"
          placeholder="Budget ($)"
          value={newBudget}
          onChange={e => setNewBudget(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTraveler()}
          min={0}
          className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Traveler budget"
        />
        <Button type="button" onClick={addTraveler} size="sm" variant="outline">Add</Button>
      </div>

      {travelers.length > 0 && (
        <>
          <ul className="space-y-2">
            {travelers.map((t, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm">
                <span className="font-medium">{t.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">${t.budget.toLocaleString()}</span>
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
        </>
      )}
    </div>
  );
}
