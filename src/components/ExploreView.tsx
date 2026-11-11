import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  MapPin, 
  Sparkles, 
  Flame, 
  Star, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Search,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { FoodPlace, PresetRoute } from '../types';
import { PRESET_ROUTES, CATEGORIES_LIST } from '../services/sampleData';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';
import { fetchPhotonSuggestions } from '../services/photon';

interface ExploreViewProps {
  foodPlaces: FoodPlace[];
  onApplyRoute: (
    origin: string,
    destination: string,
    radiusKm: number,
    presetId?: string,
    originCoords?: { lat: number; lng: number },
    destCoords?: { lat: number; lng: number }
  ) => Promise<void>;
  onSelectFoodPlace: (place: FoodPlace) => void;
  onNavigateToTab: (tab: 'explore' | 'map' | 'data' | 'scraper') => void;
  isAutoScraping: boolean;
  autoScrapingStep: number;
  autoScrapingTitle: string;
  autoScrapingDetail: string;
  autoScrapingError: string | null;
  onRetryAutoScraping: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  foodPlaces,
  onApplyRoute,
  onSelectFoodPlace,
  onNavigateToTab,
  isAutoScraping,
  autoScrapingStep,
  autoScrapingTitle,
  autoScrapingDetail,
  autoScrapingError,
  onRetryAutoScraping,
}) => {
  const [origin, setOrigin] = useState('Jakarta');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  });

  const [destination, setDestination] = useState('Bandung');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.9175,
    lng: 107.6191,
  });

  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSwap = () => {
    const tempName = origin;
    const tempCoords = originCoords;
    setOrigin(destination);
    setOriginCoords(destCoords);
    setDestination(tempName);
    setDestCoords(tempCoords);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOrigin = origin.trim();
    const cleanDest = destination.trim();
    if (!cleanOrigin || !cleanDest) return;

    let finalOriginCoords = originCoords;
    let finalDestCoords = destCoords;

    // Resolve Origin coordinates if user typed arbitrary text without clicking suggestion
    try {
      const origSuggestions = await fetchPhotonSuggestions(cleanOrigin);
      if (origSuggestions && origSuggestions.length > 0) {
        finalOriginCoords = { lat: origSuggestions[0].lat, lng: origSuggestions[0].lng };
        setOriginCoords(finalOriginCoords);
      }
    } catch (err) {
      console.warn('Origin geocoding notice', err);
    }

    // Resolve Destination coordinates if user typed arbitrary text without clicking suggestion
    try {
      const destSuggestions = await fetchPhotonSuggestions(cleanDest);
      if (destSuggestions && destSuggestions.length > 0) {
        finalDestCoords = { lat: destSuggestions[0].lat, lng: destSuggestions[0].lng };
        setDestCoords(finalDestCoords);
      }
    } catch (err) {
      console.warn('Destination geocoding notice', err);
    }

    await onApplyRoute(cleanOrigin, cleanDest, radiusKm, undefined, finalOriginCoords, finalDestCoords);
  };

  const handleSelectPreset = (preset: PresetRoute) => {
    setOrigin(preset.origin.name);
    setOriginCoords({ lat: preset.origin.lat, lng: preset.origin.lng });
    setDestination(preset.destination.name);
    setDestCoords({ lat: preset.destination.lat, lng: preset.destination.lng });
  };

  // Top viral recommendations
  const viralPlaces = [...foodPlaces]
    .sort((a, b) => b.viral_score - a.viral_score)
    .slice(0, 6);

  // Filtered places
  const filteredPlaces = foodPlaces.filter((item) => {
    const matchCategory =
      selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.signature_dish.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero & Route Search Section */}
      <section className="bg-gradient-to-b from-slate-100/70 via-white to-white border-b border-slate-200/80 pt-8 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto TikTok Scraper & Food Route Discovery</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Cari Kuliner Viral di Sepanjang Rute
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Didukung Komoot Photon autocomplete dan OpenFreeMap. Sistem mencari konten kuliner TikTok, geocoding koordinat, dan menyajikannya pada peta rute.
            </p>
          </div>

          {/* Minimalist Route Input Card with Photon Autocomplete */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <form onSubmit={handleApply} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                
                {/* Origin Autocomplete Input */}
                <div className="md:col-span-5 relative">
                  <LocationAutocompleteInput
                    label="Origin (Lokasi Asal)"
                    placeholder="Ketik minimal 2 huruf (contoh: Jakarta)"
                    value={origin}
                    onChange={setOrigin}
                    onSelectLocation={(loc) => {
                      setOrigin(loc.name);
                      setOriginCoords({ lat: loc.lat, lng: loc.lng });
                    }}
                    isOrigin={true}
                    required
                  />
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex justify-center pt-5 md:pt-4">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Tukar Asal dan Tujuan"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Destination Autocomplete Input */}
                <div className="md:col-span-5 relative">
                  <LocationAutocompleteInput
                    label="Destination (Lokasi Tujuan)"
                    placeholder="Ketik minimal 2 huruf (contoh: Bandung)"
                    value={destination}
                    onChange={setDestination}
                    onSelectLocation={(loc) => {
                      setDestination(loc.name);
                      setDestCoords({ lat: loc.lat, lng: loc.lng });
                    }}
                    isOrigin={false}
                    required
                  />
                </div>

              </div>

              {/* Bottom Controls: Radius & Apply Button */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                
                {/* Radius filter pills */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 font-medium">Radius koridor:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    {[2, 5, 10, 20].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadiusKm(r)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          radiusKm === r
                            ? 'bg-white text-blue-600 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="submit"
                  disabled={isAutoScraping}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply & Auto Scrape</span>
                </button>

              </div>

            </form>
          </div>

          {/* Quick Route Presets */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Rute populer:</span>
            {PRESET_ROUTES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 text-[11px] font-medium transition-colors"
              >
                {p.origin.name.split(' ')[0]} → {p.destination.name.split(' ')[0]}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Main Catalog View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Section: Kuliner Viral Teratas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Rekomendasi Kuliner Viral TikTok</span>
              </h2>
              <p className="text-xs text-slate-500">
                Tempat makan dengan viral score tertinggi di sepanjang rute liburan.
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('map')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>Buka Peta</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {viralPlaces.map((place) => {
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
              return (
                <div
                  key={place.id}
                  onClick={() => onSelectFoodPlace(place)}
                  className="group bg-white rounded-xl border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                >
                  <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={place.image_url}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-rose-600">
                      <Flame className="w-3 h-3 fill-rose-600" />
                      <span>Viral {place.viral_score}%</span>
                    </div>

                    {place.tiktok_views && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                        {place.tiktok_views}
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                      <span className="font-semibold bg-black/50 px-2 py-0.5 rounded">
                        {place.city}
                      </span>
                      <span className="bg-blue-600 px-2 py-0.5 rounded font-medium">
                        {place.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                          {place.name}
                        </h3>
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs shrink-0">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{place.rating}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {place.address}
                      </p>

                      <div className="mt-2 p-2 rounded-lg bg-slate-50 text-[11px]">
                        <span className="text-slate-400 font-semibold block text-[10px]">Spesial:</span>
                        <span className="font-medium text-slate-700 line-clamp-1">{place.signature_dish}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {/* Navigasi Button */}
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Navigasi</span>
                      </a>

                      <span className="text-slate-500 font-medium">
                        {place.price_range}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Category filter & master search */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Daftar Kuliner Terverifikasi
              </h2>
              <p className="text-xs text-slate-500">
                Pilih kategori untuk melihat spot kuliner di berbagai kota.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tempat atau menu..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('Semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'Semua'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua ({foodPlaces.length})
            </button>
            {CATEGORIES_LIST.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPlaces.slice(0, 9).map((place) => {
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
              return (
                <div
                  key={place.id}
                  onClick={() => onSelectFoodPlace(place)}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold text-[10px]">
                        {place.category}
                      </span>
                      <span className="font-bold text-amber-500">★ {place.rating}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{place.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{place.address}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Navigasi</span>
                    </a>
                    <span className="text-slate-500 font-medium">{place.city}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Auto Scraping Loading & Progress Modal */}
      {isAutoScraping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-5">
            
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-2 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Auto Scraping Kuliner Rute
              </h3>
              <p className="text-xs text-slate-500">
                {origin} ➔ {destination} (Radius {radiusKm} km)
              </p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3">
              {[
                { step: 1, label: 'Menganalisis koridor rute & titik transit' },
                { step: 2, label: 'Mengambil konten kuliner viral TikTok' },
                { step: 3, label: 'Ekstraksi nama tempat & alamat lokasi' },
                { step: 4, label: 'Validasi geocoding koordinat' },
                { step: 5, label: 'Menyimpan hasil ke Supabase' },
              ].map((item) => {
                const isPassed = autoScrapingStep > item.step;
                const isCurrent = autoScrapingStep === item.step;
                return (
                  <div key={item.step} className="flex items-center gap-3 text-xs">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : item.step}
                    </div>
                    <span
                      className={`transition-colors ${
                        isPassed
                          ? 'text-slate-800 font-medium'
                          : isCurrent
                          ? 'text-blue-600 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Live Step Status message */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 text-[11px]">{autoScrapingTitle}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{autoScrapingDetail}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, autoScrapingStep * 20)}%` }}
              />
            </div>

          </div>
        </div>
      )}

      {/* Error Modal if Auto Scraping Fails */}
      {autoScrapingError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Pencarian Rute Gagal</h3>
              <p className="text-xs text-slate-500 mt-1">{autoScrapingError}</p>
            </div>
            <button
              onClick={onRetryAutoScraping}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
