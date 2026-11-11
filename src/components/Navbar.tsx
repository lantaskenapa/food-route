import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Database, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Menu,
  X,
  Layers
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: 'explore' | 'map' | 'data' | 'scraper';
  setCurrentTab: (tab: 'explore' | 'map' | 'data' | 'scraper') => void;
  currentUser: UserProfile;
  onSwitchRole: (role: 'admin' | 'user') => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchRole,
  onOpenSupabaseModal,
  isSupabaseConnected,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'data', label: 'Data Kuliner', icon: Database },
    { 
      id: 'scraper', 
      label: 'Admin Scraper', 
      icon: Sparkles,
      adminOnly: true,
      badge: 'Admin'
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Brand: Minimalist trip-Go */}
          <div 
            onClick={() => setCurrentTab('explore')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            {/* Minimalist Logo */}
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg 
                className="w-4 h-4 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 0 1 10 10c0 5.5-10 10-10 10S2 17.5 2 12A10 10 0 0 1 12 2z" />
              </svg>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                trip<span className="text-blue-600">-Go</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                food route
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Minimalist Clean Pills */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-100 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Minimal Controls */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Supabase status indicator */}
            <button
              onClick={onOpenSupabaseModal}
              title="Konfigurasi Supabase PostgreSQL"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium">Supabase</span>
            </button>

            <span className="h-4 w-px bg-slate-200" />

            {/* Role Switcher */}
            <div className="flex items-center text-[11px]">
              <button
                onClick={() => onSwitchRole(currentUser.role === 'admin' ? 'user' : 'admin')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors font-medium"
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Explorer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setCurrentTab('map')}
              className="p-1.5 text-blue-600 bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                  isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() => {
                onOpenSupabaseModal();
                setMobileMenuOpen(false);
              }}
              className="py-1.5 px-3 bg-slate-100 rounded-lg font-medium text-slate-700 flex-1 text-center"
            >
              Supabase Config
            </button>
            <button
              onClick={() => {
                onSwitchRole(currentUser.role === 'admin' ? 'user' : 'admin');
              }}
              className="py-1.5 px-3 bg-blue-50 text-blue-600 rounded-lg font-medium flex-1 text-center"
            >
              Role: {currentUser.role === 'admin' ? 'Admin' : 'Explorer'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
