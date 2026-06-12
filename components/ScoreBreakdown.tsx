import { DestinationScores, WeightPreferences } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const DIMS: { key: keyof DestinationScores; label: string; emoji: string; color: string; bg: string }[] = [
  { key: 'cost',        label: 'Cost Value',   emoji: '💰', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { key: 'food',        label: 'Food',         emoji: '🍽️', color: 'text-orange-700',  bg: 'bg-orange-100' },
  { key: 'photography', label: 'Photography',  emoji: '📷', color: 'text-violet-700',  bg: 'bg-violet-100' },
  { key: 'activities',  label: 'Activities',   emoji: '🎯', color: 'text-blue-700',    bg: 'bg-blue-100' },
  { key: 'weather',     label: 'Weather',      emoji: '☀️', color: 'text-amber-700',   bg: 'bg-amber-100' },
];

interface Props {
  overallScore: number;
  scores: DestinationScores;
  weights: WeightPreferences;
  modeBonus: number;
}

export default function ScoreBreakdown({ overallScore, scores, weights, modeBonus }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-semibold text-lg">Match Score</h3>
        <Badge variant="default" className="text-base px-3 py-0.5 font-bold">
          {overallScore.toFixed(1)} / 100
        </Badge>
        {modeBonus > 0 && (
          <Badge variant="secondary" className="text-xs">+{modeBonus} mode bonus</Badge>
        )}
      </div>
      <div className="space-y-3">
        {DIMS.map(({ key, label, emoji, color, bg }) => (
          <div key={key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span>{emoji}</span> {label}
                <span className="text-muted-foreground text-xs">({weights[key]}% weight)</span>
              </span>
              <span className={`font-bold ${color}`}>{Math.round(scores[key])}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${bg} border border-current/20 transition-all duration-700`}
                style={{ width: `${scores[key]}%`, backgroundColor: undefined }}
              >
                <div className={`h-full rounded-full ${color.replace('text-', 'bg-')} opacity-80`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
