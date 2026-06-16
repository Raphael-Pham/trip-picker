export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export type CabinClass = 'basic_economy' | 'economy' | 'premium_economy' | 'business';

export interface FlightPriceRange {
  min: number;
  median: number;
  max: number;
}

export type TravelMode =
  | 'standard'
  | 'surprise'
  | 'hidden-gems'
  | 'photography'
  | 'foodie'
  | 'adventure'
  | 'relaxation';

export interface WeightPreferences {
  cost: number;
  food: number;
  photography: number;
  activities: number;
  weather: number;
}

export interface Traveler {
  name: string;
  budget: number;
}

export interface SearchParams {
  departureAirport: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelMode: TravelMode;
  weights: WeightPreferences;
  groupMode: boolean;
  travelers?: Traveler[];
  computedBudget?: {
    lowest: number;
    average: number;
    recommended: number;
  };
  departureTime?: TimeOfDay;
  arrivalTime?: TimeOfDay;
  cabinClass?: CabinClass;
  preferDirect?: boolean;
}

export interface DestinationScores {
  cost: number;
  food: number;
  photography: number;
  activities: number;
  weather: number;
}

export type BudgetLevel = 'budget' | 'mid' | 'luxury';

export interface BudgetRange {
  level: BudgetLevel;
  minPerDayUSD: number;
  maxPerDayUSD: number;
}

export interface DestinationIndex {
  id: string;
  city: string;
  country: string;
  region: string;
  airportCodes: string[];
  hiddenGem: boolean;
  tripStyles: TravelMode[];
  scores: DestinationScores;
  budgetRanges: BudgetRange[];
  unsplashQuery: string;
  heroImageUrl?: string;
  summary: string;
}

export interface Restaurant {
  name: string;
  category: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  description: string;
  mustTry?: string;
}

export interface Activity {
  name: string;
  category: 'Outdoor' | 'Indoor' | 'Cultural' | 'Family' | 'Nightlife' | 'Adventure';
  description: string;
  durationHours: number;
  estimatedCostUSD: number;
  bestFor: TravelMode[];
}

export interface PhotographySpot {
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bestTime: string;
  category: 'Street' | 'Architecture' | 'Landscape' | 'Wildlife' | 'Night';
}

export interface PhotographyMetadata {
  spots: PhotographySpot[];
  sunriseSpots: string[];
  sunsetSpots: string[];
  lensRecommendations: string[];
  goldenHourNotes: string;
  overallDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface MonthlyWeather {
  month: number;
  avgTempC: number;
  rainfallMM: number;
}

export interface WeatherData {
  monthly: MonthlyWeather[];
  bestMonths: number[];
  seasonality: string;
  summary: string;
}

export interface Hotel {
  name: string;
  neighborhood: string;
  pricePerNightUSD: number;
  category: 'Budget' | 'Mid-range' | 'Luxury';
  description: string;
}

export interface Destination extends DestinationIndex {
  restaurants: Restaurant[];
  activities: Activity[];
  photography: PhotographyMetadata;
  weather: WeatherData;
  hotels: Hotel[];
}

export interface BudgetAllocation {
  flights: number;
  hotel: number;
  food: number;
  activities: number;
  transportation: number;
  emergencyBuffer: number;
  totalDays: number;
  flightWarning: boolean;
}

export interface ScoredDestination extends DestinationIndex {
  overallScore: number;
  adjustedScores: DestinationScores;
  modeBonus: number;
}

export interface LiveCityData {
  weatherScore: number | null;
  weatherSummary: string | null;
  hotelPerNightUSD: number | null;
  foodPerDayUSD: number | null;
  costScore: number | null;
  source: 'live' | 'partial' | 'estimated';
  fxRateUSD?: number;    // units of local currency per 1 USD (higher = cheaper for USD holders)
  currencyCode?: string; // e.g. "JPY", "EUR"
}

export interface RecommendationResult {
  destination: Destination;
  overallScore: number;
  adjustedScores: DestinationScores;
  modeBonus: number;
  budgetAllocation: BudgetAllocation;
  estimatedFlightCostUSD: number;
  flightPriceRange: FlightPriceRange;
  rank: number;
  liveData: LiveCityData;
  visaWarning?: string;      // e.g. "Visa required — check before booking"
  baggageWarning?: boolean;  // true when route is LCC-dominant (bag fees likely)
  driveInfo?: { driveMiles: number; approxHours: number }; // set when destination is driveable
}
