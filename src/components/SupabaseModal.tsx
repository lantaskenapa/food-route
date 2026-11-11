import React, { useState } from 'react';
import { X, Check, Copy, Database, ExternalLink, ShieldAlert, KeyRound, Globe, RefreshCw } from 'lucide-react';
import { getStoredSupabaseConfig, saveSupabaseConfig, SUPABASE_SQL_SCHEMA } from '../services/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'schema'>('connect');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    setSavedSuccess(true);
    onConfigSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Integrasi Database Supabase</h3>
              <p className="text-xs text-slate-500">PostgreSQL Cloud Database & Row-Level Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-white">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'connect'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Koneksi Kredensial</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Skrip SQL Tabel & Schema (4 Tabel)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'connect' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold block mb-1">💡 Terintegrasi dengan Mesin Reaktif:</span>
                Kuliner Trip siap pakai langsung dengan penyimpanan terverifikasi bawaan. Anda dapat menghubungkan URL proyek Supabase Anda sendiri kapan saja untuk sinkronisasi cloud multi-device.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzabcdefghijklm.supabase.co"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Dapat dilihat di Project Settings → API di dashboard Supabase Anda.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Supabase Anon Public API Key
                </label>
                <textarea
                  rows={2}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  Buka Supabase Dashboard <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Berhasil Tersimpan!</span>
                    </>
                  ) : (
                    <span>Simpan & Hubungkan</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">PostgreSQL DDL Migration Script</h4>
                  <p className="text-[11px] text-slate-500">
                    Mencakup 4 tabel: <code className="text-blue-600">food_places</code>, <code className="text-blue-600">tiktok_sources</code>, <code className="text-blue-600">scraper_jobs</code>, <code className="text-blue-600">user_profiles</code>
                  </p>
                </div>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-200 p-4 font-mono text-[11px] max-h-80 overflow-y-auto leading-relaxed">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Cara mengaktifkan di Supabase:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                  <li>Buka proyek Anda di Supabase → Menu <strong>SQL Editor</strong>.</li>
                  <li>Klik <strong>New Query</strong>, lalu tempel skrip SQL di atas.</li>
                  <li>Klik tombol <strong>Run</strong> untuk membuat tabel, indeks geospasial, dan kebijakan RLS.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Format: PostgreSQL 15+ · Row-Level Security Enabled</span>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900 font-medium">
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
