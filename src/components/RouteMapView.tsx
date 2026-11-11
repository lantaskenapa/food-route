import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// Ensure MapLibre GL JS worker is loaded via Vite's resolved static asset URL
if (typeof window !== 'undefined' && typeof maplibregl.setWorkerUrl === 'function') {
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}

import { 
  Navigation, 
  MapPin, 
  ArrowRight, 
  Search, 
  ChevronRight, 
  X,
  Layers,
  ExternalLink,
  Compass,
  Star
} from 'lucide-react';
import { FoodPlace } from '../types';
import { fetchDrivingRoute, getFoodPlacesAlongRoute } from '../services/routing';

interface RouteMapViewProps {
  allFoodPlaces: FoodPlace[];
  initialOrigin?: string;
  initialDestination?: string;
  initialOriginCoords?: { lat: number; lng: number };
  initialDestCoords?: { lat: number; lng: number };
  initialRadius?: number;
  onSelectFoodPlace: (place: FoodPlace) => void;
}

// OpenFreeMap vector map styles (Positron & Liberty)
const MAP_STYLES: Record<'positron' | 'liberty', string> = {
  positron: 'https://tiles.openfreemap.org/styles/positron',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
};

export const RouteMapView: React.FC<RouteMapViewProps> = ({
  allFoodPlaces,
  initialOrigin = 'Jakarta',
  initialDestination = 'Bandung',
  initialOriginCoords,
  initialDestCoords,
  initialRadius = 10,
  onSelectFoodPlace,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [currentStyle, setCurrentStyle] = useState<'positron' | 'liberty'>('positron');
  const [originName, setOriginName] = useState(initialOrigin);
  const [destName, setDestName] = useState(initialDestination);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>(
    initialOriginCoords || { lat: -6.2088, lng: 106.8456 } // Jakarta default
  );
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number }>(
    initialDestCoords || { lat: -6.9175, lng: 107.6191 } // Bandung default
  );

  const [radiusKm, setRadiusKm] = useState<number>(initialRadius);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMinutes: number;
    summary: string;
    coordinates: [number, number][]; // [lat, lng]
  } | null>(null);

  const [placesAlongRoute, setPlacesAlongRoute] = useState<FoodPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Update coordinates if passed from parent
  useEffect(() => {
    if (initialOriginCoords) setOriginCoords(initialOriginCoords);
    if (initialDestCoords) setDestCoords(initialDestCoords);
    if (initialOrigin) setOriginName(initialOrigin);
    if (initialDestination) setDestName(initialDestination);
  }, [initialOrigin, initialDestination, initialOriginCoords, initialDestCoords]);

  // Initialize MapLibre GL JS with OpenFreeMap vector style
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES[currentStyle],
        center: [originCoords.lng, originCoords.lat],
        zoom: 9,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');

      mapInstanceRef.current = map;
    }

    return () => {
      // Map instance lifecycle maintained
    };
  }, []);

  // Handle style switch (Positron vs Liberty)
  const handleToggleStyle = () => {
    const nextStyle = currentStyle === 'positron' ? 'liberty' : 'positron';
    setCurrentStyle(nextStyle);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setStyle(MAP_STYLES[nextStyle]);
      // Once style loads, re-add route layer
      mapInstanceRef.current.once('style.load', () => {
        if (routeInfo && routeInfo.coordinates.length > 0) {
          drawRouteOnMap(routeInfo.coordinates);
        }
      });
    }
  };

  // Helper to draw or update blue route polyline on MapLibre
  const drawRouteOnMap = (coordsLatLng: [number, number][]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!map.isStyleLoaded()) {
      map.once('load', () => drawRouteOnMap(coordsLatLng));
      return;
    }

    // Convert [lat, lng] to [lng, lat] for GeoJSON
    const coordsLngLat: [number, number][] = coordsLatLng.map((c) => [c[1], c[0]]);

    const geojson: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordsLngLat,
      },
    };

    if (map.getSource('route-source')) {
      (map.getSource('route-source') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('route-source', {
        type: 'geojson',
        data: geojson,
      });

      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#2563EB', // Blue route line
          'line-width': 4.5,
          'line-opacity': 0.9,
        },
      });
    }

    // Fit map bounds smoothly
    if (coordsLngLat.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      coordsLngLat.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 340 },
        maxZoom: 13,
        duration: 900,
      });
    }
  };

  // Render markers: Origin (Green), Destination (Dark), and Food places
  const renderMarkers = (
    orig: { lat: number; lng: number; name: string },
    dest: { lat: number; lng: number; name: string },
    foods: FoodPlace[]
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m: any) => m.remove());
    markersRef.current = [];

    // 1. Origin Marker (Green Minimal Dot)
    const origEl = document.createElement('div');
    origEl.className = 'origin-marker';
    origEl.innerHTML = `
      <div style="background-color: #10B981; width: 22px; height: 22px; border-radius: 9999px; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
        <span style="width: 6px; height: 6px; background-color: white; border-radius: 9999px;"></span>
      </div>
    `;

    const origPopup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
      <div style="padding: 6px 8px; font-family: Inter, sans-serif; font-size: 11px; font-weight: 600; color: #0F172A;">
        Titik Asal: ${orig.name}
      </div>
    `);

    const origMarker = new maplibregl.Marker({ element: origEl })
      .setLngLat([orig.lng, orig.lat])
      .setPopup(origPopup)
      .addTo(map);

    markersRef.current.push(origMarker);

    // 2. Destination Marker (Dark Minimal Dot)
    const destEl = document.createElement('div');
    destEl.className = 'dest-marker';
    destEl.innerHTML = `
      <div style="background-color: #1E293B; width: 22px; height: 22px; border-radius: 9999px; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
        <span style="width: 6px; height: 6px; background-color: white; border-radius: 9999px;"></span>
      </div>
    `;

    const destPopup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
      <div style="padding: 6px 8px; font-family: Inter, sans-serif; font-size: 11px; font-weight: 600; color: #0F172A;">
        Titik Tujuan: ${dest.name}
      </div>
    `);

    const destMarker = new maplibregl.Marker({ element: destEl })
      .setLngLat([dest.lng, dest.lat])
      .setPopup(destPopup)
      .addTo(map);

    markersRef.current.push(destMarker);

    // 3. Food Markers along route
    foods.forEach((place) => {
      const foodEl = document.createElement('div');
      foodEl.className = 'minimal-food-marker';
      foodEl.innerHTML = `
        <div style="background: white; border: 1.5px solid #2563EB; width: 28px; height: 28px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(37,99,235,0.25); font-size: 13px; cursor: pointer;">
          🍽️
        </div>
      `;

      // Official Google Maps Directions link requirement:
      // https://www.google.com/maps/dir/?api=1&destination=LATITUDE,LONGITUDE&travelmode=driving
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;

      const popupHtml = `
        <div style="width: 230px; padding: 10px; font-family: Inter, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: #2563EB; background: #EFF6FF; padding: 2px 6px; border-radius: 4px;">
              ${place.category}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #D97706;">★ ${place.rating}</span>
          </div>
          <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 3px 0; color: #0F172A;">${place.name}</h4>
          <p style="font-size: 11px; color: #64748B; margin: 0 0 8px 0; line-height: 1.35;">${place.address}</p>
          <div style="background: #F8FAFC; padding: 5px 8px; border-radius: 6px; font-size: 11px; margin-bottom: 8px;">
            <span style="color: #64748B;">Spesial:</span> <b>${place.signature_dish}</b>
          </div>
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #2563EB; color: white; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none;">
            Navigasi ↗
          </a>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 20, closeButton: true }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ element: foodEl })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(popup)
        .addTo(map);

      foodEl.addEventListener('click', () => {
        setSelectedPlaceId(place.id);
      });

      markersRef.current.push(marker);
    });
  };

  // Execute OSRM Route Calculation
  const calculateAndRenderRoute = async (
    orig: { lat: number; lng: number; name: string },
    dest: { lat: number; lng: number; name: string },
    radius: number
  ) => {
    setIsLoadingRoute(true);

    try {
      const res = await fetchDrivingRoute(orig, dest);
      setRouteInfo({
        distanceKm: res.distanceKm,
        durationMinutes: res.durationMinutes,
        summary: res.summary,
        coordinates: res.coordinates,
      });

      // Filter food places along route within radius
      const found = getFoodPlacesAlongRoute(allFoodPlaces, res.coordinates, radius);
      setPlacesAlongRoute(found);

      // Draw polyline on OpenFreeMap
      drawRouteOnMap(res.coordinates);

      // Render origin, destination, and food markers
      renderMarkers(orig, dest, found);
    } catch (err) {
      console.error('OSRM route calculation error', err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Re-calculate when coordinates, radius, or database food places change
  useEffect(() => {
    calculateAndRenderRoute(
      { ...originCoords, name: originName },
      { ...destCoords, name: destName },
      radiusKm
    );
  }, [originCoords, destCoords, radiusKm, allFoodPlaces]);

  // Click on list item to fly to place
  const handleFocusPlace = (place: FoodPlace) => {
    setSelectedPlaceId(place.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [place.longitude, place.latitude],
        zoom: 14.5,
        duration: 900,
      });
    }
  };

  const filteredPlaces = placesAlongRoute.filter((p: FoodPlace) => {
    return (
      searchFilter === '' ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.address.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.signature_dish.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50 font-['Inter',sans-serif]">
      
      {/* OpenFreeMap + MapLibre GL Canvas (Dominant Main View) */}
      <div className="flex-1 relative h-full w-full">
        
        {/* Floating Minimal Controls on Top-Left */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
          
          {/* Origin -> Destination Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-xs text-xs font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{originName}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span>{destName}</span>
          </div>

          {/* Simple Radius Filter Pills */}
          <div className="flex items-center bg-white/95 backdrop-blur-md p-0.5 rounded-xl border border-slate-200/90 shadow-xs text-xs">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Radius:</span>
            {[2, 5, 10, 20].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  radiusKm === r
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>

          {/* OpenFreeMap Style Switcher (Positron vs Liberty) */}
          <button
            onClick={handleToggleStyle}
            title="Ganti gaya peta (Positron / Liberty)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-xs text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="capitalize">{currentStyle}</span>
          </button>

          {/* Route distance summary */}
          {routeInfo && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs text-xs text-slate-600">
              <span className="font-semibold text-blue-600">{routeInfo.distanceKm} km</span>
              <span>•</span>
              <span>~{Math.floor(routeInfo.durationMinutes / 60)}j {routeInfo.durationMinutes % 60}m</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoadingRoute && (
            <div className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs text-xs text-blue-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Menghitung rute OSRM...</span>
            </div>
          )}
        </div>

        {/* Toggle Right Panel button */}
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="absolute top-4 right-4 z-20 p-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xs text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5"
        >
          <span>{filteredPlaces.length} Kuliner</span>
          {isRightPanelOpen ? <X className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* MapLibre GL Map Element */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Sisi Kanan: Panel Daftar Kuliner Sederhana (Right Panel) */}
      <aside
        className={`fixed lg:relative inset-y-0 right-0 z-30 w-80 sm:w-88 bg-white border-l border-slate-200/90 flex flex-col shadow-lg lg:shadow-none transition-transform duration-300 ${
          isRightPanelOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'
        }`}
      >
        {/* Minimal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs">
              Kuliner di Sepanjang Rute
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filteredPlaces.length} tempat ditemukan (radius {radiusKm} km)
            </p>
          </div>
          <button
            onClick={() => setIsRightPanelOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search inside route */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari tempat di rute..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Minimal List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
          {filteredPlaces.map((place: FoodPlace, idx: number) => {
            const isSelected = selectedPlaceId === place.id;
            // Navigasi URL exact format
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;

            return (
              <div
                key={place.id}
                onClick={() => handleFocusPlace(place)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-300'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 text-[10px] mb-1">
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {place.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-500 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {place.rating}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {place.distance_from_route_km != null
                          ? `${place.distance_from_route_km} km dari rute`
                          : '0 km'}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                    {idx + 1}. {place.name}
                  </h4>

                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {place.address}
                  </p>

                  <div className="mt-1.5 p-1.5 rounded-lg bg-slate-50 text-[10px] text-slate-700">
                    <span className="text-slate-400 font-semibold">Menu: </span>
                    <span className="font-medium line-clamp-1">{place.signature_dish}</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  {/* Google Maps Navigasi Button */}
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 transition-colors text-[10px]"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Navigasi</span>
                  </a>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFoodPlace(place);
                    }}
                    className="text-slate-500 hover:text-blue-600 font-semibold text-[11px]"
                  >
                    Detail Lengkap →
                  </button>
                </div>
              </div>
            );
          })}

          {filteredPlaces.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Tidak ada kuliner dalam radius {radiusKm} km.
            </div>
          )}
        </div>
      </aside>

    </div>
  );
};
