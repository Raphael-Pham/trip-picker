'use client';

import { BudgetAllocation } from '@/lib/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  allocation: BudgetAllocation;
  totalBudget: number;
}

const SLICES = [
  { key: 'flights',        label: 'Flights',      color: '#6366f1' },
  { key: 'hotel',          label: 'Hotel',         color: '#f59e0b' },
  { key: 'food',           label: 'Food',          color: '#f97316' },
  { key: 'activities',     label: 'Activities',    color: '#10b981' },
  { key: 'transportation', label: 'Transport',     color: '#3b82f6' },
  { key: 'emergencyBuffer',label: 'Buffer',        color: '#8b5cf6' },
] as const;

export default function BudgetPieChart({ allocation, totalBudget }: Props) {
  const data = SLICES.map(s => ({
    name: s.label,
    value: allocation[s.key as keyof BudgetAllocation] as number,
    color: s.color,
  })).filter(d => d.value > 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-lg">Budget Allocation</h3>
        <span className="text-muted-foreground text-sm">· ${totalBudget.toLocaleString()} total</span>
      </div>
      {allocation.flightWarning && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 text-sm">
          ⚠️ Flights exceed 35% of your budget. Consider a closer destination.
        </div>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `$${Number(value).toLocaleString()} (${Math.round((Number(value) / totalBudget) * 100)}%)`,
              name as string,
            ]}
          />
          <Legend
            formatter={(value, entry) => {
              const item = data.find(d => d.name === value);
              const pct = item ? Math.round((item.value / totalBudget) * 100) : 0;
              return <span className="text-xs">{value} ({pct}%)</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {SLICES.map(s => {
          const val = allocation[s.key as keyof BudgetAllocation] as number;
          if (!val) return null;
          return (
            <div key={s.key} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-semibold">${val.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
