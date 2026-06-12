import { Activity } from '@/lib/types';

interface Props {
  activities: Activity[];
}

const CATEGORY_ICONS: Record<string, string> = {
  Outdoor:   '🌿',
  Indoor:    '🏛️',
  Cultural:  '🎭',
  Family:    '👨‍👩‍👧',
  Nightlife: '🌙',
  Adventure: '⚡',
};

export default function ActivityList({ activities }: Props) {
  if (!activities?.length) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">🎯 Things to Do</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {activities.map((a, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-2">
              <span className="text-xl mt-0.5 flex-shrink-0">{CATEGORY_ICONS[a.category] ?? '🎯'}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5 mb-1.5">
                  <span className="text-xs text-muted-foreground">{a.durationHours}h</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-xs text-muted-foreground">
                    {a.estimatedCostUSD === 0 ? 'Free' : `~$${a.estimatedCostUSD}`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
