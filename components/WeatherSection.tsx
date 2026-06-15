import { WeatherData } from '@/lib/types';

interface Props {
  weather: WeatherData;
  startDate?: string;
  liveWeatherSummary?: string | null;
  liveWeatherScore?: number | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function WeatherSection({ weather, startDate, liveWeatherSummary, liveWeatherScore }: Props) {
  if (!weather) return null;

  const travelMonth = startDate ? new Date(startDate).getMonth() + 1 : null;

  const maxTemp = Math.max(...weather.monthly.map(m => m.avgTempC));
  const maxRain = Math.max(...weather.monthly.map(m => m.rainfallMM)) || 1;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">🌤️ Weather</h3>
      {liveWeatherSummary ? (
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live forecast
          </span>
          <span className="text-sm text-foreground font-medium">{liveWeatherSummary}</span>
          {liveWeatherScore != null && (
            <span className="text-xs text-muted-foreground">· Score: {liveWeatherScore}/100</span>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">{weather.summary}</p>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-12 gap-1 mb-2">
            {weather.monthly.map(m => {
              const isBest   = weather.bestMonths.includes(m.month);
              const isTravel = m.month === travelMonth;
              return (
                <div key={m.month} className="text-center">
                  <div className={`text-[10px] font-medium mb-1 ${isTravel ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {MONTH_NAMES[m.month - 1]}
                    {isBest && <span className="block text-amber-500">★</span>}
                  </div>
                  {/* Temperature bar */}
                  <div className="h-12 flex items-end justify-center">
                    <div
                      className={`w-full rounded-t transition-all ${isTravel ? 'bg-primary' : isBest ? 'bg-amber-400' : 'bg-blue-300'}`}
                      style={{ height: `${(m.avgTempC / maxTemp) * 100}%` }}
                      title={`${m.avgTempC}°C`}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{m.avgTempC}°</div>
                  {/* Rain dots */}
                  <div className="h-6 flex items-end justify-center mt-1">
                    <div
                      className="w-full rounded-t bg-sky-200"
                      style={{ height: `${(m.rainfallMM / maxRain) * 100}%` }}
                      title={`${m.rainfallMM}mm`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-300" /> Temp</span>
            <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-sky-200" /> Rain</span>
            <span className="flex items-center gap-1"><span className="text-amber-500">★</span> Best months</span>
            {travelMonth && <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-primary" /> Your trip</span>}
          </div>
        </div>
      </div>

      {weather.seasonality && (
        <div className="mt-4 rounded-xl bg-sky-50 border border-sky-200 p-3">
          <p className="text-xs text-sky-800">{weather.seasonality}</p>
        </div>
      )}
    </div>
  );
}
