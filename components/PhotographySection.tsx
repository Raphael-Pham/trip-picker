import { PhotographyMetadata } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Props {
  photography: PhotographyMetadata;
}

const DIFFICULTY_COLORS = {
  Beginner:     'bg-emerald-100 text-emerald-800',
  Intermediate: 'bg-amber-100 text-amber-800',
  Advanced:     'bg-rose-100 text-rose-800',
};

const CATEGORY_ICONS: Record<string, string> = {
  Street:       '🏙️',
  Architecture: '🏛️',
  Landscape:    '🏔️',
  Wildlife:     '🦁',
  Night:        '🌙',
};

export default function PhotographySection({ photography }: Props) {
  if (!photography) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-semibold text-lg">📷 Photography Guide</h3>
        <Badge className={DIFFICULTY_COLORS[photography.overallDifficulty]}>
          {photography.overallDifficulty}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        {photography.spots.map((spot, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-sm">{CATEGORY_ICONS[spot.category] ?? '📸'} {spot.name}</p>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0 ${DIFFICULTY_COLORS[spot.difficulty]}`}>
                {spot.difficulty}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{spot.description}</p>
            <p className="text-xs text-primary font-medium mt-1.5">Best time: {spot.bestTime}</p>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-semibold mb-2">🌅 Sunrise Spots</p>
          <ul className="space-y-1">
            {photography.sunriseSpots.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">🌇 Sunset Spots</p>
          <ul className="space-y-1">
            {photography.sunsetSpots.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">🔭 Lens Recommendations</p>
          <ul className="space-y-1">
            {photography.lensRecommendations.map((l, i) => (
              <li key={i} className="text-xs text-muted-foreground">{l}</li>
            ))}
          </ul>
        </div>
      </div>

      {photography.goldenHourNotes && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">✨ Golden Hour Notes</p>
          <p className="text-xs text-amber-700">{photography.goldenHourNotes}</p>
        </div>
      )}
    </div>
  );
}
