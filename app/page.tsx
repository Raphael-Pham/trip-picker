import SearchForm from '@/components/SearchForm';

export const metadata = {
  title: 'Trip Picker — Discover Your Next Destination',
  description: 'Tell us your budget, dates, and interests. We find the perfect destination for you.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>✈️</span>
            <span>Destination-first travel discovery</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Where should I go?
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Tell us your budget, dates, and interests. We find the perfect destination — not the other way around.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-3xl mx-auto px-4 pb-16 mt-8">
        <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-100 border border-slate-100 pt-8 pb-8 px-6 sm:px-8">
          <SearchForm />
        </div>
      </div>
    </main>
  );
}
