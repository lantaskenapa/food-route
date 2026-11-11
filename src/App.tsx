import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExploreView } from './components/ExploreView';
import { RouteMapView } from './components/RouteMapView';
import { TikTokScraperView } from './components/TikTokScraperView';
import { DataKulinerView } from './components/DataKulinerView';
import { SupabaseModal } from './components/SupabaseModal';
import { FoodDetailModal } from './components/FoodDetailModal';
import { FoodPlace, ScraperJob, UserProfile } from './types';
import { 
  fetchFoodPlaces, 
  addFoodPlace, 
  updateFoodPlace, 
  deleteFoodPlace, 
  fetchScraperJobs, 
  addScraperJob, 
  addTikTokSource,
  getActiveUser, 
  setActiveUserRole, 
  getStoredSupabaseConfig 
} from './services/supabase';
import { executeRouteAutoScraper, ScrapedResultItem } from './services/tiktokScraper';
import { Database, Heart } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'explore' | 'map' | 'data' | 'scraper'>('explore');
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);
  const [scraperJobs, setScraperJobs] = useState<ScraperJob[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(getActiveUser());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [selectedFoodPlace, setSelectedFoodPlace] = useState<FoodPlace | null>(null);

  // Active Route Trip state for Map View
  const [routeOrigin, setRouteOrigin] = useState('Jakarta');
  const [routeOriginCoords, setRouteOriginCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  });
  const [routeDest, setRouteDest] = useState('Bandung');
  const [routeDestCoords, setRouteDestCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.9175,
    lng: 107.6191,
  });
  const [routeRadius, setRouteRadius] = useState<number>(10);
  const [routePresetId, setRoutePresetId] = useState<string | undefined>('jkt-bdg');

  // Auto Scraping States
  const [isAutoScraping, setIsAutoScraping] = useState(false);
  const [autoScrapingStep, setAutoScrapingStep] = useState(1);
  const [autoScrapingTitle, setAutoScrapingTitle] = useState('');
  const [autoScrapingDetail, setAutoScrapingDetail] = useState('');
  const [autoScrapingError, setAutoScrapingError] = useState<string | null>(null);

  const supabaseConfig = getStoredSupabaseConfig();

  // Load initial data
  const loadAllData = async () => {
    try {
      const places = await fetchFoodPlaces();
      setFoodPlaces(places);
      const jobs = await fetchScraperJobs();
      setScraperJobs(jobs);
    } catch (err) {
      console.error('Error loading initial data', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Switch role between Explorer and Admin
  const handleSwitchRole = (role: 'admin' | 'user') => {
    const updated = setActiveUserRole(role);
    setCurrentUser(updated);
    if (role === 'user' && currentTab === 'scraper') {
      setCurrentTab('explore');
    }
  };

  // AUTO SCRAPING WORKFLOW TRIGGERED BY USER ON EXPLORE PAGE
  const handleApplyRoute = async (
    originName: string,
    destName: string,
    radiusKm: number,
    presetId?: string,
    passedOriginCoords?: { lat: number; lng: number },
    passedDestCoords?: { lat: number; lng: number }
  ) => {
    if (passedOriginCoords) setRouteOriginCoords(passedOriginCoords);
    if (passedDestCoords) setRouteDestCoords(passedDestCoords);

    setIsAutoScraping(true);
    setAutoScrapingError(null);
    setAutoScrapingStep(1);

    try {
      // 1. Execute full pipeline: corridor analysis -> TikTok scrape -> extract -> geocode -> save
      const { scrapedItems, resolvedOriginCoords, resolvedDestCoords } = await executeRouteAutoScraper({
        origin: originName,
        destination: destName,
        originCoords: passedOriginCoords,
        destCoords: passedDestCoords,
        existingPlaces: foodPlaces,
        onProgress: (step, title, detail) => {
          setAutoScrapingStep(step);
          setAutoScrapingTitle(title);
          setAutoScrapingDetail(detail);
        },
      });

      // Update route coordinates with verified geocoded coordinates
      setRouteOriginCoords(resolvedOriginCoords);
      setRouteDestCoords(resolvedDestCoords);

      // 2. Persist scraped places to Supabase
      let savedCount = 0;
      let duplicateCount = 0;

      for (const item of scrapedItems) {
        if (item.is_duplicate) {
          duplicateCount++;
        }
        await addFoodPlace({
          name: item.name,
          address: item.address,
          city: item.city,
          latitude: item.latitude,
          longitude: item.longitude,
          category: item.category,
          tiktok_url: item.tiktok_url,
          tiktok_creator: item.tiktok_creator,
          tiktok_views: item.tiktok_views,
          verified: !item.needs_manual_verification,
          viral_score: item.viral_score,
          rating: item.rating,
          price_range: item.price_range,
          signature_dish: item.signature_dish,
          opening_hours: item.opening_hours,
          image_url: item.image_url,
          notes: item.notes,
        });

        await addTikTokSource({
          url: item.tiktok_url,
          keyword: `Auto: ${originName} -> ${destName}`,
          video_title: item.name,
          author_name: item.tiktok_creator,
          author_handle: item.tiktok_creator,
          thumbnail_url: item.image_url,
          extracted_place_name: item.name,
          extracted_address: item.address,
          extracted_city: item.city,
          extracted_category: item.category,
          status: 'success',
        });

        savedCount++;
      }

      // 3. Log to scraper_jobs in Supabase
      await addScraperJob({
        job_name: `Auto Scrape Rute: ${originName} - ${destName}`,
        keyword: `${originName} -> ${destName}`,
        total_scraped: scrapedItems.length,
        success_count: savedCount,
        duplicate_count: duplicateCount,
        status: 'completed',
      });

      // 4. Refresh dataset from Supabase
      const updated = await fetchFoodPlaces();
      setFoodPlaces(updated);

      // 5. Update route coordinates & parameters
      setRouteOrigin(originName);
      setRouteDest(destName);
      setRouteRadius(radiusKm);
      setRoutePresetId(presetId);

      // Brief pause to allow user to see 100% completion
      await new Promise((r) => setTimeout(r, 400));
      setIsAutoScraping(false);

      // 6. Automatically navigate to Map UI with route & food markers!
      setCurrentTab('map');
    } catch (err: any) {
      console.error('Auto route scraping failed', err);
      setIsAutoScraping(false);
      setAutoScrapingError(
        'Gagal mencari atau memvalidasi kuliner di sepanjang rute. Silakan coba kembali atau gunakan kata kunci kota lain.'
      );
    }
  };

  const handleRetryAutoScraping = () => {
    setAutoScrapingError(null);
    handleApplyRoute(routeOrigin, routeDest, routeRadius);
  };

  // View specific food place on Route Map
  const handleViewOnRouteMap = (place: FoodPlace) => {
    setRouteOrigin('Jakarta');
    setRouteOriginCoords({ lat: -6.2088, lng: 106.8456 });
    setRouteDest(place.city);
    setRouteDestCoords({ lat: place.latitude, lng: place.longitude });
    setCurrentTab('map');
    setSelectedFoodPlace(place);
  };

  // Manual Scraper bulk save handler (Admin)
  const handleSaveScrapedToDatabase = async (
    scrapedItems: ScrapedResultItem[],
    keyword: string,
    url?: string
  ) => {
    let savedCount = 0;
    let duplicateCount = 0;

    for (const item of scrapedItems) {
      if (item.is_duplicate) duplicateCount++;

      await addFoodPlace({
        name: item.name,
        address: item.address,
        city: item.city,
        latitude: item.latitude,
        longitude: item.longitude,
        category: item.category,
        tiktok_url: item.tiktok_url,
        tiktok_creator: item.tiktok_creator,
        tiktok_views: item.tiktok_views,
        verified: !item.needs_manual_verification,
        viral_score: item.viral_score,
        rating: item.rating,
        price_range: item.price_range,
        signature_dish: item.signature_dish,
        opening_hours: item.opening_hours,
        image_url: item.image_url,
        notes: item.notes,
      });

      await addTikTokSource({
        url: item.tiktok_url,
        keyword: keyword,
        video_title: item.name,
        author_name: item.tiktok_creator,
        author_handle: item.tiktok_creator,
        thumbnail_url: item.image_url,
        extracted_place_name: item.name,
        extracted_address: item.address,
        extracted_city: item.city,
        extracted_category: item.category,
        status: item.needs_manual_verification ? 'needs_verification' : 'success',
      });

      savedCount++;
    }

    await addScraperJob({
      job_name: `Manual Scraping: ${keyword || 'TikTok URL'}`,
      keyword: keyword || 'Direct URL',
      target_url: url,
      total_scraped: scrapedItems.length,
      success_count: savedCount,
      duplicate_count: duplicateCount,
      status: 'completed',
    });

    await loadAllData();
  };

  // Data Kuliner CRUD handlers
  const handleAddManualFoodPlace = async (place: Omit<FoodPlace, 'id'>) => {
    await addFoodPlace(place);
    await loadAllData();
  };

  const handleUpdateFoodPlace = async (id: string, updates: Partial<FoodPlace>) => {
    await updateFoodPlace(id, updates);
    await loadAllData();
  };

  const handleDeleteFoodPlace = async (id: string) => {
    await deleteFoodPlace(id);
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif] text-slate-800">
      
      {/* Minimalist trip-Go Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={supabaseConfig.isConnected}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {currentTab === 'explore' && (
          <ExploreView
            foodPlaces={foodPlaces}
            onApplyRoute={handleApplyRoute}
            onSelectFoodPlace={(p) => setSelectedFoodPlace(p)}
            onNavigateToTab={setCurrentTab}
            isAutoScraping={isAutoScraping}
            autoScrapingStep={autoScrapingStep}
            autoScrapingTitle={autoScrapingTitle}
            autoScrapingDetail={autoScrapingDetail}
            autoScrapingError={autoScrapingError}
            onRetryAutoScraping={handleRetryAutoScraping}
          />
        )}

        {currentTab === 'map' && (
          <RouteMapView
            allFoodPlaces={foodPlaces}
            initialOrigin={routeOrigin}
            initialDestination={routeDest}
            initialOriginCoords={routeOriginCoords}
            initialDestCoords={routeDestCoords}
            initialRadius={routeRadius}
            onSelectFoodPlace={(p) => setSelectedFoodPlace(p)}
          />
        )}

        {currentTab === 'data' && (
          <DataKulinerView
            foodPlaces={foodPlaces}
            onAddFoodPlace={handleAddManualFoodPlace}
            onUpdateFoodPlace={handleUpdateFoodPlace}
            onDeleteFoodPlace={handleDeleteFoodPlace}
            onViewOnMap={handleViewOnRouteMap}
          />
        )}

        {currentTab === 'scraper' && (
          <TikTokScraperView
            existingPlaces={foodPlaces}
            scraperJobs={scraperJobs}
            onSaveScrapedToDatabase={handleSaveScrapedToDatabase}
          />
        )}
      </main>

      {/* Minimalist Footer */}
      {currentTab !== 'map' && (
        <footer className="bg-white border-t border-slate-200/80 py-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                trip<span className="text-blue-600">-Go</span>
              </span>
              <span>• Auto TikTok Scraper & Food Route Discovery</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase PostgreSQL Schema</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Supabase Connection & Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={loadAllData}
      />

      {/* Food Place Details Modal */}
      <FoodDetailModal
        place={selectedFoodPlace}
        onClose={() => setSelectedFoodPlace(null)}
        onViewOnRouteMap={handleViewOnRouteMap}
      />

    </div>
  );
}
