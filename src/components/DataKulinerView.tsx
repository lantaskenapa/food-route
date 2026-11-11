import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Star, 
  Flame, 
  Filter,
  Check,
  X,
  Navigation
} from 'lucide-react';
import { FoodCategory, FoodPlace } from '../types';
import { CATEGORIES_LIST, CITIES_LIST } from '../services/sampleData';

interface DataKulinerViewProps {
  foodPlaces: FoodPlace[];
  onAddFoodPlace: (place: Omit<FoodPlace, 'id'>) => Promise<void>;
  onUpdateFoodPlace: (id: string, updates: Partial<FoodPlace>) => Promise<void>;
  onDeleteFoodPlace: (id: string) => Promise<void>;
  onViewOnMap: (place: FoodPlace) => void;
}

export const DataKulinerView: React.FC<DataKulinerViewProps> = ({
  foodPlaces,
  onAddFoodPlace,
  onUpdateFoodPlace,
  onDeleteFoodPlace,
  onViewOnMap,
}) => {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('Semua Kota');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<FoodPlace | null>(null);

  // Form state for adding manual place
  const [newPlace, setNewPlace] = useState<Omit<FoodPlace, 'id'>>({
    name: '',
    address: '',
    city: 'Bandung',
    latitude: -6.9175,
    longitude: 107.6191,
    category: 'Tradisional',
    tiktok_url: '',
    tiktok_creator: '@foodhunter',
    tiktok_views: '1.2M views',
    verified: true,
    viral_score: 90,
    rating: 4.7,
    price_range: 'Rp 25.000 - Rp 50.000',
    signature_dish: '',
    opening_hours: '09:00 - 21:00 WIB',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    notes: '',
  });

  // Filter food places
  const filteredPlaces = foodPlaces.filter((item) => {
    const matchSearch =
      search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.address.toLowerCase().includes(search.toLowerCase()) ||
      item.signature_dish.toLowerCase().includes(search.toLowerCase());

    const matchCity = cityFilter === 'Semua Kota' || item.city.includes(cityFilter);
    const matchCat = categoryFilter === 'Semua' || item.category === categoryFilter;
    const matchVer =
      verifiedFilter === 'all'
        ? true
        : verifiedFilter === 'verified'
        ? item.verified
        : !item.verified;

    return matchSearch && matchCity && matchCat && matchVer;
  });

  // Handle submit new place
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlace.name.trim() || !newPlace.address.trim()) return;
    await onAddFoodPlace(newPlace);
    setIsAddModalOpen(false);
    // Reset
    setNewPlace({
      name: '',
      address: '',
      city: 'Bandung',
      latitude: -6.9175,
      longitude: 107.6191,
      category: 'Tradisional',
      tiktok_url: '',
      tiktok_creator: '@foodhunter',
      tiktok_views: '1.2M views',
      verified: true,
      viral_score: 90,
      rating: 4.7,
      price_range: 'Rp 25.000 - Rp 50.000',
      signature_dish: '',
      opening_hours: '09:00 - 21:00 WIB',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      notes: '',
    });
  };

  // Handle submit edit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    await onUpdateFoodPlace(editingPlace.id, editingPlace);
    setEditingPlace(null);
  };

  // Toggle verify
  const handleToggleVerified = async (place: FoodPlace) => {
    await onUpdateFoodPlace(place.id, { verified: !place.verified });
  };

  // Delete place
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}" dari database?`)) {
      await onDeleteFoodPlace(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Data Kuliner Master (Supabase)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar lengkap seluruh titik kuliner viral yang tersimpan dalam tabel <code className="text-blue-600 font-semibold">food_places</code>.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kuliner Manual</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama tempat / menu..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800"
            />
          </div>

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 font-medium"
            >
              {CITIES_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 font-medium"
            >
              <option value="Semua">Semua Kategori</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Verified Status Filter */}
          <div>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Hanya Terverifikasi</option>
              <option value="unverified">Belum Verifikasi</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredPlaces.length}</strong> dari <strong>{foodPlaces.length}</strong> data kuliner</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tempat & Menu Andalan</th>
                <th className="p-3.5">Alamat Lengkap & Kota</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Sumber TikTok</th>
                <th className="p-3.5">Rating & Viral</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlaces.map((place) => (
                <tr key={place.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Name & Dish */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={place.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80'}
                        alt={place.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{place.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          🍲 {place.signature_dish}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="p-3.5 max-w-xs">
                    <div className="text-slate-800 line-clamp-1">{place.address}</div>
                    <div className="text-[11px] text-blue-600 font-semibold">{place.city}</div>
                  </td>

                  {/* Category */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {place.category}
                    </span>
                  </td>

                  {/* TikTok Source */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{place.tiktok_creator || '@tiktok'}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{place.tiktok_views || 'Viral'}</span>
                      {place.tiktok_url && (
                        <a
                          href={place.tiktok_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Rating & Viral */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{place.rating}</span>
                    </div>
                    <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5 mt-0.5">
                      <Flame className="w-3 h-3 fill-rose-600" />
                      <span>Viral {place.viral_score}%</span>
                    </div>
                  </td>

                  {/* Verified toggle */}
                  <td className="p-3.5">
                    <button
                      onClick={() => handleToggleVerified(place)}
                      title="Klik untuk ubah status verifikasi"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        place.verified
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {place.verified ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Terverifikasi</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-amber-600" />
                          <span>Belum Verifikasi</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Navigasi Google Maps */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka Navigasi Google Maps"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>

                      {/* View on Map */}
                      <button
                        onClick={() => onViewOnMap(place)}
                        title="Lihat di Route Map"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setEditingPlace(place)}
                        title="Edit Data Kuliner"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(place.id, place.name)}
                        title="Hapus Data"
                        className="p-1.5 rounded-lg bg-slate-100 text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlaces.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada kuliner yang cocok dengan filter</p>
          </div>
        )}
      </div>

      {/* Add New Place Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Data Kuliner Baru (Manual)</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Tempat</label>
                <input
                  type="text"
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                  placeholder="Contoh: Sate Khas Senayan"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={newPlace.address}
                  onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                  placeholder="Jl. Raya Utama No..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kota</label>
                  <select
                    value={newPlace.city}
                    onChange={(e) => setNewPlace({ ...newPlace, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    {CITIES_LIST.filter((c) => c !== 'Semua Kota').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={newPlace.category}
                    onChange={(e) =>
                      setNewPlace({
                        ...newPlace,
                        category: e.target.value as FoodCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newPlace.latitude}
                    onChange={(e) =>
                      setNewPlace({ ...newPlace, latitude: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newPlace.longitude}
                    onChange={(e) =>
                      setNewPlace({ ...newPlace, longitude: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Menu Andalan</label>
                <input
                  type="text"
                  value={newPlace.signature_dish}
                  onChange={(e) => setNewPlace({ ...newPlace, signature_dish: e.target.value })}
                  placeholder="Contoh: Sate Kambing Bumbu Kacang"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Link URL TikTok</label>
                <input
                  type="url"
                  value={newPlace.tiktok_url}
                  onChange={(e) => setNewPlace({ ...newPlace, tiktok_url: e.target.value })}
                  placeholder="https://www.tiktok.com/@..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan ke Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Place Modal */}
      {editingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Edit Data Kuliner</h3>
              <button
                onClick={() => setEditingPlace(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Tempat</label>
                <input
                  type="text"
                  value={editingPlace.name}
                  onChange={(e) => setEditingPlace({ ...editingPlace, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={editingPlace.address}
                  onChange={(e) => setEditingPlace({ ...editingPlace, address: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kota</label>
                  <select
                    value={editingPlace.city}
                    onChange={(e) => setEditingPlace({ ...editingPlace, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    {CITIES_LIST.filter((c) => c !== 'Semua Kota').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={editingPlace.category}
                    onChange={(e) =>
                      setEditingPlace({
                        ...editingPlace,
                        category: e.target.value as FoodCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Menu Andalan</label>
                <input
                  type="text"
                  value={editingPlace.signature_dish}
                  onChange={(e) =>
                    setEditingPlace({ ...editingPlace, signature_dish: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlace(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
