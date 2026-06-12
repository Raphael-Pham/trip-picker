import { Restaurant } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface Props {
  restaurants: Restaurant[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Fine Dining':    'bg-violet-100 text-violet-800',
  'Local Specialty': 'bg-emerald-100 text-emerald-800',
  'Budget':         'bg-blue-100 text-blue-800',
  'Midrange':       'bg-amber-100 text-amber-800',
};

export default function RestaurantList({ restaurants }: Props) {
  if (!restaurants?.length) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">🍽️ Where to Eat</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {restaurants.map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-sm leading-tight">{r.name}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground font-mono">{r.priceRange}</span>
              </div>
            </div>
            <span className={`inline-block text-xs rounded-full px-2 py-0.5 mb-1.5 font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-gray-100 text-gray-700'}`}>
              {r.category}
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
            {r.mustTry && (
              <p className="text-xs text-primary font-medium mt-1.5">Must try: {r.mustTry}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
