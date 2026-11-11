import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Link as LinkIcon, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Save, 
  ExternalLink, 
  RefreshCw, 
  Database, 
  Clock, 
  Check, 
  X,
  FileText,
  Sliders,
  ShieldCheck,
  MapPin,
  TrendingUp,
  Info
} from 'lucide-react';
import { FoodCategory, FoodPlace, ScraperJob, TikTokSource } from '../types';
import { executeScraper, ScrapedResultItem } from '../services/tiktokScraper';
import { CATEGORIES_LIST, CITIES_LIST } from '../services/sampleData';

interface TikTokScraperViewProps {
  existingPlaces: FoodPlace[];
  scraperJobs: ScraperJob[];
  onSaveScrapedToDatabase: (places: ScrapedResultItem[], keyword: string, url?: string) => Promise<void>;
}

export const TikTokScraperView: React.FC<TikTokScraperViewProps> = ({
  existingPlaces,
  scraperJobs,
  onSaveScrapedToDatabase,
}) => {
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [keyword, setKeyword] = useState('Kuliner Viral Bandung');
  const [isScraping, setIsScraping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTitle, setStepTitle] = useState('');
  const [stepDetail, setStepDetail] = useState('');

  const [scrapedResults, setScrapedResults] = useState<ScrapedResultItem[]>([]);
  const [editingItem, setEditingItem] = useState<ScrapedResultItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Quick preset keywords & URLs
  const sampleKeywords = [
    'Kuliner Viral Bandung',
    'Hidden Gem Puncak Bogor',
    'Sate Maranggi Tol Cipularang',
    'Bakso Enak Pantura Cirebon',
    'Kuliner Malam Semarang',
  ];

  const handleStartScraping = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tiktokUrl.trim() && !keyword.trim()) return;

    setIsScraping(true);
    setCurrentStep(1);

    try {
      const results = await executeScraper({
        url: tiktokUrl,
        keyword: keyword,
        existingPlaces,
        onProgress: (step, title, detail) => {
          setCurrentStep(step);
          setStepTitle(title);
          setStepDetail(detail);
        },
      });

      setScrapedResults(results);
    } catch (err) {
      console.error('Scraping error', err);
    } finally {
      setIsScraping(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (tempId: string) => {
    setScrapedResults((prev) =>
      prev.map((item) =>
        item.temp_id === tempId
          ? { ...item, selected_for_save: !item.selected_for_save }
          : item
      )
    );
  };

  // Toggle manual verification
  const handleToggleVerify = (tempId: string) => {
    setScrapedResults((prev) =>
      prev.map((item) =>
        item.temp_id === tempId
          ? {
              ...item,
              needs_manual_verification: !item.needs_manual_verification,
              selected_for_save: true, // auto select if verified
            }
          : item
      )
    );
  };

  // Delete item from table
  const handleDeleteItem = (tempId: string) => {
    setScrapedResults((prev) => prev.filter((i) => i.temp_id !== tempId));
  };

  // Save edited modal item
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setScrapedResults((prev) =>
      prev.map((i) => (i.temp_id === editingItem.temp_id ? editingItem : i))
    );
    setEditingItem(null);
  };

  // Save selected to Supabase database
  const handleSaveToDatabase = async () => {
    const selected = scrapedResults.filter((i) => i.selected_for_save);
    if (selected.length === 0) return;

    // Check if any selected item still needs verification
    const unverifiedSelected = selected.filter((i) => i.needs_manual_verification);
    if (unverifiedSelected.length > 0) {
      const proceed = confirm(
        `Terdapat ${unverifiedSelected.length} data yang masih berstatus 'Perlu Verifikasi'. Apakah Anda yakin ingin tetap menyimpannya ke database?`
      );
      if (!proceed) return;
    }

    setIsSaving(true);
    try {
      await onSaveScrapedToDatabase(selected, keyword, tiktokUrl);
      setSaveSuccessNotice(
        `Berhasil menyimpan ${selected.length} data kuliner ke database Supabase!`
      );
      // Remove saved items from staging table
      setScrapedResults((prev) => prev.filter((i) => !i.selected_for_save));
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Save to database error', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Halaman Khusus Administrator & Scraper Resmi</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            TikTok Video & Content Scraper
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Ekstraksi otomatis nama tempat, alamat, koordinat geospasial, dan menu viral dari video TikTok dengan metode oEmbed dan validasi duplikasi cerdas sebelum disimpan ke Supabase PostgreSQL.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Success notification banner */}
      {saveSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-semibold shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button onClick={() => setSaveSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scraper Input Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Parameter Scraping TikTok</h3>
              <p className="text-xs text-slate-500">Masukkan URL video langsung atau kata kunci pencarian</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleStartScraping} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input URL TikTok */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>URL Video TikTok (Opsional)</span>
              </label>
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@creator/video/123456789..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-slate-800"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Jika diisi, sistem akan membaca oEmbed metadata video resmi tersebut.
              </span>
            </div>

            {/* Input Keyword */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Keyword Pencarian Kuliner</span>
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Contoh: Kuliner Viral Bandung, Sate Maranggi, dsb"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Topik kuliner viral untuk diekstraksi ke basis data.
              </span>
            </div>

          </div>

          {/* Quick preset keywords chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-400 mr-1">Rekomendasi Keyword:</span>
            {sampleKeywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => setKeyword(kw)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors border border-slate-200"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-3 flex items-center justify-end">
            <button
              type="submit"
              disabled={isScraping}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                isScraping
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {isScraping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Melakukan Scraping...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Scraping</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Real-time Scraping Stepper Progress */}
        {isScraping && (
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                Step {currentStep}/5: {stepTitle}
              </span>
              <span>{currentStep * 20}%</span>
            </div>

            {/* Progress line */}
            <div className="w-full bg-blue-200/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${currentStep * 20}%` }}
              />
            </div>

            <p className="text-xs text-blue-700 italic">{stepDetail}</p>
          </div>
        )}

      </div>

      {/* Scraped Results Section */}
      {scrapedResults.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">Hasil Ekstraksi Scraping</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {scrapedResults.length} Tempat Ditemukan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa nama tempat, alamat, status verifikasi dan duplikasi sebelum disimpan ke Supabase.
              </p>
            </div>

            {/* Bulk Save CTA */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allSelected = scrapedResults.every((i) => i.selected_for_save);
                  setScrapedResults((prev) =>
                    prev.map((i) => ({ ...i, selected_for_save: !allSelected }))
                  );
                }}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                Pilih Semua
              </button>

              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving || scrapedResults.filter((i) => i.selected_for_save).length === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>
                  Simpan ({scrapedResults.filter((i) => i.selected_for_save).length}) ke Database
                </span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">Pilih</th>
                  <th className="p-3">Nama Tempat & Menu</th>
                  <th className="p-3">Alamat Lengkap & Kota</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Sumber TikTok</th>
                  <th className="p-3">Status Verifikasi & Duplikasi</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scrapedResults.map((item) => (
                  <tr
                    key={item.temp_id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      item.is_duplicate ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected_for_save}
                        onChange={() => handleToggleSelect(item.temp_id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Name & Dish */}
                    <td className="p-3 font-medium">
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        🍲 {item.signature_dish}
                      </div>
                    </td>

                    {/* Address & City */}
                    <td className="p-3 max-w-xs">
                      <div className="text-slate-800 line-clamp-1">{item.address}</div>
                      <div className="text-[11px] text-blue-600 font-semibold">{item.city}</div>
                    </td>

                    {/* Category */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {item.category}
                      </span>
                    </td>

                    {/* TikTok Source */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.tiktok_creator}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{item.tiktok_views}</span>
                        <a
                          href={item.tiktok_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      </div>
                    </td>

                    {/* Duplicate & Verification Status */}
                    <td className="p-3">
                      <div className="space-y-1">
                        {item.is_duplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Duplikat Terdeteksi</span>
                          </span>
                        ) : null}

                        {item.needs_manual_verification ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] block">
                            <span>Perlu Verifikasi Manual</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Terverifikasi Lengkap</span>
                          </span>
                        )}

                        {item.verification_reason && (
                          <p className="text-[10px] text-slate-500 italic max-w-xs">
                            {item.verification_reason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleVerify(item.temp_id)}
                          title="Tandai Sudah Terverifikasi"
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            !item.needs_manual_verification
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          title="Edit Data"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.temp_id)}
                          title="Hapus dari daftar"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
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

        </div>
      )}

      {/* Scraper Jobs History & Statistics */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-900 text-base">Riwayat Proses Scraping (scraper_jobs)</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Tersimpan di Supabase</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Nama Task / Job</th>
                <th className="p-3">Keyword / Target</th>
                <th className="p-3 text-center">Total Scraped</th>
                <th className="p-3 text-center">Berhasil</th>
                <th className="p-3 text-center">Duplikat Terdeteksi</th>
                <th className="p-3">Status</th>
                <th className="p-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scraperJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{job.job_name}</td>
                  <td className="p-3 text-slate-600 font-medium">{job.keyword}</td>
                  <td className="p-3 text-center font-bold text-slate-800">{job.total_scraped}</td>
                  <td className="p-3 text-center font-bold text-emerald-600">{job.success_count}</td>
                  <td className="p-3 text-center font-bold text-rose-600">{job.duplicate_count}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {job.created_at ? new Date(job.created_at).toLocaleString('id-ID') : 'Baru saja'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal for Scraped Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Edit Data Kuliner Hasil Scraping</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Tempat</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={editingItem.address}
                  onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kota</label>
                  <select
                    value={editingItem.city}
                    onChange={(e) => setEditingItem({ ...editingItem, city: e.target.value })}
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
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
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
                <label className="font-semibold text-slate-700 block mb-1">Menu Unggulan</label>
                <input
                  type="text"
                  value={editingItem.signature_dish}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, signature_dish: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
