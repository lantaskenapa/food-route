import React from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Star, 
  Flame, 
  Clock, 
  DollarSign, 
  Utensils, 
  CheckCircle, 
  Share2, 
  Compass,
  Car
} from 'lucide-react';
import { FoodPlace } from '../types';

interface FoodDetailModalProps {
  place: FoodPlace | null;
  onClose: () => void;
  onViewOnRouteMap?: (place: FoodPlace) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  place,
  onClose,
  onViewOnRouteMap,
}) => {
  if (!place) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `Cek kuliner viral "${place.name}" di ${place.city} via Kuliner Trip!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${place.name} - ${place.address} (${place.city}). Rekomendasi kuliner viral: ${place.signature_dish}`
      );
      alert('Info kuliner berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Hero Image */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-100 overflow-hidden">
          <img
            src={place.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

          {/* Close & Share buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
              title="Bagikan"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-rose-600 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-rose-600" />
              <span>Viral {place.viral_score}%</span>
            </div>
            {place.verified && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-xs font-bold text-white shadow-sm">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Terverifikasi</span>
              </div>
            )}
          </div>

          {/* Place Title on Hero */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-xs mb-1.5 inline-block">
              {place.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
              {place.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-200 mt-1">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {place.rating} / 5.0
              </span>
              <span>•</span>
              <span>{place.city}</span>
              {place.distance_from_route_km != null && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    {place.distance_from_route_km} km dari garis rute
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Address & Hours */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Alamat Lengkap:</span>
                <p className="text-slate-800 font-medium text-xs leading-relaxed">{place.address}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block">Jam Buka</span>
                  <span className="font-semibold text-slate-700">{place.opening_hours}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] block">Kisaran Harga</span>
                  <span className="font-semibold text-slate-700">{place.price_range}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Dish */}
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/70">
            <div className="flex items-center gap-2 mb-1 text-blue-900 font-bold text-xs">
              <Utensils className="w-4 h-4 text-blue-600" />
              <span>Menu Unggulan Rekomendasi:</span>
            </div>
            <p className="text-slate-800 font-semibold text-sm">
              {place.signature_dish}
            </p>
          </div>

          {/* Notes & Description */}
          {place.notes && (
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">
                Catatan Traveler & Kenikmatan:
              </span>
              <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 text-xs">
                {place.notes}
              </p>
            </div>
          )}

          {/* TikTok Attribution */}
          {place.tiktok_creator && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white text-xs">
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className="text-base">🎵</span>
                  <span>Viral di TikTok oleh {place.tiktok_creator}</span>
                </div>
                <span className="text-[11px] text-slate-400">{place.tiktok_views || 'Jutaan penonton'}</span>
              </div>

              {place.tiktok_url && (
                <a
                  href={place.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center gap-1 text-[11px]"
                >
                  <span>Buka Video</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
          {onViewOnRouteMap && (
            <button
              onClick={() => {
                onViewOnRouteMap(place);
                onClose();
              }}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Lihat di Jalur Peta</span>
            </button>
          )}

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <Navigation className="w-4 h-4" />
            <span>Navigasi</span>
          </a>
        </div>

      </div>
    </div>
  );
};
