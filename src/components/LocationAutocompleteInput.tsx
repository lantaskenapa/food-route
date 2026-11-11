import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Navigation } from 'lucide-react';
import { fetchPhotonSuggestions, PhotonSuggestion } from '../services/photon';

interface LocationAutocompleteInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (location: { name: string; lat: number; lng: number }) => void;
  isOrigin?: boolean;
  required?: boolean;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onSelectLocation,
  isOrigin = false,
  required = false,
}) => {
  const [suggestions, setSuggestions] = useState<PhotonSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search using Photon API (450ms debounce)
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setHasQueried(false);
      return;
    }

    setIsLoading(true);
    setHasQueried(false);

    // Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const results = await fetchPhotonSuggestions(value, controller.signal);
        setSuggestions(results);
        setHasQueried(true);
      } catch (err) {
        console.error('Autocomplete error', err);
      } finally {
        setIsLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (s: PhotonSuggestion) => {
    onChange(s.formattedLabel);
    onSelectLocation({
      name: s.formattedLabel,
      lat: s.lat,
      lng: s.lng,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
        <span>{label}</span>
        {required && <span className="text-slate-400 font-normal text-[10px]">Wajib</span>}
      </label>

      <div className="relative flex items-center">
        {/* Dot indicator */}
        <span
          className={`absolute left-3 w-2.5 h-2.5 rounded-full ring-4 ${
            isOrigin
              ? 'bg-emerald-500 ring-emerald-50'
              : 'bg-blue-600 ring-blue-50'
          }`}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-colors"
        />

        {/* Clear or loading indicator */}
        <div className="absolute right-2.5 flex items-center">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Mencari rekomendasi lokasi di Indonesia...</span>
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Saran Lokasi (Komoot Photon)
              </div>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="px-3.5 py-2 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.formattedLabel}
                    </div>
                    {item.subLabel && (
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subLabel}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && hasQueried && suggestions.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              Tidak ada lokasi &ldquo;{value}&rdquo; ditemukan di Indonesia.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
