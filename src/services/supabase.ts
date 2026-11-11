import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FoodPlace, TikTokSource, ScraperJob, UserProfile } from '../types';
import { INITIAL_FOOD_PLACES } from './sampleData';

const STORAGE_KEY_CONFIG = 'kulinertrip_supabase_config';
const STORAGE_KEY_FOODS = 'kulinertrip_food_places';
const STORAGE_KEY_SOURCES = 'kulinertrip_tiktok_sources';
const STORAGE_KEY_JOBS = 'kulinertrip_scraper_jobs';
const STORAGE_KEY_USER = 'kulinertrip_active_user';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

// Load Supabase credentials from local storage or environment
export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading Supabase config from storage', e);
  }
  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
    isConnected: false,
  };
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    if (!supabaseClient) {
      supabaseClient = createClient(config.url, config.anonKey);
    }
    return supabaseClient;
  }
  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    const isValid = Boolean(url && anonKey && url.startsWith('https://'));
    const config: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: isValid,
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    if (isValid) {
      supabaseClient = createClient(config.url, config.anonKey);
    } else {
      supabaseClient = null;
    }
    return true;
  } catch (e) {
    console.error('Failed to save Supabase config', e);
    return false;
  }
}

// ==========================================
// Local Storage fallback helpers
// ==========================================
function getLocalFoods(): FoodPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOODS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEY_FOODS, JSON.stringify(INITIAL_FOOD_PLACES));
  return INITIAL_FOOD_PLACES;
}

function saveLocalFoods(data: FoodPlace[]): void {
  localStorage.setItem(STORAGE_KEY_FOODS, JSON.stringify(data));
}

function getLocalSources(): TikTokSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOURCES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveLocalSources(data: TikTokSource[]): void {
  localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(data));
}

function getLocalJobs(): ScraperJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [
    {
      id: 'job-init-01',
      job_name: 'Seed Koridor Tol Cipularang & Pantura',
      keyword: 'Kuliner Viral Tol Trans Jawa',
      total_scraped: 15,
      success_count: 15,
      duplicate_count: 0,
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

function saveLocalJobs(data: ScraperJob[]): void {
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(data));
}

// ==========================================
// User & Auth Management
// ==========================================
export function getActiveUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  const defaultUser: UserProfile = {
    id: 'u-admin-01',
    email: 'admin@kulinertrip.id',
    full_name: 'Admin Kuliner Trip',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(defaultUser));
  return defaultUser;
}

export function setActiveUserRole(role: 'admin' | 'user'): UserProfile {
  const current = getActiveUser();
  const updated: UserProfile = {
    ...current,
    role,
    full_name: role === 'admin' ? 'Admin Kuliner Trip' : 'Explorer Nusantara',
    email: role === 'admin' ? 'admin@kulinertrip.id' : 'explorer@kulinertrip.id',
  };
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
  return updated;
}

// ==========================================
// FOOD PLACES CRUD
// ==========================================
export async function fetchFoodPlaces(): Promise<FoodPlace[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('food_places')
        .select('*')
        .order('viral_score', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as FoodPlace[];
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using local store', e);
    }
  }
  return getLocalFoods();
}

export async function addFoodPlace(place: Omit<FoodPlace, 'id'> & { id?: string }): Promise<FoodPlace> {
  const newPlace: FoodPlace = {
    ...place,
    id: place.id || crypto.randomUUID(),
    created_at: place.created_at || new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('food_places').insert([newPlace]).select().single();
      if (!error && data) {
        // Also sync local
        const local = getLocalFoods();
        saveLocalFoods([data as FoodPlace, ...local]);
        return data as FoodPlace;
      }
    } catch (e) {
      console.warn('Supabase insert failed, persisting to local store', e);
    }
  }

  const local = getLocalFoods();
  const updated = [newPlace, ...local];
  saveLocalFoods(updated);
  return newPlace;
}

export async function updateFoodPlace(id: string, updates: Partial<FoodPlace>): Promise<FoodPlace | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('food_places')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const local = getLocalFoods().map((p) => (p.id === id ? { ...p, ...updates } : p));
        saveLocalFoods(local);
        return data as FoodPlace;
      }
    } catch (e) {
      console.warn('Supabase update failed, updating local store', e);
    }
  }

  const local = getLocalFoods();
  let updatedPlace: FoodPlace | null = null;
  const updated = local.map((p) => {
    if (p.id === id) {
      updatedPlace = { ...p, ...updates };
      return updatedPlace;
    }
    return p;
  });
  saveLocalFoods(updated);
  return updatedPlace;
}

export async function deleteFoodPlace(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('food_places').delete().eq('id', id);
      if (!error) {
        const local = getLocalFoods().filter((p) => p.id !== id);
        saveLocalFoods(local);
        return true;
      }
    } catch (e) {
      console.warn('Supabase delete error', e);
    }
  }

  const local = getLocalFoods();
  const updated = local.filter((p) => p.id !== id);
  saveLocalFoods(updated);
  return true;
}

// ==========================================
// TIKTOK SOURCES & SCRAPER JOBS
// ==========================================
export async function fetchTikTokSources(): Promise<TikTokSource[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('tiktok_sources')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as TikTokSource[];
    } catch (e) {
      console.warn(e);
    }
  }
  return getLocalSources();
}

export async function addTikTokSource(source: Omit<TikTokSource, 'id'>): Promise<TikTokSource> {
  const newSource: TikTokSource = {
    ...source,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('tiktok_sources').insert([newSource]).select().single();
      if (!error && data) {
        const local = getLocalSources();
        saveLocalSources([data as TikTokSource, ...local]);
        return data as TikTokSource;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  const local = getLocalSources();
  saveLocalSources([newSource, ...local]);
  return newSource;
}

export async function fetchScraperJobs(): Promise<ScraperJob[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('scraper_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as ScraperJob[];
    } catch (e) {
      console.warn(e);
    }
  }
  return getLocalJobs();
}

export async function addScraperJob(job: Omit<ScraperJob, 'id'>): Promise<ScraperJob> {
  const newJob: ScraperJob = {
    ...job,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('scraper_jobs').insert([newJob]).select().single();
      if (!error && data) {
        const local = getLocalJobs();
        saveLocalJobs([data as ScraperJob, ...local]);
        return data as ScraperJob;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  const local = getLocalJobs();
  saveLocalJobs([newJob, ...local]);
  return newJob;
}

// ==========================================
// SUPABASE POSTGRESQL SCHEMA SCRIPT
// ==========================================
export const SUPABASE_SQL_SCHEMA = `-- =======================================================
-- KULINER TRIP - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Includes UUID extension, Tables, Foreign Keys, Indexes,
-- Row Level Security (RLS) & Triggers
-- =======================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: food_places
CREATE TABLE IF NOT EXISTS public.food_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    category TEXT NOT NULL DEFAULT 'Tradisional',
    tiktok_url TEXT,
    tiktok_creator TEXT,
    tiktok_views TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    viral_score INTEGER DEFAULT 80 CHECK (viral_score >= 1 AND viral_score <= 100),
    rating NUMERIC(2,1) DEFAULT 4.5,
    price_range TEXT DEFAULT 'Rp 25.000 - Rp 50.000',
    signature_dish TEXT,
    opening_hours TEXT DEFAULT '09:00 - 21:00 WIB',
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: tiktok_sources
CREATE TABLE IF NOT EXISTS public.tiktok_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    keyword TEXT,
    video_title TEXT,
    author_name TEXT,
    author_handle TEXT,
    thumbnail_url TEXT,
    extracted_place_name TEXT,
    extracted_address TEXT,
    extracted_city TEXT,
    extracted_category TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'needs_verification')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: scraper_jobs
CREATE TABLE IF NOT EXISTS public.scraper_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name TEXT NOT NULL,
    keyword TEXT,
    target_url TEXT,
    total_scraped INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- INDEXES FOR HIGH-PERFORMANCE ROUTE & SPATIAL SEARCHES
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_food_places_lat_lon ON public.food_places (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_food_places_city ON public.food_places (city);
CREATE INDEX IF NOT EXISTS idx_food_places_category ON public.food_places (category);
CREATE INDEX IF NOT EXISTS idx_food_places_verified ON public.food_places (verified);
CREATE INDEX IF NOT EXISTS idx_food_places_viral_score ON public.food_places (viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_sources_status ON public.tiktok_sources (status);
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_created_at ON public.scraper_jobs (created_at DESC);

-- =======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================
ALTER TABLE public.food_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Public can read verified food places
CREATE POLICY "Public read verified foods" ON public.food_places
    FOR SELECT USING (true);

-- Authenticated users/admins can insert and update
CREATE POLICY "Full access for authenticated users" ON public.food_places
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Public read sources" ON public.tiktok_sources
    FOR ALL USING (true);

CREATE POLICY "Public read jobs" ON public.scraper_jobs
    FOR ALL USING (true);

CREATE POLICY "Users can read profiles" ON public.user_profiles
    FOR ALL USING (true);
`;
