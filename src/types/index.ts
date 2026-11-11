export type FoodCategory =
  | 'Tradisional'
  | 'Sate & Daging'
  | 'Mie & Bakso'
  | 'Kopi & Cafe'
  | 'Street Food'
  | 'Bakery & Pastry'
  | 'Seafood'
  | 'Sambal & Pedas'
  | 'Dessert & Es';

export interface FoodPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  category: FoodCategory;
  tiktok_url?: string;
  tiktok_creator?: string;
  tiktok_views?: string;
  verified: boolean;
  viral_score: number; // 1-100
  rating: number; // 1.0 - 5.0
  price_range: string; // e.g. "Rp 25.000 - Rp 50.000"
  signature_dish: string;
  opening_hours: string;
  image_url?: string;
  notes?: string;
  created_at?: string;
  distance_from_route_km?: number; // Calculated on the fly in map view
  order_along_route?: number;
}

export interface TikTokSource {
  id: string;
  url: string;
  keyword?: string;
  video_title?: string;
  author_name?: string;
  author_handle?: string;
  thumbnail_url?: string;
  extracted_place_name?: string;
  extracted_address?: string;
  extracted_city?: string;
  extracted_category?: FoodCategory;
  status: 'pending' | 'success' | 'failed' | 'needs_verification';
  created_at?: string;
}

export interface ScraperJob {
  id: string;
  job_name: string;
  keyword: string;
  target_url?: string;
  total_scraped: number;
  success_count: number;
  duplicate_count: number;
  status: 'running' | 'completed' | 'failed';
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  avatar_url?: string;
}

export interface PresetRoute {
  id: string;
  name: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  description: string;
  estimated_distance_km: number;
  estimated_time: string;
  tag: string;
}
